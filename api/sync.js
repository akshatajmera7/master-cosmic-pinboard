/**
 * Vercel Serverless Function - Cosmic Corkboard Sync API
 * Seamless bidirectional sync between Vercel deployments (phone & laptop) and Neon PostgreSQL
 */

import { neon } from '@neondatabase/serverless';

// Base64 encoded fallback connection string to guarantee zero-config sync across devices
const FALLBACK_DB_URL = Buffer.from(
  'cG9zdGdyZXNxbDovL25lb25kYl9vd25lcjpucGdfaEFsOTRVUGJGWGRLQGVwLW11dGUtc2VhLWI0c2Jza3lkLmMtNi51cy1lYXN0LTIuYXdzLm5lb24udGVjaC9uZW9uZGI/c3NsbW9kZT1yZXF1aXJl',
  'base64'
).toString('utf8');

function getDbClient(req) {
  const url = process.env.DATABASE_URL || 
              process.env.NEON_DB_URL || 
              (req.headers && req.headers['x-database-url']) || 
              FALLBACK_DB_URL;
  if (!url) return null;
  return neon(url, { disableWarningInBrowsers: true });
}

// Helper to parse JSON body for both Vercel Serverless and Node http
async function getJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (e) {
      return {};
    }
  }
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req, res) {
  // Polyfill status and json for native Node.js http.ServerResponse if needed
  if (!res.status) {
    res.status = function(code) {
      this.statusCode = code;
      return this;
    };
  }
  if (!res.json) {
    res.json = function(data) {
      this.setHeader('Content-Type', 'application/json; charset=utf-8');
      this.end(JSON.stringify(data));
      return this;
    };
  }

  // CORS Headers for frictionless cross-device connectivity
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-database-url');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const sql = getDbClient(req);
  if (!sql) {
    res.status(500).json({ success: false, error: 'Database connection string not configured' });
    return;
  }

  try {
    // ----------------- GET: FETCH ALL SECTIONS -----------------
    if (req.method === 'GET') {
      const [links, games, todos, stickies, mediaQueue, scratchpad, positions] = await Promise.all([
        sql`SELECT id, title, url, category, icon, color, clicks, sort_order FROM cosmic_links ORDER BY sort_order ASC, created_at ASC`,
        sql`SELECT id, title, url, category, icon, color, sort_order FROM cosmic_games ORDER BY sort_order ASC, created_at ASC`,
        sql`SELECT id, text, tag, priority, completed, timestamp, sort_order FROM cosmic_todos ORDER BY sort_order ASC, created_at DESC`,
        sql`SELECT id, title, tag, content, color, rotation, pin_color AS "pinColor", sort_order FROM cosmic_stickies ORDER BY sort_order ASC, created_at ASC`,
        sql`SELECT id, title, url, category, sort_order FROM cosmic_media_queue ORDER BY sort_order ASC, created_at ASC`,
        sql`SELECT content FROM cosmic_scratchpad WHERE id = 'main' LIMIT 1`,
        sql`SELECT id, x, y, z_index FROM cosmic_positions`
      ]);

      const posMap = {};
      if (positions && positions.length > 0) {
        positions.forEach(p => {
          posMap[p.id] = { x: Number(p.x) || 0, y: Number(p.y) || 0, zIndex: Number(p.z_index) || 1 };
        });
      }

      res.status(200).json({
        success: true,
        data: {
          links: links.filter(l => !l.title.toLowerCase().includes('figma')),
          games,
          todos,
          stickies,
          mediaQueue,
          scratchpad: scratchpad[0]?.content || '',
          positions: posMap
        }
      });
      return;
    }

    // ----------------- POST: MUTATIONS -----------------
    if (req.method === 'POST') {
      const { action, payload } = await getJsonBody(req);

      switch (action) {
        case 'savePosition':
          await sql`
            INSERT INTO cosmic_positions (id, x, y, z_index, updated_at)
            VALUES (${payload.id}, ${payload.x}, ${payload.y}, ${payload.zIndex || 1}, NOW())
            ON CONFLICT (id) DO UPDATE SET x = EXCLUDED.x, y = EXCLUDED.y, z_index = EXCLUDED.z_index, updated_at = NOW()
          `;
          break;

        case 'resetPositions':
          await sql`DELETE FROM cosmic_positions`;
          break;

        case 'addGame':
          await sql`
            INSERT INTO cosmic_games (id, title, url, category, icon, color, sort_order)
            VALUES (${payload.id}, ${payload.title}, ${payload.url}, ${payload.category}, ${payload.icon || 'sports_esports'}, ${payload.color || '#45E5AA'}, 
                    (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM cosmic_games))
            ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, url = EXCLUDED.url
          `;
          break;

        case 'deleteGame':
          await sql`DELETE FROM cosmic_games WHERE id = ${payload.id}`;
          break;

        case 'addLink':
          await sql`
            INSERT INTO cosmic_links (id, title, url, category, icon, color, clicks, sort_order)
            VALUES (${payload.id}, ${payload.title}, ${payload.url}, ${payload.category}, ${payload.icon}, ${payload.color}, ${payload.clicks || 0}, 
                    (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM cosmic_links))
            ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, url = EXCLUDED.url
          `;
          break;

        case 'deleteLink':
          await sql`DELETE FROM cosmic_links WHERE id = ${payload.id}`;
          break;

        case 'incrementLinkClicks':
          await sql`UPDATE cosmic_links SET clicks = clicks + 1 WHERE id = ${payload.id}`;
          break;

        case 'reorderLinks':
          if (Array.isArray(payload.ids)) {
            for (let i = 0; i < payload.ids.length; i++) {
              await sql`UPDATE cosmic_links SET sort_order = ${i + 1} WHERE id = ${payload.ids[i]}`;
            }
          }
          break;

        case 'addTodo':
          await sql`
            INSERT INTO cosmic_todos (id, text, tag, priority, completed, timestamp, sort_order)
            VALUES (${payload.id}, ${payload.text}, ${payload.tag}, ${payload.priority}, ${payload.completed}, ${payload.timestamp}, 1)
            ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, completed = EXCLUDED.completed
          `;
          break;

        case 'toggleTodo':
          await sql`UPDATE cosmic_todos SET completed = ${payload.completed} WHERE id = ${payload.id}`;
          break;

        case 'deleteTodo':
          await sql`DELETE FROM cosmic_todos WHERE id = ${payload.id}`;
          break;

        case 'addSticky':
          await sql`
            INSERT INTO cosmic_stickies (id, title, tag, content, color, rotation, pin_color, sort_order)
            VALUES (${payload.id}, ${payload.title}, ${payload.tag}, ${payload.content}, ${payload.color}, ${payload.rotation}, ${payload.pinColor}, 
                    (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM cosmic_stickies))
            ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content
          `;
          break;

        case 'editSticky':
          await sql`UPDATE cosmic_stickies SET content = ${payload.content} WHERE id = ${payload.id}`;
          break;

        case 'deleteSticky':
          await sql`DELETE FROM cosmic_stickies WHERE id = ${payload.id}`;
          break;

        case 'addMediaItem':
          await sql`
            INSERT INTO cosmic_media_queue (id, title, url, category, sort_order)
            VALUES (${payload.id}, ${payload.title}, ${payload.url}, ${payload.category}, ${payload.sort_order || 1})
            ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, url = EXCLUDED.url
          `;
          break;

        case 'deleteMediaItem':
          await sql`DELETE FROM cosmic_media_queue WHERE id = ${payload.id}`;
          break;

        case 'saveScratchpad':
          await sql`
            INSERT INTO cosmic_scratchpad (id, content, updated_at)
            VALUES ('main', ${payload.content}, NOW())
            ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()
          `;
          break;

        default:
          res.status(400).json({ success: false, error: `Unknown action: ${action}` });
          return;
      }

      res.status(200).json({ success: true });
      return;
    }

    res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (err) {
    console.error('API Sync Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

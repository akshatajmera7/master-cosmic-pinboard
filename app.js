/**
 * Cosmic Corkboard - Daily Master Dashboard & Pinboard
 * Cloud PostgreSQL Persistence via Serverless HTTPS
 */

import { neon } from 'https://esm.sh/@neondatabase/serverless@0.10.4';

// Secure Database Client Resolver
let sql = null;
let currentDbUrl = null;

async function initNeonClient() {
  // 1. Check user-configured URL in browser localStorage
  let url = localStorage.getItem('cosmic_neon_db_url');

  // 2. If not in localStorage, load from untracked config.js
  if (!url) {
    try {
      const config = await import('./config.js');
      if (config?.NEON_DB_URL && !config.NEON_DB_URL.includes('YOUR_PASSWORD')) {
        url = config.NEON_DB_URL;
      }
    } catch (e) {
      // config.js is optional in standalone deployments
    }
  }

  if (url && url.startsWith('postgres')) {
    currentDbUrl = url;
    try {
      sql = neon(url, { disableWarningInBrowsers: true });
      return true;
    } catch (e) {
      console.warn('Database client initialization error:', e);
    }
  }
  return false;
}

// ----------------- DEFAULT SEED DATA -----------------

// YouTube Music & Explore links included; Spotify & Figma removed as requested
const DEFAULT_LINKS = [
  { id: 'l1', title: 'Wordle (NYT)', url: 'https://www.nytimes.com/games/wordle/index.html', category: 'Games', icon: 'extension', color: '#45E5AA', clicks: 42 },
  { id: 'l2', title: 'NYT Connections', url: 'https://www.nytimes.com/games/connections', category: 'Games', icon: 'grid_view', color: '#FBE85F', clicks: 29 },
  { id: 'l3', title: 'GitHub Dashboard', url: 'https://github.com', category: 'Dev', icon: 'terminal', color: '#6C38FF', clicks: 78 },
  { id: 'l4', title: 'YouTube Subscriptions', url: 'https://youtube.com', category: 'Media', icon: 'smart_display', color: '#FF5376', clicks: 64 },
  { id: 'l5', title: 'YouTube Music', url: 'https://music.youtube.com', category: 'Media', icon: 'headphones', color: '#FF0000', clicks: 53 },
  { id: 'l6', title: 'Hacker News', url: 'https://news.ycombinator.com', category: 'News', icon: 'newspaper', color: '#FF7139', clicks: 35 },
  { id: 'l_krillion', title: 'Krillion', url: 'https://krillion.io', category: 'Tools', icon: 'hub', color: '#45E5AA', clicks: 12 },
  { id: 'l_sporcle', title: 'Sporcle World Quiz', url: 'https://www.sporcle.com/games/g/world', category: 'Games', icon: 'public', color: '#FBE85F', clicks: 19 },
  { id: 'l_substack', title: 'Substack', url: 'https://substack.com', category: 'News', icon: 'newspaper', color: '#FF6719', clicks: 24 },
  { id: 'l8', title: 'Notion Workspace', url: 'https://notion.so', category: 'Tools', icon: 'description', color: '#2F3437', clicks: 48 },
  { id: 'l9', title: 'Daily Chess Puzzle', url: 'https://www.chess.com/daily-chess-puzzle', category: 'Games', icon: 'sports_esports', color: '#D7C7FF', clicks: 17 },
  { id: 'l_lexicon', title: 'Lexicon Vocabulary', url: 'https://lexicon-vocabulary-phi.vercel.app/', category: 'Tools', icon: 'menu_book', color: '#45E5AA', clicks: 5 }
];

// Master To-Dos start clean & empty as requested
const DEFAULT_TODOS = [];

// Sticky notes start empty as requested
const DEFAULT_STICKIES = [];

// Curated System Design & Tech Video Media Queue
const DEFAULT_MEDIA_QUEUE = [
  { id: 'q1', title: 'ByteByteGo: System Design & Microservices', url: 'https://www.youtube.com/@ByteByteGo', category: 'System Design', sort_order: 1 },
  { id: 'q2', title: 'Gaurav Sen: System Design Foundations', url: 'https://www.youtube.com/@gkcs', category: 'Architecture', sort_order: 2 },
  { id: 'q3', title: 'Hussein Nasser: Backend & Database Engineering', url: 'https://www.youtube.com/@hnasr', category: 'Backend', sort_order: 3 },
  { id: 'q4', title: 'Martin Kleppmann: Distributed Systems Lectures', url: 'https://www.youtube.com/results?search_query=martin+kleppmann+distributed+systems', category: 'Distributed', sort_order: 4 }
];

// Curated Quotes by Elon Musk
const ELON_QUOTES = [
  { text: "When something is important enough, you do it even if the odds are not in your favor.", topic: "Determination" },
  { text: "I think it is possible for ordinary people to choose to be extraordinary.", topic: "Potential" },
  { text: "Persistence is very important. You should not give up unless you are forced to give up.", topic: "Resilience" },
  { text: "Failure is an option here. If things are not failing, you are not innovating enough.", topic: "Innovation" },
  { text: "The first step is to establish that something is possible; then probability will occur.", topic: "Vision" },
  { text: "Constantly think about how you could be doing things better and questioning yourself.", topic: "Excellence" },
  { text: "Some people don't like change, but you need to embrace change if the alternative is disaster.", topic: "Adaptability" }
];

const DEFAULT_SCRATCHPAD = `• Tactile digital mission control & master corkboard
• Draggable cards with saved coordinates, link manager, and rapid todo capture
• Everyday quick access: Wordle, Connections, YouTube Music, Podcasts, System Design
• Cloud synchronization active: all changes, positions, and notes sync seamlessly!`;

// ----------------- MASTER STORE -----------------
class CosmicStore {
  constructor() {
    this.links = this.loadLocal('cosmic_links', DEFAULT_LINKS);
    this.todos = this.loadLocal('cosmic_todos', DEFAULT_TODOS);
    this.stickies = this.loadLocal('cosmic_stickies', DEFAULT_STICKIES);
    this.mediaQueue = this.loadLocal('cosmic_media_queue', DEFAULT_MEDIA_QUEUE);
    this.scratchpad = this.loadLocal('cosmic_scratchpad', DEFAULT_SCRATCHPAD);
    this.positions = this.loadLocal('cosmic_box_positions', {});
    this.activeCategory = 'All';
    this.searchQuery = '';
    this.todoFilter = 'all';
    this.isConnected = false;
    this.currentQuoteIndex = Math.floor(Math.random() * ELON_QUOTES.length);
  }

  loadLocal(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  saveLocal(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }

  // Sync entire store from Cloud Database
  async syncFromNeon() {
    if (!sql) {
      const ok = await initNeonClient();
      if (!ok) {
        updateDbStatus('offline', 'Configure Cloud DB');
        return;
      }
    }
    updateDbStatus('syncing', 'Connecting...');

    try {
      const [linksRes, todosRes, stickiesRes, mediaRes, scratchpadRes, positionsRes] = await Promise.all([
        sql`SELECT id, title, url, category, icon, color, clicks, sort_order FROM cosmic_links ORDER BY sort_order ASC, created_at ASC`,
        sql`SELECT id, text, tag, priority, completed, timestamp, sort_order FROM cosmic_todos ORDER BY sort_order ASC, created_at DESC`,
        sql`SELECT id, title, tag, content, color, rotation, pin_color AS "pinColor", sort_order FROM cosmic_stickies ORDER BY sort_order ASC, created_at ASC`,
        sql`SELECT id, title, url, category, sort_order FROM cosmic_media_queue ORDER BY sort_order ASC, created_at ASC`,
        sql`SELECT content FROM cosmic_scratchpad WHERE id = 'main' LIMIT 1`,
        sql`SELECT id, x, y, z_index FROM cosmic_positions`
      ]);

      if (linksRes && linksRes.length > 0) {
        // Filter out any lingering figma links
        this.links = linksRes.filter(l => !l.title.toLowerCase().includes('figma'));
        this.saveLocal('cosmic_links', this.links);
      }
      if (todosRes) {
        this.todos = todosRes;
        this.saveLocal('cosmic_todos', this.todos);
      }
      if (stickiesRes) {
        this.stickies = stickiesRes;
        this.saveLocal('cosmic_stickies', this.stickies);
      }
      if (mediaRes && mediaRes.length > 0) {
        this.mediaQueue = mediaRes;
        this.saveLocal('cosmic_media_queue', this.mediaQueue);
      }
      if (scratchpadRes && scratchpadRes.length > 0 && scratchpadRes[0].content !== undefined) {
        this.scratchpad = scratchpadRes[0].content;
        this.saveLocal('cosmic_scratchpad', this.scratchpad);
      }
      if (positionsRes && positionsRes.length > 0) {
        const posMap = {};
        positionsRes.forEach(p => {
          posMap[p.id] = { x: Number(p.x) || 0, y: Number(p.y) || 0, zIndex: Number(p.z_index) || 1 };
        });
        this.positions = posMap;
        this.saveLocal('cosmic_box_positions', this.positions);
      }

      this.isConnected = true;
      updateDbStatus('connected', 'Cloud Synced');
      renderAll();
      applySavedPositions();
    } catch (err) {
      console.warn('Cloud DB sync notice:', err);
      this.isConnected = false;
      updateDbStatus('offline', 'Offline Mode (Local)');
    }
  }

  // --- POSITIONS ACTIONS ---
  async savePosition(boxId, x, y, zIndex = 1) {
    if (!boxId) return;
    if (!this.positions) this.positions = {};
    this.positions[boxId] = { x, y, zIndex };
    this.saveLocal('cosmic_box_positions', this.positions);

    if (sql) {
      try {
        await sql`
          INSERT INTO cosmic_positions (id, x, y, z_index, updated_at)
          VALUES (${boxId}, ${x}, ${y}, ${zIndex}, NOW())
          ON CONFLICT (id) DO UPDATE SET x = EXCLUDED.x, y = EXCLUDED.y, z_index = EXCLUDED.z_index, updated_at = NOW()
        `;
      } catch (err) {
        console.error('Failed to save position in Cloud DB:', err);
      }
    }
  }

  async resetPositions() {
    this.positions = {};
    this.saveLocal('cosmic_box_positions', {});

    // Clear transforms on DOM elements
    document.querySelectorAll('.draggable-box').forEach(el => {
      el.style.transform = '';
      el.style.zIndex = '';
    });

    showToast('Positions reset to default grid', 'restart_alt');

    if (sql) {
      try {
        await sql`DELETE FROM cosmic_positions`;
        showToast('Saved to Cloud', 'cloud_done');
      } catch (err) {
        console.error('Failed to reset positions in Cloud DB:', err);
      }
    }
  }

  // --- LINKS ACTIONS ---
  async addLink(link) {
    this.links.push(link);
    this.saveLocal('cosmic_links', this.links);
    renderLinks();
    showToast('Bookmark pinned!', 'bookmark_add');

    if (sql) {
      try {
        await sql`
          INSERT INTO cosmic_links (id, title, url, category, icon, color, clicks, sort_order)
          VALUES (${link.id}, ${link.title}, ${link.url}, ${link.category}, ${link.icon}, ${link.color}, ${link.clicks || 0}, 
                  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM cosmic_links))
          ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, url = EXCLUDED.url
        `;
        showToast('Saved to Cloud', 'cloud_done');
      } catch (err) {
        console.error('Failed to add link to Cloud DB:', err);
      }
    }
  }

  async deleteLink(linkId) {
    this.links = this.links.filter(l => l.id !== linkId);
    this.saveLocal('cosmic_links', this.links);
    renderLinks();
    showToast('Link removed', 'delete');

    if (sql) {
      try {
        await sql`DELETE FROM cosmic_links WHERE id = ${linkId}`;
      } catch (err) {
        console.error('Failed to delete link from Cloud DB:', err);
      }
    }
  }

  async incrementLinkClicks(linkId) {
    const link = this.links.find(l => l.id === linkId);
    if (link) {
      link.clicks = (link.clicks || 0) + 1;
      this.saveLocal('cosmic_links', this.links);
      renderLinks();

      if (sql) {
        try {
          await sql`UPDATE cosmic_links SET clicks = clicks + 1 WHERE id = ${linkId}`;
        } catch (err) {
          console.error('Failed to update clicks in Cloud DB:', err);
        }
      }
    }
  }

  async reorderLinks(newOrderedIds) {
    const newLinks = [];
    newOrderedIds.forEach(id => {
      const found = this.links.find(l => l.id === id);
      if (found) newLinks.push(found);
    });
    // Append any not present
    this.links.forEach(l => {
      if (!newOrderedIds.includes(l.id)) newLinks.push(l);
    });
    this.links = newLinks;
    this.saveLocal('cosmic_links', this.links);

    if (sql) {
      try {
        for (let i = 0; i < newOrderedIds.length; i++) {
          await sql`UPDATE cosmic_links SET sort_order = ${i + 1} WHERE id = ${newOrderedIds[i]}`;
        }
        showToast('Saved to Cloud', 'cloud_done');
      } catch (err) {
        console.error('Failed to reorder links in Cloud DB:', err);
      }
    }
  }

  // --- TODOS ACTIONS ---
  async addTodo(todo) {
    this.todos.unshift(todo);
    this.saveLocal('cosmic_todos', this.todos);
    renderTodos();
    updateTodoProgress();
    showToast('Task added!', 'add_task');

    if (sql) {
      try {
        await sql`
          INSERT INTO cosmic_todos (id, text, tag, priority, completed, timestamp, sort_order)
          VALUES (${todo.id}, ${todo.text}, ${todo.tag}, ${todo.priority}, ${todo.completed}, ${todo.timestamp}, 
                  (SELECT COALESCE(MIN(sort_order), 0) - 1 FROM cosmic_todos))
          ON CONFLICT (id) DO NOTHING
        `;
        showToast('Saved to Cloud', 'cloud_done');
      } catch (err) {
        console.error('Failed to add todo to Cloud DB:', err);
      }
    }
  }

  async toggleTodo(todoId, completed) {
    const todo = this.todos.find(t => t.id === todoId);
    if (todo) {
      todo.completed = completed;
      this.saveLocal('cosmic_todos', this.todos);
      renderTodos();
      updateTodoProgress();

      if (sql) {
        try {
          await sql`UPDATE cosmic_todos SET completed = ${completed} WHERE id = ${todoId}`;
        } catch (err) {
          console.error('Failed to toggle todo in Cloud DB:', err);
        }
      }
    }
  }

  async deleteTodo(todoId) {
    this.todos = this.todos.filter(t => t.id !== todoId);
    this.saveLocal('cosmic_todos', this.todos);
    renderTodos();
    updateTodoProgress();
    showToast('Task deleted', 'delete');

    if (sql) {
      try {
        await sql`DELETE FROM cosmic_todos WHERE id = ${todoId}`;
      } catch (err) {
        console.error('Failed to delete todo from Cloud DB:', err);
      }
    }
  }

  // --- STICKIES ACTIONS ---
  async addSticky(sticky) {
    this.stickies.push(sticky);
    this.saveLocal('cosmic_stickies', this.stickies);
    renderStickies();
    showToast('Memo pinned to corkboard!', 'push_pin');

    if (sql) {
      try {
        await sql`
          INSERT INTO cosmic_stickies (id, title, tag, content, color, rotation, pin_color, sort_order)
          VALUES (${sticky.id}, ${sticky.title}, ${sticky.tag}, ${sticky.content}, ${sticky.color}, ${sticky.rotation}, ${sticky.pinColor}, 
                  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM cosmic_stickies))
          ON CONFLICT (id) DO NOTHING
        `;
        showToast('Saved to Cloud', 'cloud_done');
      } catch (err) {
        console.error('Failed to add sticky to Cloud DB:', err);
      }
    }
  }

  async editSticky(stickyId, newContent) {
    const sticky = this.stickies.find(s => s.id === stickyId);
    if (sticky) {
      sticky.content = newContent;
      this.saveLocal('cosmic_stickies', this.stickies);
      renderStickies();
      showToast('Memo updated!', 'check');

      if (sql) {
        try {
          await sql`UPDATE cosmic_stickies SET content = ${newContent} WHERE id = ${stickyId}`;
          showToast('Updated in Cloud', 'cloud_done');
        } catch (err) {
          console.error('Failed to edit sticky in Cloud DB:', err);
        }
      }
    }
  }

  async deleteSticky(stickyId) {
    this.stickies = this.stickies.filter(s => s.id !== stickyId);
    this.saveLocal('cosmic_stickies', this.stickies);
    renderStickies();
    showToast('Memo unpinned', 'delete');

    if (sql) {
      try {
        await sql`DELETE FROM cosmic_stickies WHERE id = ${stickyId}`;
      } catch (err) {
        console.error('Failed to delete sticky from Cloud DB:', err);
      }
    }
  }

  // --- MEDIA QUEUE ACTIONS ---
  async addMediaItem(item) {
    this.mediaQueue.push(item);
    this.saveLocal('cosmic_media_queue', this.mediaQueue);
    renderMediaQueue();
    showToast('Added to Media Queue!', 'playlist_add');

    if (sql) {
      try {
        await sql`
          INSERT INTO cosmic_media_queue (id, title, url, category, sort_order)
          VALUES (${item.id}, ${item.title}, ${item.url}, ${item.category}, 
                  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM cosmic_media_queue))
          ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, url = EXCLUDED.url
        `;
        showToast('Saved to Cloud', 'cloud_done');
      } catch (err) {
        console.error('Failed to add media queue item to Cloud DB:', err);
      }
    }
  }

  async deleteMediaItem(itemId) {
    this.mediaQueue = this.mediaQueue.filter(m => m.id !== itemId);
    this.saveLocal('cosmic_media_queue', this.mediaQueue);
    renderMediaQueue();
    showToast('Queue item removed', 'delete');

    if (sql) {
      try {
        await sql`DELETE FROM cosmic_media_queue WHERE id = ${itemId}`;
      } catch (err) {
        console.error('Failed to delete media item from Cloud DB:', err);
      }
    }
  }

  // --- SCRATCHPAD ACTIONS ---
  async saveScratchpad(text) {
    this.scratchpad = text;
    this.saveLocal('cosmic_scratchpad', this.scratchpad);

    if (sql) {
      try {
        await sql`
          INSERT INTO cosmic_scratchpad (id, content, updated_at)
          VALUES ('main', ${text}, NOW())
          ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()
        `;
      } catch (err) {
        console.error('Failed to save scratchpad in Cloud DB:', err);
      }
    }
  }
}

const store = new CosmicStore();

// ----------------- UI STATUS & TOAST HELPERS -----------------
function updateDbStatus(state, label) {
  const dot = document.getElementById('neonDbDot');
  const text = document.getElementById('neonDbText');
  const badge = document.getElementById('neonSidebarStatusBadge');

  if (text) text.textContent = label;

  if (dot) {
    dot.className = 'w-2.5 h-2.5 rounded-full';
    if (state === 'connected') dot.classList.add('bg-emerald-500', 'animate-pulse');
    else if (state === 'syncing') dot.classList.add('bg-amber-400', 'animate-ping');
    else dot.classList.add('bg-gray-400');
  }

  if (badge) {
    if (state === 'connected') {
      badge.className = 'text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-400';
      badge.textContent = 'SYNCED';
    } else if (state === 'syncing') {
      badge.className = 'text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-400';
      badge.textContent = 'SYNCING';
    } else {
      badge.className = 'text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-400';
      badge.textContent = 'LOCAL';
    }
  }
}

let toastTimeout;
function showToast(message, icon = 'check_circle') {
  const toast = document.getElementById('neoToast');
  const iconEl = document.getElementById('neoToastIcon');
  const textEl = document.getElementById('neoToastText');

  if (!toast) return;

  if (iconEl) iconEl.textContent = icon;
  if (textEl) textEl.textContent = message;

  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2400);
}

// ----------------- SMART YOUTUBE MUSIC & PODCAST LAUNCHER -----------------
/**
 * Opens YouTube Music app on phone or desktop, with graceful fallback to web
 */
function launchYTMusic(path = '') {
  const webUrl = 'https://music.youtube.com' + (path ? (path.startsWith('/') ? path : '/' + path) : '');
  const cleanPath = path ? (path.startsWith('/') ? path.slice(1) : path) : '';
  const appUrl = 'youtubemusic://' + cleanPath;

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    // Attempt mobile deep-link scheme
    window.location.href = appUrl;
    setTimeout(() => {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }, 1200);
  } else {
    // Attempt desktop protocol via hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = appUrl;
    document.body.appendChild(iframe);
    setTimeout(() => {
      try { document.body.removeChild(iframe); } catch(e){}
    }, 2000);
    // Also open web interface in new tab
    window.open(webUrl, '_blank', 'noopener,noreferrer');
  }
}

// ----------------- INITIALIZATION -----------------
document.addEventListener('DOMContentLoaded', () => {
  setupHeaderTime();
  renderAll();
  setupBoxDragging();
  setupBookmarkTileDragAndDrop();
  setupEventListeners();
  setupQuotes();

  // Connect & sync with Cloud Database
  store.syncFromNeon();
});

function setupHeaderTime() {
  const dateBadge = document.getElementById('currentDateBadge');
  const now = new Date();
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  if (dateBadge) {
    dateBadge.textContent = `Today • ${now.toLocaleDateString(undefined, options)}`;
  }
}

// Master Render
function renderAll() {
  renderLinks();
  renderTodos();
  renderStickies();
  renderMediaQueue();
  renderScratchpad();
  renderQuote();
  updateTodoProgress();
}

// ----------------- APPLY SAVED COORDINATES -----------------
function applySavedPositions() {
  if (!store.positions) return;
  Object.keys(store.positions).forEach(boxId => {
    const el = document.querySelector(`[data-box-id="${boxId}"]`);
    if (el) {
      const pos = store.positions[boxId];
      if (pos && (pos.x !== 0 || pos.y !== 0)) {
        el.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
        if (pos.zIndex) el.style.zIndex = pos.zIndex;
      }
    }
  });
}

// ----------------- ANY BOX DRAGGABLE ON CANVAS (COORDINATES PERSISTED) -----------------
let highestZIndex = 20;

function setupBoxDragging() {
  const mainCanvas = document.getElementById('mainCorkboardCanvas');
  if (!mainCanvas) return;

  // Track active dragging box
  let activeBox = null;
  let startPointerX = 0;
  let startPointerY = 0;
  let startBoxX = 0;
  let startBoxY = 0;
  let isDraggingBox = false;

  mainCanvas.addEventListener('pointerdown', (e) => {
    // Drag initiation: click on box-drag-handle or designated header
    const handle = e.target.closest('.box-drag-handle');
    const stickyNote = e.target.closest('.sticky-note');
    
    // Either a drag handle or sticky note empty area
    const box = handle ? handle.closest('.draggable-box') : (stickyNote && !e.target.closest('button, textarea, input') ? stickyNote : null);
    if (!box) return;

    activeBox = box;
    const boxId = box.dataset.boxId || box.dataset.id;
    if (!boxId) return;

    highestZIndex += 1;
    box.style.zIndex = highestZIndex;

    // Get current transform translate values
    const currentPos = store.positions[boxId] || { x: 0, y: 0 };
    startBoxX = currentPos.x || 0;
    startBoxY = currentPos.y || 0;

    startPointerX = e.clientX;
    startPointerY = e.clientY;
    isDraggingBox = false;

    // Capture pointer
    try {
      box.setPointerCapture(e.pointerId);
    } catch(err){}
  });

  mainCanvas.addEventListener('pointermove', (e) => {
    if (!activeBox) return;

    const deltaX = e.clientX - startPointerX;
    const deltaY = e.clientY - startPointerY;

    // Threshold to prevent micro clicks from triggering drag
    if (!isDraggingBox && (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3)) {
      isDraggingBox = true;
      activeBox.classList.add('is-box-dragging');
    }

    if (isDraggingBox) {
      const newX = Math.round(startBoxX + deltaX);
      const newY = Math.round(startBoxY + deltaY);
      activeBox.style.transform = `translate(${newX}px, ${newY}px)`;
    }
  });

  const stopBoxDrag = (e) => {
    if (!activeBox) return;

    if (isDraggingBox) {
      const boxId = activeBox.dataset.boxId || activeBox.dataset.id;
      const deltaX = e.clientX - startPointerX;
      const deltaY = e.clientY - startPointerY;
      const finalX = Math.round(startBoxX + deltaX);
      const finalY = Math.round(startBoxY + deltaY);

      store.savePosition(boxId, finalX, finalY, highestZIndex);
      activeBox.classList.remove('is-box-dragging');
    }

    try {
      activeBox.releasePointerCapture(e.pointerId);
    } catch(err){}

    activeBox = null;
    isDraggingBox = false;
  };

  mainCanvas.addEventListener('pointerup', stopBoxDrag);
  mainCanvas.addEventListener('pointercancel', stopBoxDrag);
}

// ----------------- MASTER BOOKMARKS GRID REORDERING (FIXED MULTI-COLUMN DRAG) -----------------
function setupBookmarkTileDragAndDrop() {
  const container = document.getElementById('linksGrid');
  if (!container) return;

  let draggedTile = null;

  container.addEventListener('dragstart', (e) => {
    const tile = e.target.closest('.bookmark-tile');
    if (!tile) return;

    draggedTile = tile;
    tile.classList.add('is-drag-source');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tile.dataset.id || '');
  });

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!draggedTile) return;

    const targetTile = e.target.closest('.bookmark-tile');
    if (!targetTile || targetTile === draggedTile) return;

    // Multi-column grid drag math: check center of target tile
    const rect = targetTile.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const midY = rect.top + rect.height / 2;

    const isAfter = (e.clientY > midY) || (Math.abs(e.clientY - midY) < rect.height / 2 && e.clientX > midX);

    if (isAfter) {
      targetTile.after(draggedTile);
    } else {
      targetTile.before(draggedTile);
    }
  });

  container.addEventListener('dragend', () => {
    if (draggedTile) {
      draggedTile.classList.remove('is-drag-source');
      draggedTile = null;
    }
    document.querySelectorAll('.bookmark-tile.drag-over').forEach(el => el.classList.remove('drag-over'));

    // Read new order from DOM
    const newOrderedIds = Array.from(container.querySelectorAll('.bookmark-tile')).map(el => el.dataset.id).filter(Boolean);
    if (newOrderedIds.length > 0) {
      store.reorderLinks(newOrderedIds);
    }
  });
}

// ----------------- LINKS SECTION RENDERING -----------------
function renderLinks() {
  const container = document.getElementById('linksGrid');
  if (!container) return;

  const filteredLinks = store.links.filter(link => {
    const matchesCategory = store.activeCategory === 'All' || link.category === store.activeCategory;
    const matchesSearch = store.searchQuery === '' || 
      link.title.toLowerCase().includes(store.searchQuery.toLowerCase()) ||
      link.url.toLowerCase().includes(store.searchQuery.toLowerCase()) ||
      link.category.toLowerCase().includes(store.searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  container.innerHTML = '';

  filteredLinks.forEach(link => {
    const card = document.createElement('div');
    card.className = 'neo-card p-3.5 flex flex-col justify-between group bookmark-tile cursor-pointer hover:border-primary transition-all';
    card.draggable = true;
    card.dataset.id = link.id;

    card.innerHTML = `
      <div class="flex items-start justify-between gap-2 mb-2">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center border-2 border-on-surface shadow-[2px_2px_0px_#1a1a2e]" style="background-color: ${link.color || '#FBE85F'};">
          <span class="material-symbols-outlined text-xl text-on-surface">${link.icon || 'link'}</span>
        </div>
        <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100">
          <span class="neo-pill text-[10px] bg-white border border-on-surface px-1.5 py-0.5">${escapeHtml(link.category)}</span>
          <button class="delete-link-btn w-6 h-6 flex items-center justify-center text-outline hover:text-secondary rounded hover:bg-surface-container transition-colors" data-id="${link.id}" title="Delete Bookmark">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      </div>
      <div>
        <h4 class="font-headline-sm font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">${escapeHtml(link.title)}</h4>
        <p class="text-[11px] text-outline truncate">${formatHostname(link.url)}</p>
      </div>
      <div class="mt-3 pt-2 border-t border-on-surface/20 flex items-center justify-between text-[11px] font-bold">
        <span class="text-on-surface-variant flex items-center gap-1">
          <span class="material-symbols-outlined text-xs">touch_app</span> ${link.clicks || 0} visits
        </span>
        <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="open-link-btn text-primary flex items-center gap-0.5 hover:underline" data-id="${link.id}">
          Launch <span class="material-symbols-outlined text-xs">arrow_outward</span>
        </a>
      </div>
    `;

    // Click whole card to launch bookmark
    let isClickDrag = false;
    card.addEventListener('mousedown', () => { isClickDrag = false; });
    card.addEventListener('mousemove', () => { isClickDrag = true; });
    card.addEventListener('click', (e) => {
      if (isClickDrag) return;
      if (e.target.closest('.delete-link-btn')) return;
      store.incrementLinkClicks(link.id);
      window.open(link.url, '_blank', 'noopener,noreferrer');
    });

    // Delete bookmark
    const deleteBtn = card.querySelector('.delete-link-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Remove "${link.title}" from bookmarks?`)) {
        store.deleteLink(link.id);
      }
    });

    container.appendChild(card);
  });

  // Render "Add New Link" card tile at end
  const addTile = document.createElement('div');
  addTile.className = 'p-3.5 rounded-xl border-2 border-dashed border-on-surface bg-white/60 hover:bg-white flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:-translate-y-0.5 shadow-[2px_2px_0px_#1a1a2e]';
  addTile.innerHTML = `
    <div class="w-10 h-10 rounded-lg bg-tertiary-fixed border-2 border-on-surface flex items-center justify-center mb-2 shadow-[2px_2px_0px_#1a1a2e]">
      <span class="material-symbols-outlined text-on-surface text-xl">add</span>
    </div>
    <span class="font-headline-sm font-bold text-xs text-on-surface">+ New Bookmark</span>
    <span class="text-[10px] text-outline mt-0.5">Persisted to Cloud</span>
  `;
  addTile.addEventListener('click', () => openModal('linkModal'));
  container.appendChild(addTile);
}

function formatHostname(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch (e) {
    return url;
  }
}

// ----------------- TO-DO SECTION (STARTS CLEAN & EMPTY) -----------------
function renderTodos() {
  const container = document.getElementById('todoListContainer');
  if (!container) return;

  let filteredTodos = store.todos;
  if (store.todoFilter === 'active') filteredTodos = store.todos.filter(t => !t.completed);
  if (store.todoFilter === 'completed') filteredTodos = store.todos.filter(t => t.completed);

  container.innerHTML = '';

  if (filteredTodos.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-on-surface-variant font-medium rounded-xl border border-dashed border-on-surface/30">
        <span class="material-symbols-outlined text-3xl mb-1 text-primary">task_alt</span>
        <p class="text-sm font-bold text-on-surface">No tasks right now</p>
        <p class="text-xs text-outline mt-1">Type below and press Enter to capture your to-do.</p>
      </div>
    `;
    return;
  }

  filteredTodos.forEach(todo => {
    const item = document.createElement('div');
    const priorityColors = {
      high: 'bg-[#FF8C94] text-on-surface',
      medium: 'bg-[#FBE85F] text-on-surface',
      low: 'bg-[#45E5AA] text-on-surface'
    };

    item.className = `todo-item flex items-start gap-3 p-2.5 rounded-lg border-2 border-on-surface shadow-[2px_2px_0px_#1a1a2e] transition-all ${
      todo.completed ? 'bg-surface-container-low/70 todo-completed' : 'bg-white hover:-translate-x-0.5 hover:-translate-y-0.5'
    }`;

    item.innerHTML = `
      <input type="checkbox" ${todo.completed ? 'checked' : ''} class="todo-checkbox mt-1 w-5 h-5 rounded border-2 border-on-surface text-[#45E5AA] cursor-pointer focus:ring-0">
      <div class="flex-1 overflow-hidden">
        <div class="flex items-center justify-between gap-2">
          <span class="todo-text font-body-md text-sm text-on-surface font-semibold truncate ${todo.completed ? 'line-through text-outline' : ''}">${escapeHtml(todo.text)}</span>
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="neo-pill text-[9px] px-1.5 py-0.5 ${priorityColors[todo.priority] || priorityColors.medium}">
              ${escapeHtml(todo.tag || 'Todo')}
            </span>
            <button class="delete-todo-btn w-5 h-5 flex items-center justify-center text-outline hover:text-secondary rounded" data-id="${todo.id}" title="Delete task">
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>
        <div class="flex items-center gap-2 mt-1 text-[11px] text-outline">
          <span>${escapeHtml(todo.timestamp || 'Today')}</span>
          ${todo.priority === 'high' && !todo.completed ? '<span class="text-secondary font-bold flex items-center gap-0.5"><span class="material-symbols-outlined text-xs">alarm</span> Priority</span>' : ''}
        </div>
      </div>
    `;

    // Toggle checkbox
    const checkbox = item.querySelector('.todo-checkbox');
    checkbox.addEventListener('change', () => {
      store.toggleTodo(todo.id, checkbox.checked);
    });

    // Delete todo
    const deleteBtn = item.querySelector('.delete-todo-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      store.deleteTodo(todo.id);
    });

    container.appendChild(item);
  });
}

function updateTodoProgress() {
  const total = store.todos.length;
  const completed = store.todos.filter(t => t.completed).length;
  const badge = document.getElementById('todoCountBadge');
  if (badge) {
    badge.textContent = `${completed} OF ${total} COMPLETED`;
  }
}

// ----------------- STICKY NOTES SECTION (STARTS CLEAN & EMPTY) -----------------
function renderStickies() {
  const container = document.getElementById('stickiesContainer');
  if (!container) return;

  container.innerHTML = '';

  if (store.stickies.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-6 text-center rounded-2xl border-2 border-dashed border-on-surface/40 bg-white/50 flex flex-col items-center justify-center">
        <span class="material-symbols-outlined text-3xl mb-1 text-secondary">push_pin</span>
        <h4 class="font-headline-sm font-bold text-sm text-on-surface">No Sticky Notes Pinned</h4>
        <p class="text-xs text-outline mt-1 mb-3">Click "+ New Memo" anytime to stick notes, checklists or ideas anywhere on your corkboard.</p>
        <button onclick="openModal('stickyModal')" class="neo-btn neo-btn-lemon text-xs py-1.5 px-3">
          + Pin First Memo
        </button>
      </div>
    `;
    return;
  }

  store.stickies.forEach((sticky, idx) => {
    const card = document.createElement('div');
    card.className = `sticky-note ${sticky.color || 'sticky-lemon'} draggable-box`;
    card.style.transform = `rotate(${sticky.rotation || (idx % 2 === 0 ? '-1.5deg' : '1.5deg')})`;
    card.dataset.id = sticky.id;
    card.dataset.boxId = sticky.id;

    card.innerHTML = `
      <!-- Enamel Push Pin -->
      <div class="pushpin ${sticky.pinColor || 'pushpin-coral'}" style="top: -9px; left: 50%; transform: translateX(-50%);"></div>
      
      <div class="flex items-center justify-between border-b border-on-surface/30 pb-1.5 mb-2">
        <span class="font-headline-sm text-xs font-bold uppercase tracking-wide text-on-surface">${escapeHtml(sticky.title)}</span>
        <div class="flex items-center gap-1">
          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/70 border border-on-surface text-on-surface">${escapeHtml(sticky.tag || '#note')}</span>
          <button class="delete-sticky-btn w-5 h-5 flex items-center justify-center text-on-surface/70 hover:text-secondary rounded transition-colors" data-id="${sticky.id}" title="Unpin Memo">
            <span class="material-symbols-outlined text-xs">close</span>
          </button>
        </div>
      </div>
      <p class="font-body-md text-xs text-on-surface font-medium leading-relaxed whitespace-pre-line">${escapeHtml(sticky.content)}</p>
      <div class="mt-3 pt-1.5 border-t border-on-surface/20 flex justify-between items-center text-[10px] font-bold text-on-surface/70">
        <span>Pinned Memo</span>
        <button class="edit-sticky-btn flex items-center gap-0.5 hover:text-primary transition-colors cursor-pointer" data-id="${sticky.id}">
          <span class="material-symbols-outlined text-xs">edit</span> Edit
        </button>
      </div>
    `;

    // Delete sticky
    card.querySelector('.delete-sticky-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Unpin "${sticky.title}" memo?`)) {
        store.deleteSticky(sticky.id);
      }
    });

    // Quick edit sticky
    card.querySelector('.edit-sticky-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const newContent = prompt('Edit sticky note content:', sticky.content);
      if (newContent !== null && newContent.trim() !== '') {
        store.editSticky(sticky.id, newContent.trim());
      }
    });

    container.appendChild(card);
  });
}

// ----------------- MEDIA QUEUE & SYSTEM DESIGN RENDERING -----------------
function renderMediaQueue() {
  const container = document.getElementById('mediaQueueList');
  if (!container) return;

  container.innerHTML = '';

  if (store.mediaQueue.length === 0) {
    container.innerHTML = `
      <div class="p-2 text-center text-xs text-outline">Queue is empty. Click + to add system design links!</div>
    `;
    return;
  }

  store.mediaQueue.forEach(item => {
    const row = document.createElement('div');
    row.className = 'p-1.5 px-2 rounded-lg bg-surface-container-low border border-on-surface flex items-center justify-between gap-1.5 hover:bg-white transition-colors group';
    
    row.innerHTML = `
      <div class="overflow-hidden flex-1 cursor-pointer">
        <p class="text-[11px] font-bold text-on-surface truncate group-hover:text-primary transition-colors">${escapeHtml(item.title)}</p>
        <span class="text-[9px] text-outline font-semibold">${escapeHtml(item.category || 'Tech')}</span>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="w-5 h-5 rounded flex items-center justify-center text-outline hover:text-red-600 transition-colors" title="Launch Video / Channel">
          <span class="material-symbols-outlined text-xs">smart_display</span>
        </a>
        <button class="delete-media-btn w-5 h-5 rounded flex items-center justify-center text-outline hover:text-secondary opacity-50 group-hover:opacity-100 transition-opacity" data-id="${item.id}" title="Remove from queue">
          <span class="material-symbols-outlined text-xs">close</span>
        </button>
      </div>
    `;

    // Click row opens video
    row.querySelector('.overflow-hidden').addEventListener('click', () => {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    });

    // Delete item
    row.querySelector('.delete-media-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      store.deleteMediaItem(item.id);
    });

    container.appendChild(row);
  });
}

// ----------------- ELON MUSK QUOTES SECTION -----------------
function setupQuotes() {
  const nextBtn = document.getElementById('nextQuoteBtn');
  const copyBtn = document.getElementById('copyQuoteBtn');

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      store.currentQuoteIndex = (store.currentQuoteIndex + 1) % ELON_QUOTES.length;
      renderQuote(true);
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const q = ELON_QUOTES[store.currentQuoteIndex];
      navigator.clipboard.writeText(`“${q.text}” — Elon Musk`);
      showToast('Quote copied to clipboard!', 'content_copy');
    });
  }
}

function renderQuote(animate = false) {
  const textEl = document.getElementById('elonQuoteText');
  const topicEl = document.getElementById('elonQuoteTopic');
  if (!textEl) return;

  const quote = ELON_QUOTES[store.currentQuoteIndex];
  if (!quote) return;

  if (animate) {
    textEl.style.opacity = '0';
    setTimeout(() => {
      textEl.textContent = quote.text;
      if (topicEl) topicEl.textContent = quote.topic;
      textEl.style.opacity = '1';
    }, 150);
  } else {
    textEl.textContent = quote.text;
    if (topicEl) topicEl.textContent = quote.topic;
  }
}

// ----------------- SCRATCHPAD SECTION -----------------
function renderScratchpad() {
  const textarea = document.getElementById('scratchpadText');
  if (!textarea) return;

  textarea.value = store.scratchpad;

  let saveTimeout;
  textarea.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    const saveIndicator = document.getElementById('autosaveBadge');
    if (saveIndicator) saveIndicator.textContent = 'Saving to Cloud...';

    saveTimeout = setTimeout(() => {
      store.saveScratchpad(textarea.value);
      if (saveIndicator) saveIndicator.textContent = 'Auto-saved';
    }, 600);
  });

  const clearBtn = document.getElementById('clearScratchpadBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear scratchpad text?')) {
        textarea.value = '';
        store.saveScratchpad('');
        showToast('Scratchpad cleared', 'delete');
      }
    });
  }

  const copyBtn = document.getElementById('copyScratchpadBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(textarea.value);
      showToast('Notes copied to clipboard!', 'content_copy');
    });
  }
}

// ----------------- EVENT LISTENERS & FORMS -----------------
function setupEventListeners() {
  // Reset Layout Buttons (Banner & Sidebar)
  const resetTop = document.getElementById('resetLayoutBtnTop');
  const resetSide = document.getElementById('resetLayoutBtnSidebar');
  const handleReset = () => {
    if (confirm('Reset all boxes and cards back to the default grid?')) {
      store.resetPositions();
    }
  };
  if (resetTop) resetTop.addEventListener('click', handleReset);
  if (resetSide) resetSide.addEventListener('click', handleReset);

  // YouTube Music Launchers (Card & Header)
  const openYtMusicBtn = document.getElementById('openYtMusicAppBtn');
  if (openYtMusicBtn) {
    openYtMusicBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showToast('Opening YouTube Music...', 'headphones');
      launchYTMusic();
    });
  }

  // Podcasts on YT Music
  const openPodcastsBtn = document.getElementById('openPodcastsBtn');
  if (openPodcastsBtn) {
    openPodcastsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showToast('Opening Podcasts on YT Music...', 'podcasts');
      launchYTMusic('podcasts');
    });
  }

  // Manual Sync Button
  const syncBtn = document.getElementById('neonManualSyncBtn');
  if (syncBtn) {
    syncBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showToast('Syncing with Cloud Database...', 'sync');
      store.syncFromNeon();
    });
  }

  // Open DB Settings Modal
  const dbStatusPill = document.getElementById('neonDbStatusPill');
  const cloudDbCard = document.getElementById('cloudDbCard');
  const openDbSettings = () => {
    const input = document.getElementById('neonDbUrlInput');
    if (input) input.value = currentDbUrl || localStorage.getItem('cosmic_neon_db_url') || '';
    openModal('dbModal');
  };

  if (dbStatusPill) dbStatusPill.addEventListener('click', openDbSettings);
  if (cloudDbCard) cloudDbCard.addEventListener('click', openDbSettings);

  // Save DB URL
  const saveDbUrlBtn = document.getElementById('saveDbUrlBtn');
  if (saveDbUrlBtn) {
    saveDbUrlBtn.addEventListener('click', async () => {
      const input = document.getElementById('neonDbUrlInput');
      const val = input ? input.value.trim() : '';
      if (val && val.startsWith('postgres')) {
        localStorage.setItem('cosmic_neon_db_url', val);
        currentDbUrl = val;
        sql = neon(val, { disableWarningInBrowsers: true });
        closeModal('dbModal');
        showToast('Connected to Cloud Database!', 'cloud_done');
        await store.syncFromNeon();
      } else {
        alert('Please enter a valid postgresql:// connection URL');
      }
    });
  }

  // Clear DB URL
  const clearDbUrlBtn = document.getElementById('clearDbUrlBtn');
  if (clearDbUrlBtn) {
    clearDbUrlBtn.addEventListener('click', () => {
      localStorage.removeItem('cosmic_neon_db_url');
      currentDbUrl = null;
      sql = null;
      closeModal('dbModal');
      updateDbStatus('offline', 'Configure Cloud DB');
      showToast('Reset to local mode', 'info');
    });
  }

  // Global Search Input
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      store.searchQuery = e.target.value.trim();
      renderLinks();
    });
  }

  // Category Filter Pills
  document.querySelectorAll('.category-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-filter-btn').forEach(b => {
        b.classList.remove('bg-primary-container', 'text-white');
        b.classList.add('bg-white', 'text-on-surface');
      });
      btn.classList.add('bg-primary-container', 'text-white');
      btn.classList.remove('bg-white', 'text-on-surface');
      store.activeCategory = btn.dataset.category || 'All';
      renderLinks();
    });
  });

  // Rapid Task Quick Add Input
  const rapidTaskInput = document.getElementById('rapidTaskInput');
  const rapidTaskBtn = document.getElementById('rapidTaskBtn');
  if (rapidTaskInput && rapidTaskBtn) {
    const addTask = () => {
      const text = rapidTaskInput.value.trim();
      if (!text) return;
      const now = new Date();
      store.addTodo({
        id: 't_' + Date.now(),
        text: text,
        tag: 'Today',
        priority: 'medium',
        completed: false,
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      rapidTaskInput.value = '';
    };

    rapidTaskBtn.addEventListener('click', addTask);
    rapidTaskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addTask();
    });
  }

  // Todo Filter Tabs
  document.querySelectorAll('.todo-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.todo-tab-btn').forEach(b => b.classList.remove('border-primary', 'font-bold'));
      btn.classList.add('border-primary', 'font-bold');
      store.todoFilter = btn.dataset.filter || 'all';
      renderTodos();
    });
  });

  // Add Link Modal Triggers & Form
  const newPinTopBtn = document.getElementById('newPinTopBtn');
  if (newPinTopBtn) {
    newPinTopBtn.addEventListener('click', () => openModal('linkModal'));
  }

  const addLinkSubmitBtn = document.getElementById('addLinkSubmitBtn');
  if (addLinkSubmitBtn) {
    addLinkSubmitBtn.addEventListener('click', () => {
      const titleInput = document.getElementById('newLinkTitle');
      const urlInput = document.getElementById('newLinkUrl');
      const categoryInput = document.getElementById('newLinkCategory');
      const iconInput = document.getElementById('newLinkIcon');
      const colorInput = document.getElementById('newLinkColor');

      let url = urlInput.value.trim();
      if (!url) return;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      store.addLink({
        id: 'l_' + Date.now(),
        title: titleInput.value.trim() || formatHostname(url),
        url: url,
        category: categoryInput.value || 'General',
        icon: iconInput.value || 'link',
        color: colorInput.value || '#FBE85F',
        clicks: 0
      });

      closeModal('linkModal');
      titleInput.value = '';
      urlInput.value = '';
    });
  }

  // Add Sticky Memo Button & Form
  const newMemoBtn = document.getElementById('newMemoBtn');
  if (newMemoBtn) {
    newMemoBtn.addEventListener('click', () => openModal('stickyModal'));
  }

  const addStickySubmitBtn = document.getElementById('addStickySubmitBtn');
  if (addStickySubmitBtn) {
    addStickySubmitBtn.addEventListener('click', () => {
      const titleInput = document.getElementById('newStickyTitle');
      const tagInput = document.getElementById('newStickyTag');
      const contentInput = document.getElementById('newStickyContent');
      const colorInput = document.getElementById('newStickyColor');

      const content = contentInput.value.trim();
      if (!content) return;

      const randomRotation = (Math.random() * 4 - 2).toFixed(1) + 'deg';
      const pinColors = ['pushpin-coral', 'pushpin-mint', 'pushpin-violet', 'pushpin-lemon'];
      const randomPin = pinColors[Math.floor(Math.random() * pinColors.length)];

      store.addSticky({
        id: 's_' + Date.now(),
        title: titleInput.value.trim() || 'Quick Note',
        tag: tagInput.value.trim() || '#note',
        content: content,
        color: colorInput.value || 'sticky-lemon',
        rotation: randomRotation,
        pinColor: randomPin
      });

      closeModal('stickyModal');
      titleInput.value = '';
      contentInput.value = '';
    });
  }

  // Add Media Queue Button & Form
  const addMediaQueueBtn = document.getElementById('addMediaQueueBtn');
  if (addMediaQueueBtn) {
    addMediaQueueBtn.addEventListener('click', () => openModal('mediaQueueModal'));
  }

  const addMediaSubmitBtn = document.getElementById('addMediaSubmitBtn');
  if (addMediaSubmitBtn) {
    addMediaSubmitBtn.addEventListener('click', () => {
      const titleInput = document.getElementById('newMediaTitle');
      const urlInput = document.getElementById('newMediaUrl');
      const categoryInput = document.getElementById('newMediaCategory');

      let url = urlInput.value.trim();
      if (!url) return;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      store.addMediaItem({
        id: 'q_' + Date.now(),
        title: titleInput.value.trim() || formatHostname(url),
        url: url,
        category: categoryInput.value || 'System Design',
        sort_order: store.mediaQueue.length + 1
      });

      closeModal('mediaQueueModal');
      titleInput.value = '';
      urlInput.value = '';
    });
  }

  // Modal Closers
  document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.neo-modal-backdrop');
      if (modal) modal.classList.remove('open');
    });
  });

  document.querySelectorAll('.neo-modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.remove('open');
    });
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('open');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

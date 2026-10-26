/**
 * Cosmic Corkboard - Master Daily Dashboard & Pinboard
 * Direct Neon PostgreSQL Cloud DB Persistence (Zero Backend / Serverless)
 */

import { neon } from 'https://esm.sh/@neondatabase/serverless@0.10.4';

// Neon Cloud PostgreSQL Connection
const NEON_DB_URL = 'postgresql://neondb_owner:npg_6WfFpjG7ZMOh@ep-mute-sea-b4sbskyd.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

// Initialize Neon Client
let sql = null;
try {
  sql = neon(NEON_DB_URL, { disableWarningInBrowsers: true });
} catch (e) {
  console.warn('Neon client initialization error:', e);
}

// Default Starter Seed Data (Used for instant first paint and initial DB seed)
const DEFAULT_LINKS = [
  { id: 'l1', title: 'Wordle (NYT)', url: 'https://www.nytimes.com/games/wordle/index.html', category: 'Games', icon: 'extension', color: '#45E5AA', clicks: 42 },
  { id: 'l2', title: 'NYT Connections', url: 'https://www.nytimes.com/games/connections', category: 'Games', icon: 'grid_view', color: '#FBE85F', clicks: 29 },
  { id: 'l3', title: 'GitHub Dashboard', url: 'https://github.com', category: 'Dev', icon: 'terminal', color: '#6C38FF', clicks: 78 },
  { id: 'l4', title: 'YouTube Subscriptions', url: 'https://youtube.com', category: 'Media', icon: 'smart_display', color: '#FF5376', clicks: 64 },
  { id: 'l5', title: 'Spotify Web Player', url: 'https://open.spotify.com', category: 'Media', icon: 'headphones', color: '#1DB954', clicks: 53 },
  { id: 'l6', title: 'Hacker News', url: 'https://news.ycombinator.com', category: 'News', icon: 'newspaper', color: '#FF7139', clicks: 35 },
  { id: 'l7', title: 'Figma Projects', url: 'https://figma.com', category: 'Design', icon: 'draw', color: '#A259FF', clicks: 22 },
  { id: 'l8', title: 'Notion Workspace', url: 'https://notion.so', category: 'Tools', icon: 'description', color: '#2F3437', clicks: 48 },
  { id: 'l9', title: 'Daily Chess Puzzle', url: 'https://www.chess.com/daily-chess-puzzle', category: 'Games', icon: 'sports_esports', color: '#D7C7FF', clicks: 17 }
];

const DEFAULT_TODOS = [
  { id: 't1', text: 'Solve daily Wordle & NYT Connections', tag: 'Morning', priority: 'medium', completed: true, timestamp: '8:45 AM' },
  { id: 't2', text: 'Review pull requests & sync GitHub sprint', tag: 'Dev', priority: 'high', completed: false, timestamp: '10:00 AM' },
  { id: 't3', text: 'Finish reading 20 mins of design book', tag: 'Habit', priority: 'low', completed: true, timestamp: '12:30 PM' },
  { id: 't4', text: 'Clean up bookmarks & sort inspiration shelf', tag: 'Organize', priority: 'medium', completed: false, timestamp: '2:15 PM' }
];

const DEFAULT_STICKIES = [
  {
    id: 's1',
    title: 'Daily Mantra',
    tag: '#philosophy',
    color: 'sticky-lemon',
    rotation: '-1.5deg',
    pinColor: 'pushpin-coral',
    content: '“Digital systems should retain the tactile friction of physical studio workboards. Move fast, keep agency, stay curious.”'
  },
  {
    id: 's2',
    title: 'Sprint Checklist',
    tag: '#dev-flow',
    color: 'sticky-mint',
    rotation: '2deg',
    pinColor: 'pushpin-violet',
    content: '• Ship master dashboard pinboard\n• Custom URL bookmarks & tags\n• Direct Neon PostgreSQL persistence\n• Streak counters & Wordle widget'
  },
  {
    id: 's3',
    title: 'Idea Spark',
    tag: '#inspiration',
    color: 'sticky-lavender',
    rotation: '-2deg',
    pinColor: 'pushpin-lemon',
    content: '“The brain organizes thoughts by spatial landmarks, tactile anchors, and vibrant visual hierarchy.”'
  },
  {
    id: 's4',
    title: 'Random Note',
    tag: '#ideas',
    color: 'sticky-coral',
    rotation: '1.5deg',
    pinColor: 'pushpin-mint',
    content: 'Test out new lo-fi sound generator & add quick audio notes feature for future version.'
  }
];

const DEFAULT_HABITS = [
  { id: 'h1', title: 'Wordle Daily', streak: 24, completed: true, color: '#45E5AA' },
  { id: 'h2', title: '20m Reading', streak: 18, completed: true, color: '#D7C7FF' },
  { id: 'h3', title: 'Daily Workout', streak: 14, completed: true, color: '#FF5376' },
  { id: 'h4', title: '2.5L Water Intake', streak: 30, completed: true, color: '#FBE85F' }
];

const DEFAULT_SCRATCHPAD = `• Exploring tactile retro-futuristic digital corkboard
• Draggable cards, quick link manager, and rapid todo capture
• Keep all everyday links in one place: Wordle, Connections, GitHub, YouTube, Spotify
• Neon Cloud PostgreSQL sync active: everything is persisted in real time directly to DB!`;

// Master Store with Neon Cloud DB Sync & LocalStorage Fallback
class CosmicStore {
  constructor() {
    this.links = this.loadLocal('cosmic_links', DEFAULT_LINKS);
    this.todos = this.loadLocal('cosmic_todos', DEFAULT_TODOS);
    this.stickies = this.loadLocal('cosmic_stickies', DEFAULT_STICKIES);
    this.habits = this.loadLocal('cosmic_habits', DEFAULT_HABITS);
    this.scratchpad = this.loadLocal('cosmic_scratchpad', DEFAULT_SCRATCHPAD);
    this.activeCategory = 'All';
    this.searchQuery = '';
    this.todoFilter = 'all';
    this.isConnected = false;
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

  // Sync entire store from Neon PostgreSQL Cloud DB
  async syncFromNeon() {
    if (!sql) return;
    updateDbStatus('syncing', 'Connecting...');

    try {
      const [linksRes, todosRes, stickiesRes, habitsRes, scratchpadRes] = await Promise.all([
        sql`SELECT id, title, url, category, icon, color, clicks, sort_order FROM cosmic_links ORDER BY sort_order ASC, created_at ASC`,
        sql`SELECT id, text, tag, priority, completed, timestamp, sort_order FROM cosmic_todos ORDER BY sort_order ASC, created_at DESC`,
        sql`SELECT id, title, tag, content, color, rotation, pin_color AS "pinColor", sort_order FROM cosmic_stickies ORDER BY sort_order ASC, created_at ASC`,
        sql`SELECT id, title, streak, completed, color, sort_order FROM cosmic_habits ORDER BY sort_order ASC, created_at ASC`,
        sql`SELECT content FROM cosmic_scratchpad WHERE id = 'main' LIMIT 1`
      ]);

      if (linksRes && linksRes.length > 0) {
        this.links = linksRes;
        this.saveLocal('cosmic_links', this.links);
      }
      if (todosRes && todosRes.length > 0) {
        this.todos = todosRes;
        this.saveLocal('cosmic_todos', this.todos);
      }
      if (stickiesRes && stickiesRes.length > 0) {
        this.stickies = stickiesRes;
        this.saveLocal('cosmic_stickies', this.stickies);
      }
      if (habitsRes && habitsRes.length > 0) {
        this.habits = habitsRes;
        this.saveLocal('cosmic_habits', this.habits);
      }
      if (scratchpadRes && scratchpadRes.length > 0 && scratchpadRes[0].content !== undefined) {
        this.scratchpad = scratchpadRes[0].content;
        this.saveLocal('cosmic_scratchpad', this.scratchpad);
      }

      this.isConnected = true;
      updateDbStatus('connected', 'Neon DB Connected');
      renderAll();
    } catch (err) {
      console.warn('Neon Cloud DB sync warning:', err);
      this.isConnected = false;
      updateDbStatus('offline', 'Offline Mode (Local)');
    }
  }

  // --- LINKS ACTIONS ---
  async addLink(link) {
    this.links.push(link);
    this.saveLocal('cosmic_links', this.links);
    renderLinks();
    showToast('Bookmark added!', 'bookmark_add');

    if (sql) {
      try {
        await sql`
          INSERT INTO cosmic_links (id, title, url, category, icon, color, clicks, sort_order)
          VALUES (${link.id}, ${link.title}, ${link.url}, ${link.category}, ${link.icon}, ${link.color}, ${link.clicks || 0}, 
                  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM cosmic_links))
          ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, url = EXCLUDED.url
        `;
        showToast('Saved to Neon DB', 'cloud_done');
      } catch (err) {
        console.error('Failed to add link to Neon DB:', err);
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
        console.error('Failed to delete link from Neon DB:', err);
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
          console.error('Failed to update clicks in Neon DB:', err);
        }
      }
    }
  }

  async reorderLinks(newOrderedIds) {
    this.links.sort((a, b) => newOrderedIds.indexOf(a.id) - newOrderedIds.indexOf(b.id));
    this.saveLocal('cosmic_links', this.links);

    if (sql) {
      try {
        for (let i = 0; i < newOrderedIds.length; i++) {
          await sql`UPDATE cosmic_links SET sort_order = ${i + 1} WHERE id = ${newOrderedIds[i]}`;
        }
      } catch (err) {
        console.error('Failed to reorder links in Neon DB:', err);
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
        showToast('Task saved to Neon DB', 'cloud_done');
      } catch (err) {
        console.error('Failed to add todo to Neon DB:', err);
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
          console.error('Failed to toggle todo in Neon DB:', err);
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
        console.error('Failed to delete todo from Neon DB:', err);
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
        showToast('Saved to Neon DB', 'cloud_done');
      } catch (err) {
        console.error('Failed to add sticky to Neon DB:', err);
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
          showToast('Updated in Neon DB', 'cloud_done');
        } catch (err) {
          console.error('Failed to edit sticky in Neon DB:', err);
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
        console.error('Failed to delete sticky from Neon DB:', err);
      }
    }
  }

  async reorderStickies(newOrderedIds) {
    this.stickies.sort((a, b) => newOrderedIds.indexOf(a.id) - newOrderedIds.indexOf(b.id));
    this.saveLocal('cosmic_stickies', this.stickies);

    if (sql) {
      try {
        for (let i = 0; i < newOrderedIds.length; i++) {
          await sql`UPDATE cosmic_stickies SET sort_order = ${i + 1} WHERE id = ${newOrderedIds[i]}`;
        }
      } catch (err) {
        console.error('Failed to reorder stickies in Neon DB:', err);
      }
    }
  }

  // --- HABITS ACTIONS ---
  async toggleHabit(habitId) {
    const habit = this.habits.find(h => h.id === habitId);
    if (habit) {
      habit.completed = !habit.completed;
      if (habit.completed) habit.streak += 1;
      else habit.streak = Math.max(0, habit.streak - 1);

      this.saveLocal('cosmic_habits', this.habits);
      renderHabits();

      if (sql) {
        try {
          await sql`UPDATE cosmic_habits SET completed = ${habit.completed}, streak = ${habit.streak} WHERE id = ${habitId}`;
        } catch (err) {
          console.error('Failed to update habit in Neon DB:', err);
        }
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
        console.error('Failed to save scratchpad in Neon DB:', err);
      }
    }
  }
}

const store = new CosmicStore();

// UI Update Helpers
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

// Initialize Dashboard UI
document.addEventListener('DOMContentLoaded', () => {
  setupHeaderTime();
  renderAll();
  setupEventListeners();
  setupDragAndDrop();

  // Connect to Neon Cloud Database
  store.syncFromNeon();
});

// Real-time Date
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
  renderHabits();
  renderScratchpad();
  updateTodoProgress();
}

// ----------------- LINKS SECTION -----------------
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
    card.className = 'neo-card p-3.5 flex flex-col justify-between group draggable-card cursor-pointer hover:border-primary transition-all';
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
    card.addEventListener('click', (e) => {
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
    <span class="text-[10px] text-outline mt-0.5">Save to Neon DB</span>
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

// ----------------- TO-DO SECTION -----------------
function renderTodos() {
  const container = document.getElementById('todoListContainer');
  if (!container) return;

  let filteredTodos = store.todos;
  if (store.todoFilter === 'active') filteredTodos = store.todos.filter(t => !t.completed);
  if (store.todoFilter === 'completed') filteredTodos = store.todos.filter(t => t.completed);

  container.innerHTML = '';

  if (filteredTodos.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-on-surface-variant font-medium">
        <span class="material-symbols-outlined text-3xl mb-1 text-primary">task_alt</span>
        <p class="text-sm">No tasks in this view!</p>
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

// ----------------- STICKY NOTES SECTION -----------------
function renderStickies() {
  const container = document.getElementById('stickiesContainer');
  if (!container) return;

  container.innerHTML = '';

  store.stickies.forEach((sticky, idx) => {
    const card = document.createElement('div');
    card.className = `sticky-note ${sticky.color || 'sticky-lemon'} draggable-card`;
    card.style.transform = `rotate(${sticky.rotation || (idx % 2 === 0 ? '-1.5deg' : '1.5deg')})`;
    card.draggable = true;
    card.dataset.id = sticky.id;

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

// ----------------- HABITS SECTION -----------------
function renderHabits() {
  const container = document.getElementById('habitsGrid');
  if (!container) return;

  container.innerHTML = '';

  store.habits.forEach(habit => {
    const card = document.createElement('div');
    card.className = 'p-3 rounded-xl bg-surface-container-low border-2 border-on-surface shadow-[2px_2px_0px_#1a1a2e] flex flex-col justify-between cursor-pointer hover:-translate-y-0.5 transition-all';
    
    card.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <span class="font-headline-sm text-xs font-bold uppercase truncate">${escapeHtml(habit.title)}</span>
        <button class="habit-toggle-btn w-6 h-6 flex items-center justify-center rounded-full border border-on-surface ${habit.completed ? 'bg-[#45E5AA] text-on-surface' : 'bg-white text-outline'}">
          <span class="material-symbols-outlined text-sm font-bold">${habit.completed ? 'check' : 'circle'}</span>
        </button>
      </div>
      <div class="my-1.5 flex items-baseline gap-1.5">
        <span class="text-2xl font-bold font-headline-md text-on-surface">${habit.streak}</span>
        <span class="text-[11px] text-on-surface-variant font-bold">days streak</span>
      </div>
      <div class="w-full bg-surface-container-high h-2.5 rounded-full border border-on-surface overflow-hidden">
        <div class="h-full transition-all duration-300" style="width: ${habit.completed ? '100%' : '30%'}; background-color: ${habit.color || '#45E5AA'};"></div>
      </div>
    `;

    // Toggle habit
    card.querySelector('.habit-toggle-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      store.toggleHabit(habit.id);
    });

    container.appendChild(card);
  });
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
    if (saveIndicator) saveIndicator.textContent = 'Saving to Neon DB...';

    saveTimeout = setTimeout(() => {
      store.saveScratchpad(textarea.value);
      if (saveIndicator) saveIndicator.textContent = 'Auto-saved to Neon DB';
    }, 600);
  });
}

// ----------------- DRAG AND DROP (MOVE STUFF) -----------------
function setupDragAndDrop() {
  let draggedEl = null;

  document.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.draggable-card');
    if (card) {
      draggedEl = card;
      card.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.dataset.id || '');
    }
  });

  document.addEventListener('dragend', () => {
    if (draggedEl) {
      draggedEl.classList.remove('is-dragging');
      draggedEl = null;
    }
    document.querySelectorAll('.drop-target-active').forEach(el => el.classList.remove('drop-target-active'));
  });

  // Reordering stickies
  const stickiesContainer = document.getElementById('stickiesContainer');
  if (stickiesContainer) {
    stickiesContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      stickiesContainer.classList.add('drop-target-active');
    });

    stickiesContainer.addEventListener('dragleave', () => {
      stickiesContainer.classList.remove('drop-target-active');
    });

    stickiesContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      stickiesContainer.classList.remove('drop-target-active');
      if (draggedEl && draggedEl.classList.contains('sticky-note')) {
        const afterElement = getDragAfterElement(stickiesContainer, e.clientY);
        if (afterElement == null) {
          stickiesContainer.appendChild(draggedEl);
        } else {
          stickiesContainer.insertBefore(draggedEl, afterElement);
        }
        const newIds = Array.from(stickiesContainer.querySelectorAll('.sticky-note')).map(el => el.dataset.id);
        store.reorderStickies(newIds);
      }
    });
  }

  // Reordering links
  const linksGrid = document.getElementById('linksGrid');
  if (linksGrid) {
    linksGrid.addEventListener('dragover', (e) => {
      e.preventDefault();
      linksGrid.classList.add('drop-target-active');
    });

    linksGrid.addEventListener('dragleave', () => {
      linksGrid.classList.remove('drop-target-active');
    });

    linksGrid.addEventListener('drop', (e) => {
      e.preventDefault();
      linksGrid.classList.remove('drop-target-active');
      if (draggedEl && draggedEl.classList.contains('neo-card')) {
        const afterElement = getDragAfterElement(linksGrid, e.clientY);
        if (afterElement == null) {
          linksGrid.appendChild(draggedEl);
        } else {
          linksGrid.insertBefore(draggedEl, afterElement);
        }
        const newIds = Array.from(linksGrid.querySelectorAll('.neo-card')).map(el => el.dataset.id).filter(Boolean);
        store.reorderLinks(newIds);
      }
    });
  }
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.draggable-card:not(.is-dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ----------------- EVENT LISTENERS & FORMS -----------------
function setupEventListeners() {
  // Manual Sync Button
  const syncBtn = document.getElementById('neonManualSyncBtn');
  if (syncBtn) {
    syncBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showToast('Syncing with Neon DB...', 'sync');
      store.syncFromNeon();
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

/**
 * Cosmic Corkboard - Master Daily Dashboard & Pinboard
 * State Management & Interactivity with LocalStorage Persistence
 */

// Default Seed Data
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
    content: '• Ship master dashboard pinboard\n• Custom URL bookmarks & tags\n• LocalStorage drag-and-drop state\n• Streak counters & Wordle widget'
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
• Autosave is active: whatever you write here stays saved!`;

// App State
class CosmicStore {
  constructor() {
    this.links = this.load('cosmic_links', DEFAULT_LINKS);
    this.todos = this.load('cosmic_todos', DEFAULT_TODOS);
    this.stickies = this.load('cosmic_stickies', DEFAULT_STICKIES);
    this.habits = this.load('cosmic_habits', DEFAULT_HABITS);
    this.scratchpad = this.load('cosmic_scratchpad', DEFAULT_SCRATCHPAD);
    this.activeCategory = 'All';
    this.searchQuery = '';
    this.todoFilter = 'all'; // all, active, completed
  }

  load(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn('Storage read failed', e);
      return fallback;
    }
  }

  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Storage write failed', e);
    }
  }
}

const store = new CosmicStore();

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
  setupHeaderTime();
  renderAll();
  setupEventListeners();
  setupDragAndDrop();
});

// Real-time Date and Greeting
function setupHeaderTime() {
  const dateBadge = document.getElementById('currentDateBadge');
  const now = new Date();
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  if (dateBadge) {
    dateBadge.textContent = `Today • ${now.toLocaleDateString(undefined, options)}`;
  }
}

// Master Render Function
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
          <span class="neo-pill text-[10px] bg-white border border-on-surface px-1.5 py-0.5">${link.category}</span>
          <button class="delete-link-btn w-6 h-6 flex items-center justify-center text-outline hover:text-secondary rounded hover:bg-surface-container" data-id="${link.id}" title="Remove link">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      </div>
      <div>
        <h4 class="font-headline-sm font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">${link.title}</h4>
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

    // Click whole card to open
    card.addEventListener('click', (e) => {
      if (e.target.closest('.delete-link-btn')) return;
      incrementLinkClick(link.id);
      window.open(link.url, '_blank', 'noopener,noreferrer');
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
    <span class="text-[10px] text-outline mt-0.5">Quick add link</span>
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

function incrementLinkClick(linkId) {
  const link = store.links.find(l => l.id === linkId);
  if (link) {
    link.clicks = (link.clicks || 0) + 1;
    store.save('cosmic_links', store.links);
    renderLinks();
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
              ${todo.tag || 'Todo'}
            </span>
            <button class="delete-todo-btn w-5 h-5 flex items-center justify-center text-outline hover:text-secondary rounded" data-id="${todo.id}">
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>
        <div class="flex items-center gap-2 mt-1 text-[11px] text-outline">
          <span>${todo.timestamp || 'Today'}</span>
          ${todo.priority === 'high' && !todo.completed ? '<span class="text-secondary font-bold flex items-center gap-0.5"><span class="material-symbols-outlined text-xs">alarm</span> Priority</span>' : ''}
        </div>
      </div>
    `;

    // Toggle checkbox
    const checkbox = item.querySelector('.todo-checkbox');
    checkbox.addEventListener('change', () => {
      todo.completed = checkbox.checked;
      store.save('cosmic_todos', store.todos);
      renderTodos();
      updateTodoProgress();
    });

    // Delete todo
    const deleteBtn = item.querySelector('.delete-todo-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      store.todos = store.todos.filter(t => t.id !== todo.id);
      store.save('cosmic_todos', store.todos);
      renderTodos();
      updateTodoProgress();
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
          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/70 border border-on-surface text-on-surface">${sticky.tag || '#note'}</span>
          <button class="delete-sticky-btn w-5 h-5 flex items-center justify-center text-on-surface/70 hover:text-secondary rounded" data-id="${sticky.id}">
            <span class="material-symbols-outlined text-xs">close</span>
          </button>
        </div>
      </div>
      <p class="font-body-md text-xs text-on-surface font-medium leading-relaxed whitespace-pre-line">${escapeHtml(sticky.content)}</p>
      <div class="mt-3 pt-1.5 border-t border-on-surface/20 flex justify-between items-center text-[10px] font-bold text-on-surface/70">
        <span>Pinned Memo</span>
        <span class="material-symbols-outlined text-xs cursor-pointer hover:text-primary edit-sticky-btn" data-id="${sticky.id}">edit</span>
      </div>
    `;

    // Delete sticky
    card.querySelector('.delete-sticky-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      store.stickies = store.stickies.filter(s => s.id !== sticky.id);
      store.save('cosmic_stickies', store.stickies);
      renderStickies();
    });

    // Quick edit sticky
    card.querySelector('.edit-sticky-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const newContent = prompt('Edit sticky note content:', sticky.content);
      if (newContent !== null) {
        sticky.content = newContent;
        store.save('cosmic_stickies', store.stickies);
        renderStickies();
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
      habit.completed = !habit.completed;
      if (habit.completed) habit.streak += 1;
      else habit.streak = Math.max(0, habit.streak - 1);
      store.save('cosmic_habits', store.habits);
      renderHabits();
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
    if (saveIndicator) saveIndicator.textContent = 'Saving...';

    saveTimeout = setTimeout(() => {
      store.scratchpad = textarea.value;
      store.save('cosmic_scratchpad', store.scratchpad);
      if (saveIndicator) saveIndicator.textContent = 'Auto-saved';
    }, 500);
  });
}

// ----------------- DRAG AND DROP (MOVE STUFF) -----------------
function setupDragAndDrop() {
  const board = document.getElementById('mainCorkboardCanvas');
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

  // Allow reordering in stickies container
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
        // Save new order
        const newIds = Array.from(stickiesContainer.querySelectorAll('.sticky-note')).map(el => el.dataset.id);
        store.stickies.sort((a, b) => newIds.indexOf(a.id) - newIds.indexOf(b.id));
        store.save('cosmic_stickies', store.stickies);
      }
    });
  }

  // Allow reordering in links grid
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
        // Save new order
        const newIds = Array.from(linksGrid.querySelectorAll('.neo-card')).map(el => el.dataset.id).filter(Boolean);
        store.links.sort((a, b) => newIds.indexOf(a.id) - newIds.indexOf(b.id));
        store.save('cosmic_links', store.links);
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
      store.todos.unshift({
        id: 't_' + Date.now(),
        text: text,
        tag: 'Today',
        priority: 'medium',
        completed: false,
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      store.save('cosmic_todos', store.todos);
      rapidTaskInput.value = '';
      renderTodos();
      updateTodoProgress();
    };

    rapidTaskBtn.addEventListener('click', addTask);
    rapidTaskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addTask();
    });
  }

  // Todo Filter Tabs (All / Active / Completed)
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

      store.links.push({
        id: 'l_' + Date.now(),
        title: titleInput.value.trim() || formatHostname(url),
        url: url,
        category: categoryInput.value || 'General',
        icon: iconInput.value || 'link',
        color: colorInput.value || '#FBE85F',
        clicks: 0
      });

      store.save('cosmic_links', store.links);
      renderLinks();
      closeModal('linkModal');
      // Reset inputs
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

      store.stickies.push({
        id: 's_' + Date.now(),
        title: titleInput.value.trim() || 'Quick Note',
        tag: tagInput.value.trim() || '#note',
        content: content,
        color: colorInput.value || 'sticky-lemon',
        rotation: randomRotation,
        pinColor: randomPin
      });

      store.save('cosmic_stickies', store.stickies);
      renderStickies();
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

# Cosmic Corkboard 🪐
### Daily Master Dashboard & Pinboard

A colorful, tactile master dashboard and pinboard inspired by retro-futuristic corkboards and neo-brutalist aesthetics.

## ✨ Features
- **Neon Cloud PostgreSQL Persistence**: Direct serverless connection using `@neondatabase/serverless` over HTTPS (no Node server required!). Everything you add, edit, or delete is saved directly to your Neon database.
- **Tilted Idea Stickies & Memos**: Draggable, colorful pastel notes pinned with metallic enamel pushpins and washi tape. Full add, inline edit, and delete sync with DB.
- **Master Links & Bookmarks**: Categorized bookmarks (Games, Dev, Media, News, Tools, Design) with visit counters, quick launcher, add modal, and delete options.
- **Master To-Dos**: Fast rapid task addition, priority tags, completion checkboxes, and strike-through progress tracking.
- **Live Scratchpad**: Lined paper stream-of-consciousness scratchpad with debounced auto-save directly to Neon DB.
- **Habit & Streak Tracker**: Daily streak counters with interactive completion toggles persisted to DB.
- **Full Drag & Drop**: Freely organize stickies and bookmark tiles; order is saved directly to Neon DB.
- **Offline Resiliency**: Optimistic UI with automatic local caching if offline, auto-reconnecting to Neon DB when network is active.

## 🛠️ Tech Stack
- HTML5, Modern Vanilla CSS, Tailwind CSS CDN
- Neon PostgreSQL Serverless Driver (`@neondatabase/serverless`)
- Space Grotesk, Plus Jakarta Sans, Outfit Google Fonts
- Material Symbols Outlined
- Static deployment ready for Vercel, Netlify, or local browser opening

# Cosmic Corkboard 🪐
### Daily Master Dashboard & Pinboard

A colorful, tactile master dashboard and pinboard inspired by retro-futuristic corkboards and neo-brutalist aesthetics.

## ✨ Features
- **Cloud PostgreSQL Persistence**: Direct serverless connection using `@neondatabase/serverless` over HTTPS. Everything you add, edit, or reposition is automatically synced to your cloud database.
- **YouTube Music & Podcasts Launcher**: Quick launch widget that connects directly to the YouTube Music app (on phone and desktop) or web, plus a dedicated Podcasts launcher.
- **Media Queue & System Design**: Curated system design and engineering video links (ByteByteGo, Gaurav Sen, Hussein Nasser, Martin Kleppmann), with the ability to add your own YouTube links.
- **Elon Musk Builder Insights**: Rotating collection of inspiring first-principles quotes with quick copy actions.
- **Interactive Explore & Games**: Quick-launch shelf featuring **Krillion.io**, **Sporcle Countries of the World Quiz**, and **Substack**.
- **Freeform Draggable Canvas**: Every component and card can be moved anywhere on the corkboard. Coordinates (`x, y`) and layering (`z-index`) are saved and restored automatically on subsequent visits.
- **Smooth Bookmark Grid Reordering**: Flawless multi-column drag-and-drop reordering with persistent cloud sync.
- **Tactile Memos & Rapid To-Dos**: Clean, distraction-free task capture and sticky notes you can pin as you work.
- **Live Scratchpad**: Lined paper stream-of-consciousness scratchpad with auto-save directly to the cloud.

## 🛠️ Tech Stack
- HTML5, Modern Vanilla CSS, Tailwind CSS CDN
- Cloud PostgreSQL Serverless Driver (`@neondatabase/serverless`)
- Space Grotesk, Plus Jakarta Sans, Outfit Google Fonts
- Material Symbols Outlined
- Static deployment ready for Vercel, Netlify, or local browser opening (`npm start`)

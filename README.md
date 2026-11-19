# Cosmic Corkboard 🪐
### Daily Master Dashboard & Pinboard

A colorful, tactile master dashboard and pinboard inspired by retro-futuristic corkboards and neo-brutalist aesthetics.

## ✨ Features
- **Vercel Serverless Sync API & Cross-Device Persistence**: Built-in `/api/sync` serverless function bridges Vercel deployments directly to your Neon PostgreSQL database. Everything you do on your laptop automatically syncs to your phone and vice-versa.
- **Dedicated Daily Games & Puzzles**: Interactive shelf featuring **Wordle (NYT)**, **NYT Connections**, **Chainle.io**, **Sporcle Countries of the World Quiz**, and **Daily Chess Puzzle**, with dynamic game addition and removal.
- **YouTube Music & Podcasts Launcher**: Direct deep-link launcher that opens the native YouTube Music app (on phone and desktop) directly without secondary browser tabs, plus a dedicated Podcasts launcher.
- **Media Queue & System Design**: Curated system design and engineering video links (ByteByteGo, Gaurav Sen, Hussein Nasser, Martin Kleppmann), with the ability to add your own YouTube links.
- **Elon Musk Builder Insights**: Rotating collection of inspiring first-principles quotes with quick copy actions.
- **Daily Rituals & Launchpad**: Quick-launch shelf featuring **Substack**, **Krillion.io**, and daily habits.
- **Freeform Draggable Canvas**: Every component and card can be moved anywhere on the corkboard. Coordinates (`x, y`) and layering (`z-index`) are saved and restored automatically on subsequent visits.
- **Smooth Bookmark Grid Reordering**: Flawless multi-column drag-and-drop reordering with persistent cloud sync.
- **Tactile Memos & Rapid To-Dos**: Clean, distraction-free task capture and sticky notes you can pin as you work.
- **Live Scratchpad**: Lined paper stream-of-consciousness scratchpad with auto-save directly to the cloud.

## 🚀 Vercel Deployment & Cross-Device Sync
1. Deploy to Vercel via GitHub: `vercel` or git push to your connected repository.
2. (Optional) In Vercel Project Settings > Environment Variables, add `DATABASE_URL` with your Neon connection string (or use the built-in fallback).
3. Open on your phone and laptop — all bookmarks, games, tasks, stickies, and canvas positions sync automatically in real time!

## 🛠️ Tech Stack
- HTML5, Modern Vanilla CSS, Tailwind CSS CDN
- Cloud PostgreSQL Serverless Driver (`@neondatabase/serverless`)
- Space Grotesk, Plus Jakarta Sans, Outfit Google Fonts
- Material Symbols Outlined
- Static deployment ready for Vercel, Netlify, or local browser opening (`npm start`)

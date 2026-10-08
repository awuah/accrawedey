# AccraWedey 🇬🇭

A browser-based, 2D, live multiplayer "property tycoon" open world game set in Accra, Ghana.
Built with **PixiJS v8**, **React 19**, **Supabase**, and **Tailwind CSS**.

---

## 🎨 Visual Design & Zero-Purple Hard Constraint
The game uses a soft, light pastel palette reflecting coastal Accra (warm ivory sand, sky blue, lagoon turquoise, palm green, golden sun, terracotta clay).
- **Hard Rule:** ABSOLUTELY NO PURPLE (no violet, lavender, lilac, indigo, magenta, or purple-tinted hues).
- **Automated Check:** Run `npm run lint:colors` (fails the build if any forbidden hue is detected).

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file (copied from `.env.example`):
```env
VITE_SUPABASE_URL=https://ezqknoatatwuawzdimah.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Run Automated Tests & Color Linter
```bash
npm test
```

---

## 🗺️ The Admin World Editor
Press the **World Editor** button in the top HUD (or access via admin mode) to:
- Trace and draw road networks (Junction nodes & road segments).
- Configure travel permissions (walking, bicycling, driving).
- Place landmarks and properties (Malls, Chop Bars, Nightclubs, Resorts, Filling Stations, Markets).
- Configure property price, rent yield per minute, and entry points.
- Publish new world versions directly to live players.

---

## 🏗️ Architecture & Scale Blueprint
See [`ADR_PHASE1.md`](./ADR_PHASE1.md) for full architecture specifications, database schema, spatial channel sharding, anti-cheat, and scaling migration blueprints.

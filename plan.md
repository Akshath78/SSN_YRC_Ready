# READY full-product implementation plan

## Product scope
READY is an optional-auth preparedness learning platform. Guests can browse and complete the complete seven-course catalog immediately. Manus OAuth is available to sync progress, XP and badges without forcing sign-in.

## Course model
Seven open courses cover Preparedness Basics, Clear Communication, Fire Safety, Flood Safety, Earthquake Ready, First Aid Basics and Help Others. Each course contains four content-backed lessons with a concept explanation, a practical question, rationale and takeaway. Progress is derived from completed lessons, not placeholder values.

## Interaction model
- Learn: searchable catalog, continue CTA, daily scenario and seven open course cards.
- Lessons: one-question-at-a-time player with answer gating, correction rationale, retry, progress bar, course completion and review mode without XP farming.
- Practice: four working games with question progression, a sequence builder, feedback and XP rewards.
- Assistant: six practical situations with four-step guidance, tips and emergency call prompt; no gamification.
- Progress: overall percentage, per-course progress, derived badges, streak and XP, with guest state and sync CTA.

## Auth and persistence
Use application-owned Google OAuth with protected Google client credentials. The app opens logged out by default, provides an optional sign-in modal, and keeps guest progress locally. Authenticated users sync progress through protected tRPC procedures backed by the managed MySQL `user_progress` table. Session signing accepts standalone `APP_ID`/`SESSION_SECRET` values and keeps Manus fallbacks for Preview compatibility.

## Design direction
- **Movement:** Duolingo-adjacent friendly learning-app editorialism with original READY branding and civic-tech calm.
- **Principles:** One idea at a time, confidence over fear, visible progress, high-feedback controls.
- **Palette:** READY green for progress and success; blue, orange, red, mint, pink and purple distinguish course families while white cards and gray rails preserve clarity.
- **Layout:** Responsive top navigation, course catalog, modal lesson player, compact practice games and a dense progress profile.
- **Signature elements:** Shield mark, physical button shadows, colorful course icon tiles, pill progress rails and kind feedback blocks.
- **Typography:** Nunito for friendly headings/actions; Inter for readable explanatory copy.
- **Voice:** Direct, optimistic and specific. Example: “Start anywhere, go at your pace.” and “Read the situation again and choose the action that protects people first.”

## Structure
- `client/src/App.tsx`: catalog, content data, lesson player, practice games, assistant, progress, auth UI and state sync.
- `client/src/index.css`: responsive visual system and all product surfaces.
- `server/routers.ts`, `server/db.ts`: protected progress API and persistence helpers.
- `drizzle/schema.ts` and migration: user progress persistence.
- `app.config.ts`, `client/public/manus-routes.json`: project metadata and route manifest.

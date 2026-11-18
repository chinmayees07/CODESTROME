# CODESTROME — GDG on Campus, RIT Hassan

A responsive cyber-inspired student community website for CODESTROME. Includes animated opening logo sequence, track mission cards, event filters, event RSVP modal, and server-backed member registration.


## Features
- Animated splash screen with RIT, CSE Department, and GDG on Campus logos
- Responsive mobile/tablet/desktop layout and collapsible mobile navigation
- Four learning tracks with starter missions
- Event category filters and RSVP form
- Member registration form with validation and duplicate-email protection
- Node.js backend APIs; registrations and RSVPs persist to local JSON files
- Health endpoint and event RSVP count endpoint

## Requirements
- Node.js 18 or newer


## Run locally
1. Extract the ZIP.
2. Open a terminal in the extracted `codequest_website` folder.
3. Run:
   ```bash
   npm start
   ```
4. Open `http://localhost:3000` in your browser.


## API endpoints
- `GET /api/health` — backend status
- `GET /api/events` — event list with RSVP counts
- `POST /api/register` — member registration
- `POST /api/rsvp` — event RSVP
- `POST /api/contact` — contact message


## Storage
Submitted registrations, event RSVPs, and contact messages are saved in `data/registrations.json`, `data/rsvps.json`, and `data/contacts.json`. The `data` directory is created automatically. This demo backend is intended for local/student project use; for public production deployment, add database storage, rate limiting, spam protection, secure hosting, and privacy/consent policies.


## Logos
The included logo files are provided for the website layout. Replace them only with official organizer files if any of these differ from the official versions.

IMPORTANT: Run npm start in the project folder. If using VS Code Live Server (port 5500), API requests are automatically sent to http://localhost:3000. Keep the Node server running.

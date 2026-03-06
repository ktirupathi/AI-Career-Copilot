# AI Career Copilot

A full-stack web application for tech professionals to improve their careers using AI.

## What this project now includes

- **Frontend**: Modern SaaS dashboard UI with 9 screens and sidebar navigation.
- **Backend**: Express REST API for dashboard, resume analysis, JD analysis, skills, interview simulation, and tasks.
- **Database**: SQLite database with persistent tables for users, resumes, job descriptions, skill gaps, interview sessions, and daily tasks.
- **AI features**:
  - Resume analysis (ATS + keyword coverage + AI improvement summary).
  - Job description matching with missing skills extraction.
  - Mock interview scoring + AI-generated feedback.
  - Optional OpenAI integration (automatic fallback to local heuristics when API key is absent).

## Tech stack

- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Node.js + Express
- Database: SQLite (`sqlite3` + `sqlite`)
- AI: OpenAI SDK + local heuristics fallback

## Project structure

```txt
.
├── app.js
├── index.html
├── styles.css
├── backend
│   ├── aiService.js
│   ├── db.js
│   ├── initDb.js
│   ├── server.js
│   └── smokeTest.js
├── data/
├── package.json
└── README.md
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Initialize database with seed data:

```bash
npm run db:init
```

3. (Optional) enable OpenAI-backed AI responses:

```bash
export OPENAI_API_KEY="your_key_here"
export OPENAI_MODEL="gpt-4o-mini"
```

4. Start app:

```bash
npm start
```

Open: `http://localhost:3000`

## API endpoints

- `GET /api/health`
- `GET /api/dashboard/:userId`
- `POST /api/resume/analyze`
- `POST /api/job/analyze`
- `GET /api/skills/gap/:userId`
- `POST /api/interview/mock`
- `GET /api/tasks/:userId`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`

## Running checks

```bash
npm test
```

This executes a basic smoke test that boots the server and checks key API routes.

## Notes

- If OpenAI credentials are not configured, the app still works using deterministic local AI heuristics.
- This is desktop-first and includes responsive fallback for narrower screens.

## Resolving PR conflicts (including PR #2)

If GitHub shows merge conflicts for your PR, resolve them locally with this workflow:

1. Ensure you have the target branch and your feature branch locally.
2. Run the helper script:

```bash
scripts/resolve_pr2_conflicts.sh main work
```

3. If conflicts are reported, open each conflicted file and resolve markers (`<<<<<<<`, `=======`, `>>>>>>>`).
4. Verify no markers remain:

```bash
rg -n '^<<<<<<<|^=======|^>>>>>>>'
```

5. Stage and commit:

```bash
git add .
git commit -m "Resolve conflicts with main for PR #2"
```

6. Push branch updates:

```bash
git push
```

> Note: In restricted environments where GitHub fetch is blocked, the script still helps with local branch conflict resolution once both branches are available locally.

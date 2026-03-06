const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const DB_PATH = path.join(__dirname, '..', 'data', 'career-copilot.db');

async function getDb() {
  const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      career_score INTEGER DEFAULT 72,
      resume_score INTEGER DEFAULT 70,
      interview_readiness INTEGER DEFAULT 68,
      roadmap_progress INTEGER DEFAULT 40,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      content TEXT NOT NULL,
      ats_score INTEGER DEFAULT 0,
      keyword_coverage INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS job_descriptions (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      match_score INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS skill_gaps (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      skill_name TEXT NOT NULL,
      current_level INTEGER NOT NULL,
      target_level INTEGER NOT NULL,
      priority TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS interview_sessions (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      focus TEXT NOT NULL,
      score REAL DEFAULT 0,
      feedback TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS daily_tasks (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      due_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  return db;
}

module.exports = { getDb };

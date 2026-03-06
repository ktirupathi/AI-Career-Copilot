const { getDb } = require('./db');

async function main() {
  const db = await getDb();

  await db.run(`
    INSERT OR IGNORE INTO users (id, name, career_score, resume_score, interview_readiness, roadmap_progress)
    VALUES (1, 'Alex Johnson', 78, 74, 81, 62)
  `);

  const existingTasks = await db.get('SELECT COUNT(*) as count FROM daily_tasks WHERE user_id = 1');
  if (existingTasks.count === 0) {
    const tasks = [
      ['Tailor resume to Staff Backend role', 'done', '2026-03-07'],
      ['Practice 2 system design prompts', 'pending', '2026-03-07'],
      ['Review Kubernetes production case study', 'pending', '2026-03-08']
    ];

    for (const [title, status, dueDate] of tasks) {
      await db.run(
        'INSERT INTO daily_tasks (user_id, title, status, due_date) VALUES (?, ?, ?, ?)',
        [1, title, status, dueDate]
      );
    }
  }

  console.log('Database initialized at data/career-copilot.db');
  await db.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

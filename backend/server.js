require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { getDb } = require('./db');
const { heuristicResumeInsights, heuristicJobMatch, tryOpenAi } = require('./aiService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '..')));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/dashboard/:userId', async (req, res) => {
  const db = await getDb();
  const user = await db.get('SELECT * FROM users WHERE id = ?', [req.params.userId]);
  const tasks = await db.get(
    "SELECT COUNT(*) as total, SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as done FROM daily_tasks WHERE user_id = ?",
    [req.params.userId]
  );

  res.json({
    user,
    tasks,
    interviewPractice: [
      { name: 'System design mock', time: 'Tomorrow • 6:00 PM' },
      { name: 'Behavioral Q&A', time: 'Friday • 7:30 PM' }
    ]
  });
});

app.post('/api/resume/analyze', async (req, res) => {
  const { userId = 1, fileName = 'resume.txt', content = '' } = req.body;
  const db = await getDb();
  const insights = heuristicResumeInsights(content);

  await db.run(
    'INSERT INTO resumes (user_id, file_name, content, ats_score, keyword_coverage) VALUES (?, ?, ?, ?, ?)',
    [userId, fileName, content, insights.atsScore, insights.keywordCoverage]
  );

  await db.run('UPDATE users SET resume_score = ?, career_score = MIN(100, career_score + 1) WHERE id = ?', [
    insights.atsScore,
    userId
  ]);

  const aiSummary =
    (await tryOpenAi(`You are a resume coach. Give 3 concise improvements for this resume:\n${content}`)) ||
    insights.tips.join(' ');

  res.json({ ...insights, aiSummary });
});

app.post('/api/job/analyze', async (req, res) => {
  const { userId = 1, title = 'Target Role', jd = '', resume = '' } = req.body;
  const db = await getDb();
  const analysis = heuristicJobMatch(resume, jd);

  await db.run('INSERT INTO job_descriptions (user_id, title, content, match_score) VALUES (?, ?, ?, ?)', [
    userId,
    title,
    jd,
    analysis.matchScore
  ]);

  await db.run('UPDATE users SET career_score = ROUND((career_score + ?) / 2.0) WHERE id = ?', [
    analysis.matchScore,
    userId
  ]);

  res.json(analysis);
});

app.get('/api/skills/gap/:userId', async (req, res) => {
  const db = await getDb();
  let skills = await db.all('SELECT * FROM skill_gaps WHERE user_id = ? ORDER BY id DESC', [req.params.userId]);

  if (skills.length === 0) {
    const defaults = [
      ['Distributed Systems', 54, 85, 'high'],
      ['Cloud Cost Optimization', 48, 80, 'high'],
      ['Leadership Communication', 61, 84, 'medium']
    ];

    for (const [skill, current, target, priority] of defaults) {
      await db.run(
        'INSERT INTO skill_gaps (user_id, skill_name, current_level, target_level, priority) VALUES (?, ?, ?, ?, ?)',
        [req.params.userId, skill, current, target, priority]
      );
    }

    skills = await db.all('SELECT * FROM skill_gaps WHERE user_id = ?', [req.params.userId]);
  }

  res.json({ skills });
});

app.post('/api/interview/mock', async (req, res) => {
  const { userId = 1, role = 'Software Engineer', focus = 'Behavioral' } = req.body;
  const db = await getDb();
  const score = Number((Math.random() * 2 + 7.2).toFixed(1));

  const defaultFeedback = `Great structure for ${focus} answers. Improve by adding tighter metrics and trade-off discussions for ${role}.`;
  const aiFeedback =
    (await tryOpenAi(`Provide concise interview feedback for role=${role}, focus=${focus}, score=${score}`)) ||
    defaultFeedback;

  await db.run(
    'INSERT INTO interview_sessions (user_id, role, focus, score, feedback) VALUES (?, ?, ?, ?, ?)',
    [userId, role, focus, score, aiFeedback]
  );

  await db.run('UPDATE users SET interview_readiness = MIN(100, interview_readiness + 1) WHERE id = ?', [userId]);

  res.json({ score, feedback: aiFeedback });
});

app.get('/api/tasks/:userId', async (req, res) => {
  const db = await getDb();
  const tasks = await db.all('SELECT * FROM daily_tasks WHERE user_id = ? ORDER BY created_at DESC', [req.params.userId]);
  res.json({ tasks });
});

app.post('/api/tasks', async (req, res) => {
  const { userId = 1, title, dueDate } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  const db = await getDb();
  const result = await db.run('INSERT INTO daily_tasks (user_id, title, due_date) VALUES (?, ?, ?)', [
    userId,
    title,
    dueDate || null
  ]);

  const task = await db.get('SELECT * FROM daily_tasks WHERE id = ?', [result.lastID]);
  res.status(201).json(task);
});

app.patch('/api/tasks/:id', async (req, res) => {
  const { status } = req.body;
  const db = await getDb();
  await db.run('UPDATE daily_tasks SET status = ? WHERE id = ?', [status, req.params.id]);
  const task = await db.get('SELECT * FROM daily_tasks WHERE id = ?', [req.params.id]);
  res.json(task);
});

app.listen(PORT, async () => {
  const db = await getDb();
  await db.close();
  console.log(`AI Career Copilot running at http://localhost:${PORT}`);
});

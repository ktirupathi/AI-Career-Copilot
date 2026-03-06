const USER_ID = 1;
const navLinks = document.querySelectorAll('.nav-link');
const screens = document.querySelectorAll('.screen');

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  return response.json();
}

function setScore(el, value) {
  if (!el) return;
  el.style.setProperty('--value', value);
  el.textContent = `${value}%`;
}

function renderTasks(tasks) {
  const taskList = document.getElementById('taskList');
  if (!taskList) return;
  taskList.innerHTML = '';

  tasks.forEach((task) => {
    const li = document.createElement('li');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.status === 'done';
    checkbox.addEventListener('change', async () => {
      await api(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: checkbox.checked ? 'done' : 'pending' })
      });
      await loadTasks();
      await loadDashboard();
    });

    const label = document.createElement('span');
    label.textContent = task.title;
    const pill = document.createElement('span');
    pill.className = 'status-pill';
    pill.textContent = task.status;

    li.append(checkbox, label, pill);
    taskList.appendChild(li);
  });

  const done = tasks.filter((t) => t.status === 'done').length;
  const percent = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  document.getElementById('taskCompletionBar').style.width = `${percent}%`;
  document.getElementById('taskCompletionLabel').textContent = `${percent}% weekly task completion`;
}

async function loadTasks() {
  const { tasks } = await api(`/api/tasks/${USER_ID}`);
  renderTasks(tasks);
}

function renderSkillGap(skills) {
  const tags = document.getElementById('skillGapTags');
  const cards = document.getElementById('skillGapCards');
  tags.innerHTML = '';
  cards.innerHTML = '';

  skills.forEach((skill) => {
    const tag = document.createElement('li');
    tag.textContent = skill.skill_name;
    tags.appendChild(tag);

    const pct = Math.max(0, Math.min(100, skill.current_level));
    const card = document.createElement('article');
    card.className = 'card glass';
    card.innerHTML = `
      <h3>${skill.skill_name}</h3>
      <div class="progress"><span style="width: ${pct}%"></span></div>
      <small>${pct}% current vs ${skill.target_level}% target (${skill.priority} priority)</small>
    `;
    cards.appendChild(card);
  });

  const avg = Math.round(skills.reduce((sum, s) => sum + s.current_level, 0) / Math.max(skills.length, 1));
  document.getElementById('landingSkillBar').style.width = `${avg}%`;
  document.getElementById('landingSkillLabel').textContent = `${skills.length} tracked skills in database`;
}

async function loadSkillGaps() {
  const { skills } = await api(`/api/skills/gap/${USER_ID}`);
  renderSkillGap(skills);
}

function renderPractice(items) {
  const practiceList = document.getElementById('practiceList');
  practiceList.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${item.name}</strong><span>${item.time}</span>`;
    practiceList.appendChild(li);
  });
}

async function loadDashboard() {
  const data = await api(`/api/dashboard/${USER_ID}`);
  const { user, tasks, interviewPractice } = data;
  if (!user) return;

  setScore(document.getElementById('landingCareerScore'), user.career_score);
  setScore(document.getElementById('dashboardCareerScore'), user.career_score);

  document.getElementById('landingInterviewReadiness').textContent = `${user.interview_readiness}%`;
  document.getElementById('landingTaskStats').textContent = `${tasks.done || 0}/${tasks.total || 0} daily tasks complete`;

  document.getElementById('resumeStrength').textContent = `${user.resume_score}%`;
  document.getElementById('interviewReadiness').textContent = `${user.interview_readiness}%`;
  document.getElementById('skillAlignment').textContent = `${Math.max(40, user.career_score - 8)}%`;

  document.getElementById('landingResumeBar').style.width = `${user.resume_score}%`;
  document.getElementById('landingResumeLabel').textContent = `${user.resume_score}% resume strength`;

  document.getElementById('dashboardRoadmapBar').style.width = `${user.roadmap_progress}%`;
  document.getElementById('landingRoadmapBar').style.width = `${user.roadmap_progress}%`;
  document.getElementById('landingRoadmapLabel').textContent = `${user.roadmap_progress}% roadmap progress`;
  document.getElementById('dashboardRoadmapLabel').textContent = `${user.roadmap_progress}% roadmap completion`;

  document.getElementById('barKeywords').style.height = `${Math.max(40, user.resume_score - 3)}%`;
  document.getElementById('barImpact').style.height = `${Math.max(45, user.resume_score + 5)}%`;
  document.getElementById('barFormat').style.height = `${Math.max(42, user.resume_score - 6)}%`;
  document.getElementById('barAts').style.height = `${user.resume_score}%`;

  renderPractice(interviewPractice);
}

async function analyzeResume() {
  const fileName = document.getElementById('resumeFileName').value || 'resume.txt';
  const content = document.getElementById('resumeText').value;
  if (!content.trim()) return;

  const result = await api('/api/resume/analyze', {
    method: 'POST',
    body: JSON.stringify({ userId: USER_ID, fileName, content })
  });

  document.getElementById('resumeResult').textContent = `ATS ${result.atsScore}% | Keyword coverage ${result.keywordCoverage}%. ${result.aiSummary}`;
  await loadDashboard();
}

async function analyzeJobDescription() {
  const title = document.getElementById('jobTitle').value;
  const jd = document.getElementById('jobDescriptionText').value;
  const resume = document.getElementById('jobResumeText').value;

  const result = await api('/api/job/analyze', {
    method: 'POST',
    body: JSON.stringify({ userId: USER_ID, title, jd, resume })
  });

  document.getElementById('jobMatchScore').textContent = `${result.matchScore}%`;
  const missing = document.getElementById('jobMissingSkills');
  missing.innerHTML = '';
  result.missingSkills.forEach((skill) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>Gap:</strong><span>${skill}</span>`;
    missing.appendChild(li);
  });

  await loadDashboard();
}

async function startMockInterview() {
  const role = document.getElementById('mockRole').value;
  const focus = document.getElementById('mockFocus').value;
  const result = await api('/api/interview/mock', {
    method: 'POST',
    body: JSON.stringify({ userId: USER_ID, role, focus })
  });

  document.getElementById('mockScore').textContent = `${result.score}/10`;
  document.getElementById('mockFeedback').textContent = result.feedback;
  await loadDashboard();
}

async function addTask() {
  const titleEl = document.getElementById('newTaskTitle');
  const title = titleEl.value.trim();
  if (!title) return;

  await api('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ userId: USER_ID, title })
  });

  titleEl.value = '';
  await loadTasks();
  await loadDashboard();
}

function wireNav() {
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.forEach((item) => item.classList.remove('active'));
      screens.forEach((screen) => screen.classList.remove('active'));
      link.classList.add('active');
      const target = document.getElementById(link.dataset.screen);
      if (target) target.classList.add('active');
    });
  });
}

async function boot() {
  wireNav();
  document.getElementById('refreshDashboardBtn').addEventListener('click', loadDashboard);
  document.getElementById('analyzeResumeBtn').addEventListener('click', analyzeResume);
  document.getElementById('analyzeJdBtn').addEventListener('click', analyzeJobDescription);
  document.getElementById('startMockBtn').addEventListener('click', startMockInterview);
  document.getElementById('addTaskBtn').addEventListener('click', addTask);

  await Promise.all([loadDashboard(), loadSkillGaps(), loadTasks()]);
}

boot().catch((error) => {
  console.error(error);
  const banner = document.getElementById('landingTaskStats');
  if (banner) banner.textContent = 'Backend API unavailable. Run npm install && npm run db:init && npm start.';
});

const http = require('http');
const { spawn } = require('child_process');

const server = spawn('node', ['backend/server.js'], { stdio: ['ignore', 'pipe', 'pipe'] });

function request(path, method = 'GET', body) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path,
        method,
        headers: { 'Content-Type': 'application/json' }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, data }));
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  try {
    await new Promise((r) => setTimeout(r, 1500));

    const health = await request('/api/health');
    if (health.status !== 200) throw new Error('Health check failed');

    const dashboard = await request('/api/dashboard/1');
    if (dashboard.status !== 200) throw new Error('Dashboard endpoint failed');

    const resume = await request('/api/resume/analyze', 'POST', {
      userId: 1,
      fileName: 'resume.txt',
      content: 'Senior engineer with AI, cloud, system design and leadership impact.'
    });
    if (resume.status !== 200) throw new Error('Resume analyze failed');

    console.log('Smoke tests passed');
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  } finally {
    server.kill('SIGINT');
  }
})();

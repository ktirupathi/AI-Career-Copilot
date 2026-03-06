const OpenAI = require('openai');

function heuristicResumeInsights(content) {
  const text = content.toLowerCase();
  const keywords = ['ai', 'system design', 'cloud', 'leadership', 'api', 'python', 'javascript'];
  const matches = keywords.filter((k) => text.includes(k)).length;
  const keywordCoverage = Math.min(100, Math.round((matches / keywords.length) * 100));
  const atsScore = Math.max(50, Math.min(98, Math.round(60 + keywordCoverage * 0.35)));

  return {
    atsScore,
    keywordCoverage,
    tips: [
      'Use quantifiable impact bullets (%, $, latency, growth).',
      'Mirror top keywords from your target role description.',
      'Highlight leadership and cross-functional collaboration outcomes.'
    ]
  };
}

function heuristicJobMatch(resumeText, jdText) {
  const jdKeywords = jdText
    .toLowerCase()
    .split(/[^a-z0-9+.#]+/)
    .filter((w) => w.length > 4);
  const unique = [...new Set(jdKeywords)].slice(0, 80);
  const resumeLower = resumeText.toLowerCase();
  const matched = unique.filter((k) => resumeLower.includes(k));
  const matchScore = Math.min(96, Math.max(35, Math.round((matched.length / Math.max(unique.length, 1)) * 100 + 30)));

  return {
    matchScore,
    missingSkills: unique.filter((k) => !resumeLower.includes(k)).slice(0, 5)
  };
}

async function tryOpenAi(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.4,
    messages: [{ role: 'user', content: prompt }]
  });

  return completion.choices[0]?.message?.content?.trim() || null;
}

module.exports = { heuristicResumeInsights, heuristicJobMatch, tryOpenAi };

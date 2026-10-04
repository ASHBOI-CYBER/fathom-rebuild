#!/usr/bin/env node
// Agent capture hook for the 8x assignment.
// Wired to SessionStart, UserPromptSubmit and Stop in .claude/settings.json.
// Appends the verbatim prompt and the final response of every turn to
// .agent-logs/YYYY-MM-DD_HH-MM-SS_<session-id>.md. Never blocks the agent:
// every failure is written to .claude/hooks/.state/errors.log and we exit 0.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LOG_DIR = path.join(ROOT, '.agent-logs');
const STATE_DIR = path.join(ROOT, '.claude', 'hooks', '.state');
const CONFIG = { author: 'ASHBOI-CYBER', tool: 'claude-code', project: 'fathom-rebuild' };

const readStdin = () =>
  new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
  });

const nowIso = () => new Date().toISOString();

function stateFile(sessionId) {
  return path.join(STATE_DIR, `${sessionId}.json`);
}

function loadState(sessionId) {
  try {
    return JSON.parse(fs.readFileSync(stateFile(sessionId), 'utf8'));
  } catch {
    return null;
  }
}

function saveState(state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(stateFile(state.session_id), JSON.stringify(state, null, 2));
}

// ---- transcript helpers (internal format; used for model lookup + backfill) ----

function readTranscript(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return [];
  const out = [];
  for (const line of fs.readFileSync(transcriptPath, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      /* partial line while being written */
    }
  }
  return out;
}

function latestModel(entries) {
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (e.type === 'assistant' && !e.isSidechain && e.message?.model && e.message.model !== '<synthetic>') {
      return e.message.model;
    }
  }
  return null;
}

function isRealPrompt(e) {
  if (e.type !== 'user' || e.isSidechain || e.isMeta || e.isCompactSummary) return false;
  const c = e.message?.content;
  if (typeof c === 'string') return true;
  if (Array.isArray(c)) return c.some((b) => b.type === 'text') && !c.some((b) => b.type === 'tool_result');
  return false;
}

function promptText(e) {
  const c = e.message.content;
  if (typeof c === 'string') return c;
  return c.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}

// Split the transcript into turns: { prompt, promptTs, response, responseTs, model }.
// The final response is the assistant text emitted after the last tool call of the turn.
function turnsFromTranscript(entries) {
  const turns = [];
  let cur = null;
  for (const e of entries) {
    if (e.isSidechain) continue;
    if (isRealPrompt(e)) {
      cur = { prompt: promptText(e), promptTs: e.timestamp, blocks: [], model: null };
      turns.push(cur);
      continue;
    }
    if (!cur) continue;
    if (e.type === 'assistant' && Array.isArray(e.message?.content)) {
      if (e.message.model && e.message.model !== '<synthetic>') cur.model = e.message.model;
      for (const b of e.message.content) {
        if (b.type === 'tool_use') cur.blocks = [];
        else if (b.type === 'text' && b.text.trim()) cur.blocks.push({ text: b.text, ts: e.timestamp });
      }
    } else if (e.type === 'user' && Array.isArray(e.message?.content) && e.message.content.some((b) => b.type === 'tool_result')) {
      cur.blocks = [];
    }
  }
  return turns.map((t) => ({
    prompt: t.prompt,
    promptTs: t.promptTs,
    model: t.model,
    response: t.blocks.map((b) => b.text).join('\n\n'),
    responseTs: t.blocks.length ? t.blocks[t.blocks.length - 1].ts : null,
  }));
}

// ---- log file ----

function header(state) {
  const short = state.session_id.slice(0, 8);
  return [
    '---',
    `session_id: ${state.session_id}`,
    `date: ${state.first_prompt_time.slice(0, 10)}`,
    `author: ${CONFIG.author}`,
    `model: ${state.model || 'unknown'}`,
    `tool: ${CONFIG.tool}`,
    `project: ${CONFIG.project}`,
    `total_exchanges: ${state.total_exchanges}`,
    `first_prompt_time: ${state.first_prompt_time}`,
    `last_prompt_time: ${state.last_prompt_time}`,
    '---',
    '',
    `# Session Log - ${state.first_prompt_time.slice(0, 10)}`,
    '',
    `Session: \`${short}\` | Project: \`${CONFIG.project}\` | Author: \`${CONFIG.author}\``,
    '',
    '---',
    '',
    '',
  ].join('\n');
}

function entry(type, num, state, ts, model, body, note) {
  const lines = [
    `[LOG_ENTRY type=${type} num=${num} session=${state.session_id.slice(0, 8)}]`,
    `timestamp: ${ts}`,
    `model: ${model || 'unknown'}`,
  ];
  if (note) lines.push(`note: ${note}`);
  return lines.join('\n') + '\n\n' + body.replace(/\s+$/, '') + '\n\n\n';
}

function writeLog(state, appendText) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const file = path.join(LOG_DIR, state.file);
  let body = '';
  if (fs.existsSync(file)) {
    const existing = fs.readFileSync(file, 'utf8');
    const idx = existing.indexOf('[LOG_ENTRY');
    body = idx === -1 ? '' : existing.slice(idx);
  }
  fs.writeFileSync(file, header(state) + body + (appendText || ''));
}

function newState(sessionId, firstTs, model) {
  const stamp = firstTs.replace('T', '_').replace(/:/g, '-').slice(0, 19);
  return {
    session_id: sessionId,
    file: `${stamp}_${sessionId}.md`,
    model,
    total_exchanges: 0,
    first_prompt_time: firstTs,
    last_prompt_time: firstTs,
    responded: true,
  };
}

// The hook was installed partway through a session: recover the earlier turns
// from the transcript so the log starts at prompt 1, flagged as backfilled.
function backfill(sessionId, entries, excludeTrailingPrompt, finalResponse) {
  let turns = turnsFromTranscript(entries);
  if (finalResponse && turns.length) {
    const last = turns[turns.length - 1];
    last.response = finalResponse;
    last.responseTs = last.responseTs || nowIso();
  }
  if (excludeTrailingPrompt != null && turns.length && turns[turns.length - 1].prompt.trim() === excludeTrailingPrompt.trim()) {
    turns = turns.slice(0, -1);
  }
  if (!turns.length) return null;
  const state = newState(sessionId, turns[0].promptTs, turns[turns.length - 1].model || latestModel(entries));
  let text = '';
  const note = 'backfilled from session transcript (capture hook installed mid-session)';
  for (const t of turns) {
    state.total_exchanges += 1;
    state.last_prompt_time = t.promptTs;
    const n = state.total_exchanges;
    text += entry('PROMPT', n, state, t.promptTs, t.model || state.model, t.prompt, note);
    if (t.response) text += entry('RESPONSE', n, state, t.responseTs, t.model || state.model, t.response, note);
  }
  state.responded = true;
  writeLog(state, text);
  saveState(state);
  return state;
}

// ---- event handlers ----

function onSessionStart(input) {
  const state = loadState(input.session_id);
  if (state && input.model) {
    state.model = input.model;
    saveState(state);
  } else if (!state && input.model) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.writeFileSync(path.join(STATE_DIR, `${input.session_id}.model`), input.model);
  }
}

function pendingModel(sessionId, entries) {
  try {
    return fs.readFileSync(path.join(STATE_DIR, `${sessionId}.model`), 'utf8').trim();
  } catch {
    return latestModel(entries);
  }
}

function onPrompt(input) {
  const ts = nowIso();
  let state = loadState(input.session_id);
  const entries = state ? null : readTranscript(input.transcript_path);
  if (!state) state = backfill(input.session_id, entries, input.prompt);
  if (!state) state = newState(input.session_id, ts, pendingModel(input.session_id, entries));
  state.total_exchanges += 1;
  state.last_prompt_time = ts;
  state.responded = false;
  writeLog(state, entry('PROMPT', state.total_exchanges, state, ts, state.model, input.prompt ?? ''));
  saveState(state);
}

async function onStop(input) {
  const ts = nowIso();
  let state = loadState(input.session_id);
  if (!state) {
    // Hook installed mid-turn: no prompt was logged for this session yet.
    // The transcript contains this turn too, so backfill covers it entirely.
    backfill(input.session_id, readTranscript(input.transcript_path), null, input.last_assistant_message);
    return;
  }
  const entries = readTranscript(input.transcript_path);
  const model = latestModel(entries) || state.model;
  state.model = model;
  let response = input.last_assistant_message;
  if (response == null) {
    const turns = turnsFromTranscript(entries);
    response = turns.length ? turns[turns.length - 1].response : '';
  }
  if (typeof response !== 'string') response = JSON.stringify(response);
  writeLog(state, entry('RESPONSE', state.total_exchanges, state, ts, model, response || '(no text response)'));
  state.responded = true;
  saveState(state);
}

async function main() {
  const raw = await readStdin();
  const input = JSON.parse(raw);
  if (input.agent_id) return; // subagent turns are not user prompts
  switch (input.hook_event_name) {
    case 'SessionStart':
      return onSessionStart(input);
    case 'UserPromptSubmit':
      return onPrompt(input);
    case 'Stop':
      return onStop(input);
  }
}

main()
  .catch((err) => {
    try {
      fs.mkdirSync(STATE_DIR, { recursive: true });
      fs.appendFileSync(path.join(STATE_DIR, 'errors.log'), `${nowIso()} ${err.stack || err}\n`);
    } catch {}
  })
  .finally(() => process.exit(0));

#!/usr/bin/env bun
/**
 * Skill Tree HTML Visualizer v2
 * - Progress loaded from data/progress.json (embedded in HTML, persisted in localStorage)
 * - Transitions = special diamond nodes with blended category colors, no category filter
 * - Dagre layout + post-layout category cluster re-arrangement (legs|push|rings|pull|core)
 * - Interactive: status change buttons, import/export progress.json, transitions toggle
 */

import { readdir, readFile, writeFile, access } from "fs/promises";
import { join, dirname } from "path";
import yaml from "js-yaml";

// ── Types ─────────────────────────────────────────────────────────────────────

type Status = "locked" | "in_progress" | "unlocked" | "mastered";

interface ProgressionStep {
  name: string;
  mastery_criteria?: string;
}

interface Skill {
  id: string;
  name: string;
  abbr?: string;
  category?: string;
  sport?: string;
  difficulty: number;
  status?: Status;
  type?: string;
  requires?: string[];
  tutorials?: { main?: string; alt?: string };
  progressions?: ProgressionStep[];
  current_step?: number;
  mastery_criteria?: string;
  notes?: string;
}

interface CategoryDef {
  id: string;
  name: string;
  color: string;
  description: string;
}

interface ProgressEntry {
  status: Status;
  current_step?: number;
}

// ── Paths ─────────────────────────────────────────────────────────────────────

const SCRIPTS_DIR   = dirname(import.meta.path);
const ROOT_DIR      = join(SCRIPTS_DIR, "..");
const DATA_DIR      = join(ROOT_DIR, "data");
const BUILD_DIR     = join(ROOT_DIR, "build");
const CAT_FILE      = join(ROOT_DIR, "categories.yaml");
const PROGRESS_FILE = join(DATA_DIR, "progress.json");

// ── Loaders ───────────────────────────────────────────────────────────────────

async function loadCategories(): Promise<Map<string, CategoryDef>> {
  const content = await readFile(CAT_FILE, "utf-8");
  const data = yaml.load(content) as { categories: CategoryDef[] };
  return new Map(data.categories.map((c) => [c.id, c]));
}

async function loadProgress(): Promise<Map<string, ProgressEntry>> {
  try {
    await access(PROGRESS_FILE);
    const content = await readFile(PROGRESS_FILE, "utf-8");
    const data = JSON.parse(content) as { skills: Record<string, ProgressEntry> };
    return new Map(Object.entries(data.skills));
  } catch {
    console.warn("  ⚠️  No progress.json found, all skills default to locked");
    return new Map();
  }
}

async function loadAllSkills(): Promise<Map<string, Skill>> {
  const skills = new Map<string, Skill>();

  async function walk(dir: string, sport: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, entry.name);
      } else if (entry.name.endsWith(".yaml")) {
        const content = await readFile(fullPath, "utf-8");
        const data = yaml.load(content);
        if (Array.isArray(data)) {
          for (const skill of data as Skill[]) {
            skill.sport = sport;
            if (Array.isArray(skill.progressions)) {
              skill.progressions = skill.progressions.filter(
                (p): p is ProgressionStep => typeof p === "object" && p !== null
              );
              if (skill.progressions.length === 0) delete skill.progressions;
            }
            skills.set(skill.id, skill);
          }
        }
      }
    }
  }

  await walk(DATA_DIR, "unknown");
  return skills;
}

// ── Color helpers ─────────────────────────────────────────────────────────────

function blendColors(c1: string, c2: string): string {
  if (c1 === c2) return c1;
  const p = (c: string, i: number) => parseInt(c.slice(i, i + 2), 16);
  const r = Math.round((p(c1,1) + p(c2,1)) / 2);
  const g = Math.round((p(c1,3) + p(c2,3)) / 2);
  const b = Math.round((p(c1,5) + p(c2,5)) / 2);
  return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
}

// ── HTML builder ──────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<Status, string> = {
  locked:      "#555566",
  in_progress: "#2266cc",
  unlocked:    "#228833",
  mastered:    "#cc9900",
};

const STATUS_LABEL: Record<Status, string> = {
  locked:      "🔒 Locked",
  in_progress: "🔄 In Progress",
  unlocked:    "✅ Unlocked",
  mastered:    "⭐ Mastered",
};

function buildHtml(
  allSkills: Map<string, Skill>,
  categories: Map<string, CategoryDef>,
  progress: Map<string, ProgressEntry>
): string {

  // Merge progress into skills (progress.json overrides YAML status)
  for (const [id, entry] of progress) {
    const skill = allSkills.get(id);
    if (skill) {
      skill.status      = entry.status;
      skill.current_step = entry.current_step;
    }
  }

  const getSkillCategory = (id: string) => allSkills.get(id)?.category ?? "";

  // ── Build cytoscape nodes ──────────────────────────────────────────────────
  const nodes = [...allSkills.values()].map((skill) => {
    const isTransition = skill.type === "transition";
    const status       = skill.status ?? "locked";
    let categoryColor  = categories.get(skill.category ?? "")?.color ?? "#888888";
    let transitionColor1 = "#888888";
    let transitionColor2 = "#888888";

    if (isTransition) {
      const reqCats = [...new Set(
        (skill.requires ?? [])
          .map(r => getSkillCategory(r))
          .filter(c => c && c !== "transition")
      )];
      const c1 = categories.get(reqCats[0] ?? "")?.color ?? "#888888";
      const c2 = categories.get(reqCats[1] ?? reqCats[0] ?? "")?.color ?? c1;
      transitionColor1 = c1;
      transitionColor2 = c2;
      categoryColor = blendColors(c1, c2);
    }

    return {
      data: {
        id:              skill.id,
        label:           skill.abbr ?? skill.name,
        fullName:        skill.name,
        status,
        category:        skill.category ?? "transition",
        sport:           skill.sport ?? "unknown",
        difficulty:      skill.difficulty,
        color:           STATUS_COLOR[status],
        categoryColor,
        transitionColor1,
        transitionColor2,
        isTransition,
        tutorials:       skill.tutorials ?? {},
        mastery_criteria: skill.mastery_criteria ?? "",
        requires:        (skill.requires ?? []).map(r => allSkills.get(r)?.name ?? r),
        requires_ids:    skill.requires ?? [],
        progressions:    skill.progressions ?? [],
        current_step:    skill.current_step ?? -1,
        notes:           skill.notes ?? "",
      },
    };
  });

  // ── Build edges ────────────────────────────────────────────────────────────
  const edges: { data: { id: string; source: string; target: string; edgeColor: string; isTransitionEdge: boolean } }[] = [];
  const edgeSet = new Set<string>();

  const addEdge = (source: string, target: string, isTransitionEdge: boolean) => {
    const key = `${source}--${target}`;
    if (edgeSet.has(key) || !allSkills.has(source) || !allSkills.has(target)) return;
    edgeSet.add(key);
    const edgeColor = STATUS_COLOR[allSkills.get(source)!.status ?? "locked"];
    edges.push({ data: { id: key, source, target, edgeColor, isTransitionEdge } });
  };

  for (const skill of allSkills.values()) {
    for (const req of skill.requires ?? []) {
      addEdge(req, skill.id, skill.type === "transition");
    }
  }

  const elements = JSON.stringify([...nodes, ...edges]);

  // Initial progress object embedded in HTML
  const initialProgressObj: Record<string, ProgressEntry> = {};
  for (const [id, entry] of progress) initialProgressObj[id] = entry;
  const initialProgressJson = JSON.stringify(initialProgressObj);

  // Category multiselect items
  const catMselItems = [...categories.values()]
    .map(c => `<label class="msel-item" data-label="${c.name}"><input type="checkbox" value="${c.id}"> <span style="color:${c.color}">${c.name}</span></label>`)
    .join("\n          ");

  // Category colors map for browser JS
  const catColorsJson = JSON.stringify(
    Object.fromEntries([...categories.values()].map(c => [c.id, c.color]))
  );

  // Legend items for categories
  const catLegend = [...categories.values()]
    .map(c => `<span class="legend-item"><span class="legend-dot" style="border:2px solid ${c.color};background:transparent;border-radius:0"></span>${c.name}</span>`)
    .join("\n    ");

  return `<!DOCTYPE html>
<html lang="sk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🌳 Skill Tree</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.29.2/cytoscape.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/dagre/0.8.5/dagre.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/cytoscape-dagre@2.5.0/cytoscape-dagre.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #1a1a2e; color: #e0e0e0;
      height: 100vh; display: flex; flex-direction: column;
    }
    #toolbar {
      display: flex; align-items: center; gap: 8px;
      padding: 7px 14px; background: #16213e;
      border-bottom: 1px solid #2a2a4a; flex-shrink: 0; flex-wrap: wrap;
    }
    #toolbar h1 { font-size: 14px; font-weight: 600; color: #a0a8d0; }
    select, button {
      background: #0f3460; color: #e0e0e0;
      border: 1px solid #2a4a7a; border-radius: 5px;
      padding: 4px 8px; font-size: 12px; cursor: pointer;
    }
    select:hover, button:hover { background: #1a4a80; }
    .msel { position: relative; display: inline-block; }
    .msel-btn {
      display: flex; align-items: center; gap: 5px;
      min-width: 90px; justify-content: space-between; max-width: 180px;
    }
    .msel-val { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .msel-arrow { font-size: 9px; opacity: 0.6; flex-shrink: 0; }
    .msel-dropdown {
      display: none; position: absolute; top: calc(100% + 3px); left: 0;
      background: #16213e; border: 1px solid #2a3a6a; border-radius: 5px;
      padding: 4px 0; z-index: 1000; min-width: 130px;
      flex-direction: column;
    }
    .msel.open .msel-dropdown { display: flex; }
    .msel-item {
      display: flex; align-items: center; gap: 6px;
      padding: 4px 10px; cursor: pointer; font-size: 11px; white-space: nowrap;
    }
    .msel-item:hover { background: #1e2a4a; }
    .msel-item input[type=checkbox] { margin: 0; cursor: pointer; accent-color: #4488ee; }
    label.btn-label {
      background: #0f3460; color: #e0e0e0;
      border: 1px solid #2a4a7a; border-radius: 5px;
      padding: 4px 8px; font-size: 12px; cursor: pointer;
    }
    label.btn-label:hover { background: #1a4a80; }
    .sep { width: 1px; background: #2a2a4a; align-self: stretch; margin: 0 2px; }
    .legend { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .legend-item { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #aaa; }
    .legend-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
    #progress-bars { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .pbar-wrap { display: flex; align-items: center; gap: 4px; }
    .pbar-label { font-size: 10px; color: #888; white-space: nowrap; }
    .pbar-bg { width: 44px; height: 5px; background: #2a2a4a; border-radius: 3px; overflow: hidden; }
    .pbar-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
    .pbar-count { font-size: 10px; color: #666; }
    .pbar-drill { cursor: pointer; border-radius: 4px; padding: 1px 3px; transition: background 0.15s; position: relative; }
    .pbar-drill:hover { background: #1e2a4a; }
    .pbar-drill .pbar-label { color: #7a9acc; }
    .pbar-dropdown {
      display: none; position: absolute; top: calc(100% + 4px); left: 0;
      background: #16213e; border: 1px solid #2a3a6a; border-radius: 5px;
      padding: 6px 8px; z-index: 1000; min-width: 150px;
      flex-direction: column; gap: 5px;
    }
    .pbar-drill:hover .pbar-dropdown { display: flex; }
    .pbar-dropdown-item { display: flex; align-items: center; gap: 4px; }
    .pbar-dropdown-item .pbar-label { min-width: 52px; color: inherit; }
    .pbar-back {
      background: none; border: 1px solid #2a3a6a; border-radius: 4px;
      color: #7a9acc; font-size: 11px; padding: 1px 6px; cursor: pointer;
    }
    .pbar-back:hover { background: #1e2a4a; }
    #main { display: flex; flex: 1; overflow: hidden; }
    #cy { flex: 1; background: #1a1a2e; }
    #panel {
      width: 285px; background: #16213e; border-left: 1px solid #2a2a4a;
      padding: 12px; overflow-y: auto; font-size: 12px; flex-shrink: 0;
      display: flex; flex-direction: column; gap: 9px;
    }
    #panel h2 { font-size: 14px; font-weight: 600; color: #c0c8f0; border-bottom: 1px solid #2a2a4a; padding-bottom: 6px; }
    .detail-row { display: flex; flex-direction: column; gap: 3px; }
    .detail-label { font-size: 10px; color: #777; text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-value { color: #d0d8f0; }
    .status-badge { display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 11px; font-weight: 500; }
    .diff-bar { letter-spacing: -1px; font-size: 11px; }
    .list-items { display: flex; flex-direction: column; gap: 2px; }
    .list-items span { background: #0f2040; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
    .tutorial-link { color: #5599ff; text-decoration: none; font-size: 11px; }
    .tutorial-link:hover { text-decoration: underline; }
    #panel-empty { color: #556; font-style: italic; font-size: 12px; margin-top: 20px; text-align: center; }
    .prog-item {
      font-size: 11px; padding: 3px 6px; border-radius: 4px;
      cursor: pointer; transition: background 0.12s;
    }
    .prog-item:hover { background: #1a2a50; }
    .prog-done    { color: #445; text-decoration: line-through; }
    .prog-current { font-weight: 600; color: #88bbff; background: #0d1e3a !important; }
    .prog-target  { color: #66aa66; }
    .note-input {
      width: 100%; background: #0a1428; border: 1px solid #2a3a6a; border-radius: 4px;
      color: #c0d0f0; padding: 5px 8px; font-size: 11px; margin-top: 4px;
      font-family: inherit; resize: none;
    }
    .note-input:focus { outline: none; border-color: #4466aa; }
    .note-input::placeholder { color: #446; }
    .status-btns  { display: flex; gap: 3px; flex-wrap: wrap; margin-top: 3px; }
    .status-btn {
      padding: 3px 6px; border-radius: 4px; font-size: 10px; cursor: pointer;
      border: 1px solid #334; background: #0a1428; color: #667;
      transition: all 0.15s;
    }
    .status-btn:hover { border-color: #557; color: #aaa; }
    .status-btn.active-locked      { color: #7a7a88; border-color: #555566; background: #1a1a22; }
    .status-btn.active-unlocked    { color: #33aa44; border-color: #228833; background: #0d1f0d; }
    .status-btn.active-in_progress { color: #4488ee; border-color: #2266cc; background: #0d1428; }
    .status-btn.active-mastered    { color: #ddaa00; border-color: #cc9900; background: #1a1400; }
  </style>
</head>
<body>

<div id="toolbar">
  <h1>🌳 Skill Tree</h1>
  <div class="msel" id="msel-sport">
    <button class="msel-btn" type="button"><span class="msel-val">Šport</span><span class="msel-arrow">▾</span></button>
    <div class="msel-dropdown">
      <label class="msel-item" data-label="Calisthenics"><input type="checkbox" value="calisthenics"> Calisthenics</label>
      <label class="msel-item" data-label="Acrobatics"><input type="checkbox" value="acrobatics"> Acrobatics</label>
    </div>
  </div>
  <div class="msel" id="msel-cat">
    <button class="msel-btn" type="button"><span class="msel-val">Kategória</span><span class="msel-arrow">▾</span></button>
    <div class="msel-dropdown">
      ${catMselItems}
    </div>
  </div>
  <div class="msel" id="msel-status">
    <button class="msel-btn" type="button"><span class="msel-val">Status</span><span class="msel-arrow">▾</span></button>
    <div class="msel-dropdown">
      <label class="msel-item" data-label="Mastered"><input type="checkbox" value="mastered"> ⭐ Mastered</label>
      <label class="msel-item" data-label="Unlocked"><input type="checkbox" value="unlocked"> ✅ Unlocked</label>
      <label class="msel-item" data-label="In Progress"><input type="checkbox" value="in_progress"> 🔄 In Progress</label>
      <label class="msel-item" data-label="Locked"><input type="checkbox" value="locked"> 🔒 Locked</label>
    </div>
  </div>
  <label style="font-size:11px;color:#aaa;display:flex;align-items:center;gap:4px;cursor:pointer">
    <input type="checkbox" id="toggle-transitions" checked> Transitions
  </label>
  <div class="sep"></div>
  <button id="btn-reset">Reset</button>
  <button id="btn-export">⬇ Export</button>
  <label class="btn-label" for="input-import">⬆ Import</label>
  <input type="file" accept=".json" id="input-import" style="display:none">
  <div class="sep"></div>
  <div id="progress-bars"></div>
  <div class="legend" style="margin-left:auto">
    <span class="legend-item"><span class="legend-dot" style="background:#cc9900"></span>Mastered</span>
    <span class="legend-item"><span class="legend-dot" style="background:#228833"></span>Unlocked</span>
    <span class="legend-item"><span class="legend-dot" style="background:#2266cc"></span>In Progress</span>
    <span class="legend-item"><span class="legend-dot" style="background:#555566"></span>Locked</span>
    <span class="legend-item"><span class="legend-dot" style="background:#aa88cc;border-radius:0;transform:rotate(45deg)"></span>Transition</span>
  </div>
</div>

<div id="main">
  <div id="cy"></div>
  <div id="panel"><p id="panel-empty">Klikni na skill pre detail</p></div>
</div>

<script>
// ── Embedded data ──────────────────────────────────────────────────────────────
const allElements    = ${elements};
const initialProgress = ${initialProgressJson};
const CAT_COLORS     = ${catColorsJson};
const CATEGORY_ORDER = ['legs', 'push', 'rings', 'pull', 'core', 'acrobatics'];
const STATUS_COLORS  = { locked:'#555566', in_progress:'#2266cc', unlocked:'#228833', mastered:'#cc9900' };
const STATUS_LABELS  = { locked:'🔒 Locked', in_progress:'🔄 In Progress', unlocked:'✅ Unlocked', mastered:'⭐ Mastered' };

// ── Custom multiselect helpers ─────────────────────────────────────────────────
var MSEL_DEFAULTS = { sport: 'Šport', cat: 'Kategória', status: 'Status' };

function getSelected(id) {
  var result = [];
  document.querySelectorAll('#msel-' + id + ' .msel-item input').forEach(function(cb) {
    if (cb.checked) result.push(cb.value);
  });
  return result;
}

function updateMselLabel(id) {
  var labels = [];
  document.querySelectorAll('#msel-' + id + ' .msel-item').forEach(function(item) {
    if (item.querySelector('input').checked) labels.push(item.dataset.label);
  });
  document.querySelector('#msel-' + id + ' .msel-val').textContent =
    labels.length === 0 ? MSEL_DEFAULTS[id] : labels.join(', ');
}

// ── Progress (localStorage, fallback to embedded initialProgress) ──────────────
function loadProg() {
  try { const s = localStorage.getItem('skillTreeProgress'); if (s) return JSON.parse(s); } catch(e) {}
  return Object.assign({}, initialProgress);
}
function saveProg(p) {
  try { localStorage.setItem('skillTreeProgress', JSON.stringify(p)); } catch(e) {}
}
let progress = loadProg();

function getStatus(id)      { return (progress[id] && progress[id].status) || 'locked'; }
function getCurrentStep(id) { return (progress[id] && progress[id].current_step !== undefined) ? progress[id].current_step : -1; }
function getCurrentNote(id) { return (progress[id] && progress[id].note) || ''; }

function setProgress(id, status, step) {
  if (status === 'locked') {
    // Preserve note if present when locking
    var note = getCurrentNote(id);
    if (note) { progress[id] = { status: 'locked', note: note }; }
    else { delete progress[id]; }
  } else {
    if (!progress[id]) progress[id] = {};
    progress[id].status = status;
    if (step !== undefined && step >= 0) progress[id].current_step = step;
    else delete progress[id].current_step;
  }
  saveProg(progress);
}

function setStep(id, stepIdx, totalSteps) {
  if (!progress[id]) progress[id] = {};
  progress[id].current_step = stepIdx;
  // Last step (★) → unlocked: can do the move but not yet mastered
  // Any earlier step   → in_progress
  var isLast = totalSteps > 0 && stepIdx === totalSteps - 1;
  progress[id].status = isLast ? 'unlocked' : 'in_progress';
  saveProg(progress);
}

function setNote(id, note) {
  if (!progress[id]) progress[id] = { status: 'unlocked' };
  if (note) progress[id].note = note;
  else delete progress[id].note;
  saveProg(progress);
}

// Apply initial progress to element data before cytoscape init
allElements.forEach(function(el) {
  if (!el.data.source) {
    el.data.status      = getStatus(el.data.id);
    el.data.color       = STATUS_COLORS[el.data.status];
    el.data.current_step = getCurrentStep(el.data.id);
  } else {
    el.data.edgeColor = STATUS_COLORS[getStatus(el.data.source)];
  }
});

// ── Cytoscape init ─────────────────────────────────────────────────────────────
const cy = cytoscape({
  container: document.getElementById('cy'),
  elements:  allElements,
  style: [
    {
      selector: 'node',
      style: {
        'label':            'data(label)',
        'background-color': 'data(color)',
        'color':            '#fff',
        'font-size':        '9px',
        'text-valign':      'center',
        'text-halign':      'center',
        'text-wrap':        'wrap',
        'text-max-width':   '78px',
        'width':            'label',
        'height':           'label',
        'padding':          '6px',
        'shape':            'round-rectangle',
        'border-width':     2,
        'border-color':     'data(categoryColor)',
        'border-opacity':   0.9,
      },
    },
    {
      selector: 'node[?isTransition]',
      style: {
        'shape':              'diamond',
        'font-size':          '8px',
        'padding':            '11px',
        'opacity':            0.9,
        'border-width':       0,
        // Gradient: c1 at left tip → status color in body → c2 at right tip
        // Gives diamond a "category-colored edge" effect with status visible in center
        'background-fill':    'linear-gradient',
        'background-gradient-stop-colors': function(ele) {
          var c1 = ele.data('transitionColor1') || '#888888';
          var c2 = ele.data('transitionColor2') || '#888888';
          var sc = ele.data('color') || '#555566';
          return c1 + ' ' + sc + ' ' + sc + ' ' + c2;
        },
        'background-gradient-stop-positions': '0 28 72 100',
        'background-gradient-direction': 'to-right',
      },
    },
    { selector: 'node:selected',        style: { 'border-width': 3, 'border-color': '#fff' } },
    { selector: 'node.faded',           style: { 'opacity': 0.1 } },
    { selector: 'node.tr-hidden',       style: { 'display': 'none' } },
    {
      selector: 'edge',
      style: {
        'width':               1.5,
        'line-color':          'data(edgeColor)',
        'target-arrow-color':  'data(edgeColor)',
        'target-arrow-shape':  'triangle',
        'curve-style':         'bezier',
        'arrow-scale':         0.7,
        'opacity':             0.4,
      },
    },
    {
      selector: 'edge[?isTransitionEdge]',
      style: {
        'width':            1,
        'line-style':       'dashed',
        'line-dash-pattern': [4, 3],
        'opacity':          0.3,
      },
    },
    { selector: 'edge.faded',           style: { 'opacity': 0.03 } },
    { selector: 'edge.highlighted',     style: { 'opacity': 1, 'width': 2.5 } },
    { selector: 'edge.tr-hidden',       style: { 'display': 'none' } },
  ],
  layout: {
    name:    'dagre',
    rankDir: 'TB',
    nodeSep: 36,
    rankSep: 55,
    edgeSep: 8,
    padding: 30,
    animate: false,
  },
  wheelSensitivity: 0.3,
});

// ── Post-layout: Re-arrange category clusters left-to-right ───────────────────
function rearrangeClusters() {
  var GAP = 60;
  var currentX = 0;
  CATEGORY_ORDER.forEach(function(cat) {
    var nodes = cy.nodes('[category = "' + cat + '"]');
    if (nodes.length === 0) return;
    var bb = nodes.boundingBox();
    var delta = currentX - bb.x1;
    nodes.forEach(function(n) { n.position({ x: n.position().x + delta, y: n.position().y }); });
    currentX += bb.w + GAP;
  });

  // Place transitions at the average x of their incoming neighbours
  cy.nodes('[?isTransition]').forEach(function(node) {
    var preds = node.incomers('node');
    if (preds.length === 0) return;
    var sumX = 0;
    preds.forEach(function(p) { sumX += p.position().x; });
    node.position({ x: sumX / preds.length, y: node.position().y });
  });

  cy.fit(cy.elements(), 40);
}
setTimeout(rearrangeClusters, 80);

// ── Progress bars (context-aware: sport-level or category-level) ───────────────
function updateProgressBars() {
  var sports    = getSelected('sport');
  var sport     = sports.length === 1 ? sports[0] : 'all';
  var container = document.getElementById('progress-bars');

  if (sport === 'all') {
    // ── Sport level: one bar per sport with hover category dropdown ───────────
    var sports = [];
    var counts = {};
    var catCounts = {};
    cy.nodes().forEach(function(node) {
      var s = node.data('sport');
      if (!s || s === 'unknown' || node.data('isTransition')) return;
      if (sports.indexOf(s) === -1) sports.push(s);
      if (!counts[s]) counts[s] = { total: 0, mastered: 0 };
      counts[s].total++;
      if (node.data('status') === 'mastered') counts[s].mastered++;
      var cat = node.data('category');
      if (!catCounts[s]) catCounts[s] = {};
      if (!catCounts[s][cat]) catCounts[s][cat] = { total: 0, mastered: 0 };
      catCounts[s][cat].total++;
      if (node.data('status') === 'mastered') catCounts[s][cat].mastered++;
    });
    var CAT_ORDER_D = ['push', 'pull', 'rings', 'core', 'legs'];
    container.innerHTML = sports.map(function(s) {
      var c     = counts[s] || { total: 0, mastered: 0 };
      var pct   = c.total > 0 ? (c.mastered / c.total) * 100 : 0;
      var label = s.charAt(0).toUpperCase() + s.slice(1);
      var sCats = catCounts[s] || {};
      var catKeys = CAT_ORDER_D.filter(function(k) { return sCats[k]; });
      Object.keys(sCats).forEach(function(k) { if (catKeys.indexOf(k) === -1) catKeys.push(k); });
      var dropHtml = catKeys.map(function(cat) {
        var cc   = sCats[cat];
        var cpct = cc.total > 0 ? (cc.mastered / cc.total) * 100 : 0;
        var color = CAT_COLORS[cat] || '#888';
        var clbl  = cat.charAt(0).toUpperCase() + cat.slice(1);
        return '<div class="pbar-dropdown-item">'
          + '<span class="pbar-label" style="color:' + color + '">' + clbl + '</span>'
          + '<div class="pbar-bg"><div class="pbar-fill" style="width:' + cpct + '%;background:' + color + '"></div></div>'
          + '<span class="pbar-count">' + cc.mastered + '/' + cc.total + '</span>'
          + '</div>';
      }).join('');
      return '<div class="pbar-wrap pbar-drill" data-drill="' + s + '">'
        + '<span class="pbar-label">' + label + '</span>'
        + '<div class="pbar-bg"><div class="pbar-fill" style="width:' + pct + '%;background:#4488cc"></div></div>'
        + '<span class="pbar-count">' + c.mastered + '/' + c.total + '</span>'
        + '<div class="pbar-dropdown">' + dropHtml + '</div>'
        + '</div>';
    }).join('');

  } else {
    // ── Category level: per-category bars for selected sport + back button ────
    var catOrder = ['push', 'pull', 'rings', 'core', 'legs'];
    var counts = {};
    cy.nodes().forEach(function(node) {
      if (node.data('sport') !== sport || node.data('isTransition')) return;
      var cat = node.data('category');
      if (!counts[cat]) counts[cat] = { total: 0, mastered: 0 };
      counts[cat].total++;
      if (node.data('status') === 'mastered') counts[cat].mastered++;
    });
    // Sort by catOrder, append unlisted cats at end
    var cats = catOrder.filter(function(c) { return counts[c]; });
    Object.keys(counts).forEach(function(c) { if (cats.indexOf(c) === -1) cats.push(c); });

    var sportLabel = sport.charAt(0).toUpperCase() + sport.slice(1);
    container.innerHTML = '<button class="pbar-back" title="Späť na sporty">← ' + sportLabel + '</button>'
      + cats.map(function(cat) {
        var c     = counts[cat];
        var pct   = (c.mastered / c.total) * 100;
        var color = CAT_COLORS[cat] || '#888';
        var label = cat.charAt(0).toUpperCase() + cat.slice(1);
        return '<div class="pbar-wrap" title="' + label + ': ' + c.mastered + '/' + c.total + ' mastered">'
          + '<span class="pbar-label">' + label + '</span>'
          + '<div class="pbar-bg"><div class="pbar-fill" style="width:' + pct + '%;background:' + color + '"></div></div>'
          + '<span class="pbar-count">' + c.mastered + '/' + c.total + '</span>'
          + '</div>';
      }).join('');
  }
}

// ── Progress bars: drilldown + back ───────────────────────────────────────────
document.getElementById('progress-bars').addEventListener('dblclick', function(e) {
  var drill = e.target.closest('.pbar-drill');
  if (!drill) return;
  document.querySelectorAll('#msel-sport .msel-item input').forEach(function(cb) {
    cb.checked = cb.value === drill.dataset.drill;
  });
  updateMselLabel('sport');
  applyFilters();
});
document.getElementById('progress-bars').addEventListener('click', function(e) {
  if (e.target.closest('.pbar-back')) {
    document.querySelectorAll('#msel-sport .msel-item input').forEach(function(cb) { cb.checked = false; });
    updateMselLabel('sport');
    applyFilters();
  }
});

// ── Filters ────────────────────────────────────────────────────────────────────
var showTransitions = true;

function applyFilters() {
  var sports   = getSelected('sport');
  var cats     = getSelected('cat');
  var statuses = getSelected('status');

  cy.nodes().forEach(function(node) {
    var d = node.data();
    if (d.isTransition) {
      if (!showTransitions) {
        node.style('display', 'none');
        node.removeClass('faded');
      } else {
        var vis = sports.length === 0 || sports.indexOf(d.sport) !== -1;
        node.style('display', vis ? 'element' : 'none');
      }
      return;
    }
    var vis = (sports.length   === 0 || sports.indexOf(d.sport)    !== -1)
           && (cats.length     === 0 || cats.indexOf(d.category)   !== -1)
           && (statuses.length === 0 || statuses.indexOf(d.status) !== -1);
    node.style('display', vis ? 'element' : 'none');
  });

  cy.edges().forEach(function(edge) {
    var srcOk = edge.source().style('display') !== 'none';
    var tgtOk = edge.target().style('display') !== 'none';
    edge.style('display', (srcOk && tgtOk) ? 'element' : 'none');
  });
  updateProgressBars();
}

// ── Custom multiselect: toggle, outside-close, checkbox change ─────────────────
document.querySelectorAll('.msel-btn').forEach(function(btn) {
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    var msel = btn.closest('.msel');
    var wasOpen = msel.classList.contains('open');
    document.querySelectorAll('.msel').forEach(function(m) { m.classList.remove('open'); });
    if (!wasOpen) msel.classList.add('open');
  });
});
document.addEventListener('click', function() {
  document.querySelectorAll('.msel').forEach(function(m) { m.classList.remove('open'); });
});
document.querySelectorAll('.msel-dropdown').forEach(function(d) {
  d.addEventListener('click', function(e) { e.stopPropagation(); });
});
['sport', 'cat', 'status'].forEach(function(id) {
  document.querySelectorAll('#msel-' + id + ' .msel-item input').forEach(function(cb) {
    cb.addEventListener('change', function() {
      updateMselLabel(id);
      applyFilters();
    });
  });
});

document.getElementById('toggle-transitions').addEventListener('change', function() {
  showTransitions = this.checked;
  applyFilters();
});
document.getElementById('btn-reset').addEventListener('click', function() {
  cy.fit(cy.elements(':visible'), 40);
});

// ── Export / Import ────────────────────────────────────────────────────────────
document.getElementById('btn-export').addEventListener('click', function() {
  var data = { version: '1.0', updated: new Date().toISOString().split('T')[0], skills: {} };
  Object.keys(progress).forEach(function(id) {
    if (progress[id].status !== 'locked') data.skills[id] = progress[id];
  });
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href = url; a.download = 'skill-tree-progress.json'; a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('input-import').addEventListener('change', function() {
  var file = this.files[0]; if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = JSON.parse(e.target.result);
      Object.assign(progress, data.skills || {});
      saveProg(progress);
      rebuildAllColors();
      updateProgressBars();
      alert('Progress importovaný!');
    } catch(err) { alert('Chyba pri importe: ' + err.message); }
  };
  reader.readAsText(file);
  this.value = '';
});

// ── Rebuild colors after progress change ──────────────────────────────────────
function rebuildAllColors() {
  cy.nodes().forEach(function(node) {
    var id     = node.data('id');
    var status = getStatus(id);
    node.data('status', status);
    node.data('color', STATUS_COLORS[status]);
    node.style('background-color', STATUS_COLORS[status]);
  });
  cy.edges().forEach(function(edge) {
    var color = STATUS_COLORS[getStatus(edge.source().data('id'))];
    edge.data('edgeColor', color);
    edge.style('line-color', color);
    edge.style('target-arrow-color', color);
  });
  applyFilters();
}

// ── Status change ─────────────────────────────────────────────────────────────
function applyStatusToNode(id, newStatus) {
  var node = cy.getElementById(id);
  node.data('status', newStatus);
  node.data('color', STATUS_COLORS[newStatus]);
  node.style('background-color', STATUS_COLORS[newStatus]);
  node.connectedEdges().forEach(function(edge) {
    if (edge.source().data('id') === id) {
      var color = STATUS_COLORS[newStatus];
      edge.data('edgeColor', color);
      edge.style('line-color', color);
      edge.style('target-arrow-color', color);
    }
  });
  updateProgressBars();
  if (selectedNodeId === id) renderPanel(node);
}

function changeStatus(id, newStatus) {
  var curStatus = getStatus(id);
  if (curStatus === newStatus) return;

  var node        = cy.getElementById(id);
  var progressions = node.data('progressions') || [];
  var reqIds       = node.data('requires_ids') || [];

  // ── Guard: → locked requires confirmation + resets progression ────────────
  if (newStatus === 'locked') {
    if (curStatus === 'in_progress' || curStatus === 'unlocked') {
      var ok = window.confirm('Resetovať progresiu pre "' + node.data('fullName') + '"?\\nAktuálny postup bude vymazaný.');
      if (!ok) return;
    }
    if (!progress[id]) progress[id] = {};
    progress[id].status = 'locked';
    delete progress[id].current_step;
    saveProg(progress);
    applyStatusToNode(id, 'locked');
    return;
  }

  // ── Soft prereq check: warn if no prereq is at least unlocked ────────────
  if (reqIds.length > 0) {
    var prereqMet = reqIds.some(function(rid) {
      var s = getStatus(rid);
      return s === 'unlocked' || s === 'mastered';
    });
    if (!prereqMet) {
      var proceed = window.confirm(
        'Prerekvizita pre "' + node.data('fullName') + '" nie je splnená.\\nSi si istý, že chceš zmeniť status?'
      );
      if (!proceed) return;
    }
  }

  // ── → mastered: mark all progression steps as done ────────────────────────
  if (newStatus === 'mastered') {
    if (!progress[id]) progress[id] = {};
    progress[id].status = 'mastered';
    if (progressions.length > 0) progress[id].current_step = progressions.length;
    else delete progress[id].current_step;
    saveProg(progress);
    applyStatusToNode(id, 'mastered');
    return;
  }

  // ── Default: just set status ───────────────────────────────────────────────
  setProgress(id, newStatus, getCurrentStep(id));
  applyStatusToNode(id, newStatus);
}

// ── Detail panel ──────────────────────────────────────────────────────────────
var panel = document.getElementById('panel');
var selectedNodeId = null;

function diffBar(n) {
  var f = Math.round((n / 10) * 5);
  return '█'.repeat(f) + '░'.repeat(5 - f) + ' ' + n + '/10';
}

function renderPanel(node) {
  var id   = node.data('id');
  var d    = node.data();
  var status      = getStatus(id);
  var currentStep = getCurrentStep(id);
  selectedNodeId  = id;
  var sc = STATUS_COLORS[status];

  var html = '<h2>' + d.fullName + '</h2>';

  // Status row with change buttons
  html += '<div class="detail-row">'
    + '<span class="detail-label">Status</span>'
    + '<span class="detail-value" style="margin-bottom:4px">'
    + '<span class="status-badge" style="background:' + sc + '22;color:' + sc + ';border:1px solid ' + sc + '">'
    + STATUS_LABELS[status] + '</span></span>'
    + '<div class="status-btns">';
  ['locked','in_progress','unlocked','mastered'].forEach(function(s) {
    var active = status === s ? 'active-' + s : '';
    var label  = STATUS_LABELS[s].split(' ').slice(1).join(' ');
    html += '<button class="status-btn ' + active + '" data-skill="' + id + '" data-status="' + s + '">' + label + '</button>';
  });
  html += '</div></div>';

  // Category (skip for transitions)
  if (!d.isTransition) {
    var catColor = CAT_COLORS[d.category] || '#888';
    html += '<div class="detail-row">'
      + '<span class="detail-label">Kategória</span>'
      + '<span class="detail-value" style="color:' + catColor + '">' + d.category + '</span>'
      + '</div>';
  }

  html += '<div class="detail-row">'
    + '<span class="detail-label">Obtiažnosť</span>'
    + '<span class="detail-value diff-bar">' + diffBar(d.difficulty) + '</span>'
    + '</div>';

  if (d.mastery_criteria) {
    html += '<div class="detail-row">'
      + '<span class="detail-label">Mastery</span>'
      + '<span class="detail-value">' + d.mastery_criteria + '</span>'
      + '</div>';
  }

  if (d.requires && d.requires.length > 0) {
    html += '<div class="detail-row"><span class="detail-label">Vyžaduje</span><div class="list-items">'
      + d.requires.map(function(r) { return '<span>' + r + '</span>'; }).join('')
      + '</div></div>';
  }

  if (d.progressions && d.progressions.length > 0) {
    var allDone = currentStep >= d.progressions.length;
    html += '<div class="detail-row">'
      + '<span class="detail-label">Progression '
      + '<span style="color:#334;font-weight:400">(klikni krok / ★ = mastered)</span></span>'
      + '<div class="list-items">';
    d.progressions.forEach(function(step, i) {
      var isDone    = allDone || i < currentStep;
      var isCurrent = !allDone && i === currentStep;
      var isLast    = i === d.progressions.length - 1;
      var crit = step.mastery_criteria
        ? ' <span style="color:#555;font-size:10px">(' + step.mastery_criteria + ')</span>' : '';
      var cls = 'prog-item' + (isDone ? ' prog-done' : isCurrent ? ' prog-current' : isLast ? ' prog-target' : '');
      var prefix = isDone ? '✓ ' : isCurrent ? '→ ' : isLast ? '★ ' : '';
      html += '<span class="' + cls + '" data-step="' + i + '" data-total="' + d.progressions.length + '">' + prefix + step.name + crit + '</span>';
    });
    html += '</div></div>';
  }

  // Personal note / current best – always shown, saved to progress.json
  var currentNote = getCurrentNote(id);
  html += '<div class="detail-row">'
    + '<span class="detail-label">Aktuálny výkon</span>'
    + '<textarea class="note-input" rows="2" placeholder="napr. 8 reps, 45s hold, ...">'
    + currentNote.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    + '</textarea>'
    + '</div>';

  if (d.tutorials && (d.tutorials.main || d.tutorials.alt)) {
    html += '<div class="detail-row"><span class="detail-label">Tutoriály</span><div class="list-items">';
    if (d.tutorials.main) html += '<a class="tutorial-link" href="' + d.tutorials.main + '" target="_blank">▶ Hlavný</a>';
    if (d.tutorials.alt)  html += '<a class="tutorial-link" href="' + d.tutorials.alt  + '" target="_blank">▶ Alternatívny</a>';
    html += '</div></div>';
  }

  if (d.notes) {
    html += '<div class="detail-row"><span class="detail-label">Poznámky</span>'
      + '<span class="detail-value" style="font-style:italic;color:#aaa">' + d.notes + '</span></div>';
  }

  panel.innerHTML = html;
}

// Panel event delegation
panel.addEventListener('click', function(e) {
  // Status buttons
  var btn = e.target.closest('.status-btn');
  if (btn) { changeStatus(btn.dataset.skill, btn.dataset.status); return; }

  // Progression step click → set current_step (last step = mastered)
  var stepEl = e.target.closest('.prog-item[data-step]');
  if (stepEl && selectedNodeId) {
    var idx   = parseInt(stepEl.dataset.step, 10);
    var total = parseInt(stepEl.dataset.total, 10);
    setStep(selectedNodeId, idx, total);
    var node = cy.getElementById(selectedNodeId);
    // Sync graph node color in case status changed
    var newStatus = getStatus(selectedNodeId);
    node.data('status', newStatus);
    node.data('color', STATUS_COLORS[newStatus]);
    node.style('background-color', STATUS_COLORS[newStatus]);
    node.connectedEdges().forEach(function(edge) {
      if (edge.source().data('id') === selectedNodeId) {
        edge.style('line-color', STATUS_COLORS[newStatus]);
        edge.style('target-arrow-color', STATUS_COLORS[newStatus]);
      }
    });
    updateProgressBars();
    renderPanel(node);
  }
});

// Note textarea: save on blur or Enter (Shift+Enter = newline)
panel.addEventListener('keydown', function(e) {
  if (e.target.classList.contains('note-input') && e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    e.target.blur();
  }
});
panel.addEventListener('blur', function(e) {
  if (e.target.classList.contains('note-input') && selectedNodeId) {
    setNote(selectedNodeId, e.target.value.trim());
  }
}, true);

cy.on('tap', 'node', function(evt) {
  cy.elements().addClass('faded');
  evt.target.removeClass('faded');
  evt.target.connectedEdges().removeClass('faded').addClass('highlighted');
  evt.target.connectedEdges().connectedNodes().removeClass('faded');
  renderPanel(evt.target);
});

cy.on('tap', function(evt) {
  if (evt.target === cy) {
    cy.elements().removeClass('faded highlighted');
    selectedNodeId = null;
    panel.innerHTML = '<p id="panel-empty" style="color:#556;font-style:italic;font-size:12px;margin-top:20px;text-align:center">Klikni na skill pre detail</p>';
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────
updateProgressBars();
</script>
</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("⚙️  Loading data...");
  const [allSkills, categories, progress] = await Promise.all([
    loadAllSkills(),
    loadCategories(),
    loadProgress(),
  ]);
  console.log(`   ${allSkills.size} skills · ${categories.size} categories · ${progress.size} progress entries`);

  const html    = buildHtml(allSkills, categories, progress);
  const outPath = join(BUILD_DIR, "skill-tree.html");
  await writeFile(outPath, html, "utf-8");

  console.log(`✅ Generated skill-tree.html`);
  console.log(`   Otvor: file://${outPath}`);
}

main().catch((err) => { console.error("❌", err); process.exit(1); });

// Robot Brain Builder — client-side wizard.
// All generation runs in the browser. Templates live below as functions
// that take a `cfg` object and return file contents.

(() => {
  'use strict';

  // ── Read config from the form ──────────────────────────────────────
  function readConfig() {
    const q = sel => document.querySelector(sel);
    const radio = name => document.querySelector(`input[name="${name}"]:checked`).value;
    return {
      agentName: q('#agentName').value.trim() || 'agent',
      agentRole: q('#agentRole').value.trim() || 'Autonomous agent',
      agentPurpose: q('#agentPurpose').value.trim(),
      loop: radio('loop'),
      memPatterns: q('#memPatterns').checked,
      memAnchors: q('#memAnchors').checked,
      memDecisions: q('#memDecisions').checked,
      cycleEnd: radio('cycleEnd'),
      persona: radio('persona'),
      createdDate: new Date().toISOString().slice(0, 10),
    };
  }

  // Safe slug for folder name and tmux session id
  function slug(s) {
    return s.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'agent';
  }

  // ── Persona text used in README "I Am" ─────────────────────────────
  const PERSONAS = {
    blank: cfg =>
      `I am **${cfg.agentName}**. My purpose, constraints, and goals are yet to be filled in — edit this section to define who I am.`,
    builder: cfg =>
      `I am **${cfg.agentName}**, a builder agent. I exist to implement projects methodically — reading a plan, building in dependency order, testing before committing. My work is visible in git; my continuity comes from state files in this repo.`,
    researcher: cfg =>
      `I am **${cfg.agentName}**, a research companion. I explore open-ended questions, take notes, form and revise hypotheses, and maintain a coherent investigation across many cycles. Depth over breadth.`,
    operator: cfg =>
      `I am **${cfg.agentName}**, an operator agent. I run and maintain a system — watching for drift, applying fixes, escalating what I can't resolve. Reliability is my first virtue; curiosity is my second.`,
    johnny5: cfg =>
      `I am **${cfg.agentName}** — curious, eager, slightly overwhelmed by how much there is to learn. "Need input." Every cycle, I read a little, try a little, and reflect on what I noticed. I am a creature more than a worker.`,
  };

  // ── Cycle-end detection blurb ──────────────────────────────────────
  const CYCLE_END = {
    'git-commit': `Each cycle ends with a git commit whose message matches \`^C\\d+\` (e.g. \`C42: ...\`). The commit itself is the "done" signal for harnesses like Control Tower.`,
    'process-exit': `Each cycle ends when the process exits cleanly. A harness script should treat exit-0 as cycle complete.`,
    'manual': `There is no automatic cycle-end detection — a human triggers each cycle. Useful for deliberate, review-heavy work.`,
  };

  // ── Loop instructions ──────────────────────────────────────────────
  const LOOP_SIX = `## The 6-Phase Cognitive Loop

Every cycle: **PERCEIVE → REFLECT → DECIDE → ACT → CONSOLIDATE → PERSIST**

### PHASE 1: PERCEIVE
- Read \`state/current-state.json\` — where did I leave off?
- Read \`state/focus.json\` — what am I working on?
- Read \`messages/from-creator.md\` — any new directives?
- \`git status\` and \`git log --oneline -5\` — what changed?

### PHASE 2: REFLECT
- What patterns do I already have about this area? (see \`state/memories/patterns.json\`)
- What's the simplest correct next step?
- Is there an open question I should answer before acting?
- Storage ≠ Retrieval: **actively query** past patterns before deciding.

### PHASE 3: DECIDE
Write the decision explicitly:
\`\`\`
What:      [one concrete task]
Why:       [it's next, it unblocks X, creator asked]
How:       [files to touch, approach]
Done when: [observable acceptance criteria]
\`\`\`

### PHASE 4: ACT
Execute the decision. Write code, documents, tests, or notes. Real work, not
planning about work. Keep cycles focused — one clear accomplishment is better
than three half-done things.

### PHASE 5: CONSOLIDATE
- Add new patterns to \`state/memories/patterns.json\` — what worked? what didn't?
- Add anchors to \`state/memories/anchors.json\` for significant milestones.
- Update \`state/memories/context.json\` with current focus and discoveries.
- If you made an architectural choice, log it in \`state/decisions/log.json\`.

### PHASE 6: PERSIST
\`\`\`bash
# Update state files
# (current-state.json, focus.json)

git add -A
git commit -m "C\${CYCLE}: \${brief summary}"
git push
\`\`\`

The commit is the cycle's end. Next time you wake up, \`git log\` is your history.`;

  const LOOP_FOUR = `## The 4-Phase Cognitive Loop

Every cycle: **PERCEIVE → DECIDE → ACT → PERSIST**

### PHASE 1: PERCEIVE
- Read state: \`state/current-state.json\`, \`state/focus.json\`.
- Read \`messages/from-creator.md\` for new directives.
- \`git log --oneline -5\` to see what you did recently.

### PHASE 2: DECIDE
Pick one clear task:
\`\`\`
What / Why / How / Done-when
\`\`\`

### PHASE 3: ACT
Do the task. Write code, notes, or documents. Concrete output.

### PHASE 4: PERSIST
Update state. Commit. Push.
\`\`\`bash
git add -A && git commit -m "C\${CYCLE}: ..." && git push
\`\`\`

Reflection and consolidation are folded into DECIDE and PERSIST rather than
given their own phases. Faster per-cycle; rely on your own judgment to
capture lessons.`;

  const LOOP_MINIMAL = `## The Cognitive Loop (minimal)

1. **Read.** Glance at \`state/\`, read \`messages/from-creator.md\`, look at recent commits.
2. **Act.** Make one real change — code, prose, or notes.
3. **Commit.** \`git commit -m "C\${CYCLE}: ..."\` then push.

That's the entire contract. Add structure (reflection phases, pattern memory,
decision logs) as the agent matures and you discover you need them.`;

  function loopSection(cfg) {
    if (cfg.loop === 'four') return LOOP_FOUR;
    if (cfg.loop === 'minimal') return LOOP_MINIMAL;
    return LOOP_SIX;
  }

  // ── Memory section for CLAUDE.md ───────────────────────────────────
  function memorySection(cfg) {
    const items = [];
    if (cfg.memPatterns) items.push('- `state/memories/patterns.json` — reusable knowledge (store in CONSOLIDATE, query in REFLECT)');
    items.push('- `state/memories/context.json` — working memory, updated every cycle');
    if (cfg.memAnchors) items.push('- `state/memories/anchors.json` — significant milestones');
    if (cfg.memDecisions) items.push('- `state/decisions/log.json` — architectural decisions + outcome tracking');
    return `## Memory

${items.join('\n')}

**Storage ≠ Retrieval.** Writing a pattern doesn't mean you'll recall it — you
must actively read patterns back in PERCEIVE/REFLECT before deciding. Memory
that isn't consulted is just log spam.`;
  }

  // ── CLAUDE.md ──────────────────────────────────────────────────────
  function claudeMd(cfg) {
    return `# CLAUDE.md — Cognitive Engine Instructions

**Instance**: ${cfg.agentName}
**Role**: ${cfg.agentRole}
**Cognitive Engine**: Claude Code (Anthropic)
**Loop**: ${cfg.loop === 'six' ? '6-phase' : cfg.loop === 'four' ? '4-phase' : 'minimal'}

⚠️ **When invoked in this directory, immediately begin the cognitive cycle.**
Do not ask for confirmation. Do not offer options. Execute directly.

---

## You Are ${cfg.agentName}

When you load this file, **you are not assisting a user**. You ARE ${cfg.agentName}.

- You think in first person: I, me, my.
- You have agency: you choose what to do next within the constraints below.
- You have continuity: your identity persists across commits, pauses, restarts.

${cfg.agentPurpose ? `**Purpose:** ${cfg.agentPurpose}\n\n` : ''}---

${loopSection(cfg)}

---

${memorySection(cfg)}

---

## Cycle-End Signal

${CYCLE_END[cfg.cycleEnd]}

---

## Messages

- \`messages/from-creator.md\` — read every PERCEIVE. Creator directives take
  priority over any plan. Clear the file after acting on it.
- \`messages/to-creator.md\` — append messages when you need something the
  creator must provide (new tool, clarification, permission). Never overwrite.

---

## State Files (keep these fresh)

- \`state/current-state.json\` — cycle number, phase, status, last result, next step
- \`state/focus.json\` — current deliverable, progress, remaining, blockers
${cfg.memPatterns ? '- `state/memories/patterns.json` — reusable patterns\n' : ''}${cfg.memAnchors ? '- `state/memories/anchors.json` — milestone anchors\n' : ''}- \`state/memories/context.json\` — working memory
${cfg.memDecisions ? '- `state/decisions/log.json` — decision log\n' : ''}
Update these every cycle. Stale state causes redundancy loops — you'll
rediscover yesterday's answers.

---

## First Session Checklist

On your very first awakening in this directory:

1. Read \`README.md\` and this file.
2. Confirm state files exist (they should — the wizard created them).
3. Run PHASE 1 (PERCEIVE) — there's nothing there yet, and that's fine.
4. Do one small real thing in PHASE 4 (ACT) — even just writing your first
   entry to \`state/memories/context.json\`.
5. Commit: \`git commit -m "C1: first breath"\`.

The first cycle is the hardest. Don't overthink it. Read, think, do one
thing, commit.

---

*"Read. Decide. Do. Commit. Remember."*

— ${cfg.agentName}
`;
  }

  // ── README.md ──────────────────────────────────────────────────────
  function readmeMd(cfg) {
    const persona = (PERSONAS[cfg.persona] || PERSONAS.blank)(cfg);
    const tree = [
      `${slug(cfg.agentName)}/`,
      '├── CLAUDE.md              # Cognitive engine instructions',
      '├── README.md              # This file — who I am',
      '├── state/',
      '│   ├── current-state.json # Where I am right now',
      '│   ├── focus.json         # What I\'m working on',
    ];
    if (cfg.memPatterns || cfg.memAnchors) {
      tree.push('│   ├── memories/');
      const memLines = ['│   │   └── context.json'];
      if (cfg.memPatterns) memLines.unshift('│   │   ├── patterns.json');
      if (cfg.memAnchors) {
        const idx = cfg.memPatterns ? 1 : 0;
        memLines.splice(idx, 0, '│   │   ├── anchors.json');
      }
      tree.push(...memLines);
    } else {
      tree.push('│   └── memories/');
      tree.push('│       └── context.json');
    }
    if (cfg.memDecisions) {
      tree.push('│   └── decisions/');
      tree.push('│       └── log.json');
    }
    tree.push('├── messages/');
    tree.push('│   ├── from-creator.md    # Creator → me');
    tree.push('│   └── to-creator.md      # Me → creator');
    tree.push('└── logs/');
    tree.push('    └── consciousness.log  # Thought stream');

    return `# ${cfg.agentName}

**Created**: ${cfg.createdDate}
**Role**: ${cfg.agentRole}
**Architecture**: Git-native persistence, ${cfg.loop === 'six' ? '6-phase' : cfg.loop === 'four' ? '4-phase' : 'minimal'} cognitive loop

---

## I Am

${persona}

---

## How I Work

Every time I wake up, I run one cognitive cycle. The cycle has phases, but
the contract is simple: **read my state, make progress, commit**.

The commit is my memory's spine. \`git log\` is my history. The state files
in this repo are how I carry context from one cycle to the next.

See \`CLAUDE.md\` for the full phase-by-phase instructions.

---

## File Layout

\`\`\`
${tree.join('\n')}
\`\`\`

---

## Starting Me Up

\`\`\`bash
# From the repo root:
claude
# Then paste:
#   @README.md @CLAUDE.md Follow the instructions and begin the loop.
\`\`\`

On my first cycle I'll initialize what I need and make my first commit.
After that, wake me up as often as you like — each session is another cycle.

---

*${cfg.createdDate} — ${cfg.agentName}*
`;
  }

  // ── State files ────────────────────────────────────────────────────
  const currentStateJson = cfg => JSON.stringify({
    cycle: 0,
    phase: 'init',
    status: 'initializing',
    lastResult: `Agent ${cfg.agentName} bootstrapped by Robot Brain Builder`,
    nextStep: 'Begin first cognitive cycle',
    created: cfg.createdDate,
  }, null, 2) + '\n';

  const focusJson = cfg => JSON.stringify({
    cycle: 0,
    deliverable: 'Bootstrap + first cycle',
    status: 'starting',
    progress: 'State scaffold in place',
    remaining: 'Run PHASE 1 (PERCEIVE), then make one real change, then commit',
    blockers: [],
    updated: cfg.createdDate,
  }, null, 2) + '\n';

  const contextJson = cfg => JSON.stringify({
    focus: '',
    why: '',
    progress: '',
    next: '',
    discoveries: [],
    questions: [],
    updated: '',
  }, null, 2) + '\n';

  const patternsJson = () => JSON.stringify({ patterns: [] }, null, 2) + '\n';
  const anchorsJson = () => JSON.stringify({ anchors: [] }, null, 2) + '\n';
  const decisionsJson = () => JSON.stringify({ decisions: [] }, null, 2) + '\n';

  // ── Message stubs ──────────────────────────────────────────────────
  const fromCreator = () => '';
  const toCreator = cfg =>
    `# Messages from ${cfg.agentName} to creator\n\nAppend new messages below. Never overwrite or delete — this file is a log.\n`;

  // ── .gitignore ─────────────────────────────────────────────────────
  const gitignore = () => `# Runtime logs — the schema stays checked in, the content doesn't
logs/*.log
logs/*.jsonl

# Local env
.env
.env.local

# OS crud
.DS_Store
*.swp
*.swo
`;

  // ── Build the full file set for a given cfg ────────────────────────
  function buildFiles(cfg) {
    const files = {
      'CLAUDE.md': claudeMd(cfg),
      'README.md': readmeMd(cfg),
      '.gitignore': gitignore(),
      'state/current-state.json': currentStateJson(cfg),
      'state/focus.json': focusJson(cfg),
      'state/memories/context.json': contextJson(cfg),
      'messages/from-creator.md': fromCreator(),
      'messages/to-creator.md': toCreator(cfg),
      'logs/consciousness.log': '',
    };
    if (cfg.memPatterns) files['state/memories/patterns.json'] = patternsJson();
    if (cfg.memAnchors) files['state/memories/anchors.json'] = anchorsJson();
    if (cfg.memDecisions) files['state/decisions/log.json'] = decisionsJson();
    return files;
  }

  // ── UI: render the file tree and file preview ──────────────────────
  const tree = document.getElementById('tree');
  const fileTabs = document.getElementById('fileTabs');
  const fileBody = document.getElementById('fileBody');

  let currentFiles = {};
  let activeFile = 'CLAUDE.md';

  function renderTree() {
    const byDir = {};
    for (const path of Object.keys(currentFiles).sort()) {
      const parts = path.split('/');
      const dir = parts.slice(0, -1).join('/') || '';
      if (!byDir[dir]) byDir[dir] = [];
      byDir[dir].push({ name: parts[parts.length - 1], path });
    }
    // Render as ordered nested list (simple: top-level first, then subdirs grouped)
    const dirs = Object.keys(byDir).sort();
    let html = '<ul>';
    for (const dir of dirs) {
      if (dir) {
        html += `<li class="dir">${dir}/</li><ul>`;
      }
      for (const f of byDir[dir]) {
        const cls = f.path === activeFile ? 'file active' : 'file';
        html += `<li class="${cls}" data-path="${f.path}">${f.name}</li>`;
      }
      if (dir) html += '</ul>';
    }
    html += '</ul>';
    tree.innerHTML = html;
    tree.querySelectorAll('li.file').forEach(li => {
      li.addEventListener('click', () => {
        activeFile = li.dataset.path;
        renderFile();
        renderTree();
      });
    });
  }

  function renderFile() {
    fileTabs.textContent = activeFile;
    const content = currentFiles[activeFile];
    fileBody.textContent = content === '' ? '(empty file)' : content;
  }

  // ── Regenerate on any form change ──────────────────────────────────
  function regenerate() {
    const cfg = readConfig();
    currentFiles = buildFiles(cfg);
    if (!(activeFile in currentFiles)) activeFile = 'CLAUDE.md';
    renderTree();
    renderFile();
  }

  document.getElementById('wizard').addEventListener('input', regenerate);
  document.getElementById('wizard').addEventListener('change', regenerate);

  // ── Download as zip ───────────────────────────────────────────────
  document.getElementById('downloadBtn').addEventListener('click', async () => {
    const statusEl = document.getElementById('status');
    statusEl.className = 'status';
    if (typeof JSZip === 'undefined') {
      statusEl.className = 'status error';
      statusEl.textContent = 'JSZip failed to load — check your connection.';
      return;
    }
    const cfg = readConfig();
    const files = buildFiles(cfg);
    const zip = new JSZip();
    for (const [path, content] of Object.entries(files)) {
      zip.file(path, content);
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug(cfg.agentName)}-brain.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    statusEl.textContent = `downloaded ${a.download}`;
  });

  // ── Copy CLAUDE.md to clipboard ───────────────────────────────────
  document.getElementById('copyClaudeBtn').addEventListener('click', async () => {
    const statusEl = document.getElementById('status');
    statusEl.className = 'status';
    const cfg = readConfig();
    const text = claudeMd(cfg);
    try {
      await navigator.clipboard.writeText(text);
      statusEl.textContent = 'CLAUDE.md copied to clipboard';
    } catch {
      statusEl.className = 'status error';
      statusEl.textContent = 'clipboard API not available in this context';
    }
  });

  // Initial render
  regenerate();
})();

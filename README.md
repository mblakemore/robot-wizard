# Robot Brain Builder

A static, client-side wizard that generates a starter repo for a self-bootstrapping
Claude Code agent built on the **6-phase cognitive loop**:

> PERCEIVE → REFLECT → DECIDE → ACT → CONSOLIDATE → PERSIST

Drop the generated files into an empty repo, start a `claude` session, paste
`@README.md @CLAUDE.md Follow the instructions and begin the loop.` — the
brain wakes up and runs its first cycle.

## Try it

Open `index.html` directly in a browser, or host it on GitHub Pages (see
below). Everything runs in the browser — nothing is uploaded anywhere.

## What the wizard generates

A minimal agent repo with:

- `CLAUDE.md` — cognitive engine instructions (phase-by-phase)
- `README.md` — identity, purpose, file layout
- `state/current-state.json`, `state/focus.json` — per-cycle tracking
- `state/memories/context.json` — working memory (always on)
- Optional: `patterns.jsonl`, `anchors.jsonl`, `decisions/log.jsonl` (append-only, one JSON object per line)
- `messages/from-creator.md` + `messages/to-creator.md`
- `logs/consciousness.log`
- `.gitignore`

## Options

| Section | Choices |
|---|---|
| Cognitive loop | 6-phase (full), 4-phase (streamlined), minimal |
| Memory systems | Patterns, anchors, decision log (context always on) |
| Cycle-end detection | Git commit `^C\d+`, process exit, manual |
| Persona preset | Blank, Builder, Researcher, Operator, Johnny 5 |

## Hosting on GitHub Pages

1. Push this repo to GitHub.
2. **Settings → Pages → Source: Deploy from branch → `main` / `/` root.**
3. After a minute, the wizard is live at
   `https://<user>.github.io/robot-wizard/`.

The repo includes a `.nojekyll` file so GitHub Pages serves the files as-is
(no Jekyll processing).

## Lineage

The 6-phase loop in this wizard is the same loop that runs in
[Control Tower](https://github.com/mblakemore/control-tower)-managed agents —
it has been validated across many thousands of cycles. The template files
here are simplified stand-alone versions of Control Tower's
`config/templates/claude-code/` scaffold.

## License

MIT. See [LICENSE](./LICENSE).

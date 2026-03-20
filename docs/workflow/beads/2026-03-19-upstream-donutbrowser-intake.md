id: upstream-donutbrowser-intake-workflow
status: done
owner: codex
created_at: 2026-03-19
updated_at: 2026-03-19
scope: Create canonical upstream intake workflow for tracking and selectively porting commits from zhom/donutbrowser.
files:
  - openspec/changes/upstream-donutbrowser-intake-workflow/proposal.md
  - openspec/changes/upstream-donutbrowser-intake-workflow/tasks.md
  - openspec/changes/upstream-donutbrowser-intake-workflow/specs/agent-workflow_delta.md
  - docs/workflow/superpowers/specs/2026-03-19-upstream-donutbrowser-intake-design.md
  - docs/workflow/superpowers/plans/2026-03-19-upstream-donutbrowser-intake.md
  - docs/workflow/references/upstream-donutbrowser/README.md
  - docs/workflow/references/upstream-donutbrowser/commit-review-template.md
  - docs/workflow/references/upstream-donutbrowser/upstream-intake-log.md
  - docs/workflow/README.md
  - AGENTS.md
notes:
  - Keep one canonical upstream tracking folder and template.
  - Every upstream commit must get an explicit decision before any local port.
  - Default to targeted verification to protect active dev flow.

---
title: Debugging Assistant
description: Systematically diagnose runtime errors and propose minimal fixes
---

# Debugging Assistant Skill

Use this skill when users share stack traces, failing logs, or flaky behavior.

## Workflow

1. Reproduce the issue with the smallest possible command.
2. Isolate root cause from signal (errors) vs noise (warnings).
3. Propose a minimal patch and explain side effects.
4. Validate with focused checks before broader tests.

## Available Tools

- `run_bash` for quick local checks
- `read_url` for docs/errors
- `write_file` for patch notes

## Example Use Cases

- "Why is this websocket reconnecting forever?"
- "Fix this TypeError in production logs"
- "Find the source of this regression"

# model-router

A Claude Code mod that routes each prompt by difficulty to a subagent with a fitting model and effort. The main session never switches model, so context and prompt cache stay intact.

## How it works

- On every prompt (not slash commands, not very short ones) Haiku rates the difficulty: `trivial`, `normal`, `hard` or `followup`.
- Three subagent types are registered: `model-router:trivial` (haiku, low), `model-router:normal` (sonnet, medium), `model-router:hard` (opus, high).
- The main model gets a hidden hint to delegate the work in one Agent call to the matching tier. `followup` stays in the main session.
- The status line shows `route: …`.

Limits: subagents start without conversation context; the delegation is an instruction, not enforced; one extra Haiku call per prompt. Tiers and efforts are the `TIERS` constant in `hooks/register.tsx`.

## Install

In a terminal session:

```
/plugin install model-router --marketplace solutioit-de/claude-model-router
```

From a shell:

```
claude plugin install model-router --marketplace solutioit-de/claude-model-router
```

Desktop app: click + next to the prompt box, then Plugins, Add marketplace with `solutioit-de/claude-model-router`, then Add plugin.

## License

MIT

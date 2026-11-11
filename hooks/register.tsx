import type { Register } from 'claude-code'

// Tier -> subagent (model + effort). Main session model stays untouched (cache + context).
const TIERS = {
  trivial: { model: 'haiku', effort: 'low', what: 'tiny, mechanical, single-step: rename, lookup, short answer, simple edit, command run' },
  normal: { model: 'sonnet', effort: 'medium', what: 'ordinary coding/writing task, a few files, clear goal' },
  hard: { model: 'opus', effort: 'high', what: 'architecture, tricky debugging, multi-file refactor, security, deep analysis' },
} as const
type Tier = keyof typeof TIERS

const LABELS = ['trivial', 'normal', 'hard', 'followup'] as const

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    for (const [name, t] of Object.entries(TIERS))
      await $.agent.register({
        name,
        description: `Router tier "${name}" (${t.model}/${t.effort}): ${t.what}`,
        prompt: `You do the delegated task completely and report the result concisely. The parent session cannot see your work, only your final answer: include file paths changed and anything it must know.`,
        model: t.model,
        effort: t.effort,
      })
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    // never touch slash commands, meta prompts, or very short chatter
    if (e.command || e.isMeta || e.text.trim().length < 25) return next(e)
    let label: string | undefined
    try {
      label = await $.model.classify(
        `Classify the difficulty of this request to a coding assistant. trivial = ${TIERS.trivial.what}. normal = ${TIERS.normal.what}. hard = ${TIERS.hard.what}. followup = depends on the running conversation, a reaction or short continuation.\n\nREQUEST:\n${e.text}`,
        LABELS,
      )
    } catch {
      return next(e) // classifier failed: main session just handles it
    }
    if (!label || label === 'followup') {
      $.ui.status('route: main')
      return next(e)
    }
    const t = TIERS[label as Tier]
    $.ui.status(`route: ${label} → ${t.model}/${t.effort}`)
    return next({
      ...e,
      context: [
        ...(e.context ?? []),
        `[model-router] This request is rated "${label}". Delegate the actual work in one Agent call with subagent_type "model-router:${label}" (${t.model}, effort ${t.effort}); put all needed context into its prompt, then relay its result. Do not switch your own model. Skip delegation only if the task turns out to need this conversation's full context.`,
      ],
    })
  })
}

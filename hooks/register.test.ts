import { expect, test } from 'claude-code/testing'

const LONG = 'Refactor the auth module across all services and fix the race'
const run = async ($: any, on: any, label: string | 'throw', text = LONG) => {
  on('agent.register', () => ({ value: { name: 'x' } }))
  on('session.start', (_: any, e: any) => ({ cwd: e.cwd }))
  on('ui.status', () => ({ value: undefined }))
  on('model.classify', () => (label === 'throw' ? Promise.reject(new Error('x')) : { value: label }))
  on('prompt.submit', (_: any, e: any) => ({ text: e.text, context: e.context }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  return $.prompt.submit({ text })
}

test('hard prompt gets a delegation hint', async ($, on) => {
  const r = await run($, on, 'hard')
  expect(r.context?.join('\n')).toContain('model-router:hard')
})

test('followup, short text and classifier failure pass through', async ($, on) => {
  expect((await run($, on, 'followup')).context).toBeUndefined()
})
test('short text', async ($, on) => {
  expect((await run($, on, 'hard', 'ja mach')).context).toBeUndefined()
})
test('classifier failure', async ($, on) => {
  expect((await run($, on, 'throw')).context).toBeUndefined()
})

import { PassThrough } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { createPrompter } from '../../src/cli/prompt.js';

/** A prompter fed with pre-typed input; `output()` returns what it printed. */
function fakePrompter(typed: string) {
  const input = new PassThrough();
  const output = new PassThrough();
  let printed = '';
  output.on('data', (chunk: Buffer) => (printed += chunk.toString()));

  const prompter = createPrompter({ input, output });
  input.end(typed);

  return { prompter, output: () => printed };
}

describe('createPrompter', () => {
  it('returns answers in order and shows defaults', async () => {
    const { prompter, output } = fakePrompter('my-app\nA tool for agents\n');

    expect(await prompter.ask('Name', 'folder-name')).toBe('my-app');
    expect(await prompter.ask('Description')).toBe('A tool for agents');
    expect(output()).toBe('Name (folder-name): Description: ');
    prompter.close();
  });

  it('uses the default for an empty answer', async () => {
    const { prompter } = fakePrompter('   \n');

    expect(await prompter.ask('Name', 'folder-name')).toBe('folder-name');
    prompter.close();
  });

  it('asks again when an answer is required', async () => {
    const { prompter, output } = fakePrompter('\n  A tool  \n');

    expect(await prompter.ask('Description')).toBe('A tool');
    expect(output()).toBe('Description: Description: ');
    prompter.close();
  });

  it('fails when input ends before an answer', async () => {
    const { prompter } = fakePrompter('');

    await expect(prompter.ask('Name')).rejects.toThrow('Cancelled.');
    prompter.close();
  });
});

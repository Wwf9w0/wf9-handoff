import { createInterface } from 'node:readline';
import type { Readable, Writable } from 'node:stream';

export interface PromptStreams {
  input: Readable;
  output: Writable;
}

export interface Prompter {
  /** Asks until a non-empty answer is given; an empty answer picks the default. */
  ask(question: string, defaultValue?: string): Promise<string>;
  close(): void;
}

export function createPrompter({ input, output }: PromptStreams): Prompter {
  const rl = createInterface({ input, output });
  // Ctrl+C closes the prompt, which makes the pending question fail below.
  rl.on('SIGINT', () => {
    output.write('\n');
    rl.close();
  });
  // Unlike rl.question(), the iterator buffers lines that arrive early.
  const lines = rl[Symbol.asyncIterator]();

  return {
    async ask(question, defaultValue) {
      const hint = defaultValue === undefined ? '' : ` (${defaultValue})`;

      for (;;) {
        output.write(`${question}${hint}: `);
        const line = await lines.next();
        if (line.done === true) throw new Error('Cancelled.');

        const answer = line.value.trim();
        if (answer !== '') return answer;
        if (defaultValue !== undefined) return defaultValue;
      }
    },
    close() {
      rl.close();
    },
  };
}

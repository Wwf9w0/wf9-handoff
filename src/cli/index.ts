#!/usr/bin/env node
import { createProgram } from './program.js';

try {
  await createProgram().parseAsync(process.argv);
} catch (error) {
  // Commander reports its own usage errors; this catches failures inside commands.
  console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}

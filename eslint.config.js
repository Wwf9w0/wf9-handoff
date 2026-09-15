// @ts-check
import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['dist/', 'coverage/']),
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Config files like this one are plain JS and not part of tsconfig.
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  // Must stay last: turns off rules that conflict with Prettier.
  prettier,
);

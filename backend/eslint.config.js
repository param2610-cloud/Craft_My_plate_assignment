import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'data/**']
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname
      },
      globals: {
        ...globals.node
      }
    },
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off'
    }
  }
);

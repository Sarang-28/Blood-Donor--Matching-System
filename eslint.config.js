import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '**/node_modules', '.codex-*']),
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    rules: { 'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_', caughtErrors: 'none' }], 'react-hooks/set-state-in-effect': 'warn', 'react-refresh/only-export-components': 'warn' },
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  { files: ['backend/**/*.js'], extends: [js.configs.recommended], languageOptions: { sourceType: 'commonjs', globals: globals.node }, rules: { 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }] } },
  { files: ['api/**/*.js'], languageOptions: { sourceType: 'module', globals: globals.node } },
])

import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import base from './base.js';

/**
 * Physical direction utilities break RTL. Use logical ones instead:
 * ms-/me- (margin), ps-/pe- (padding), start-/end- (position), text-start/text-end.
 */
const PHYSICAL_TAILWIND =
  '(?:^|\\s)-?(?:ml|mr|pl|pr|left|right|border-l|border-r|rounded-l|rounded-r|rounded-tl|rounded-tr|rounded-bl|rounded-br)-|(?:^|\\s)text-(?:left|right)(?:\\s|$)';

export default tseslint.config(...base, {
  files: ['**/*.{ts,tsx}'],
  plugins: { 'react-hooks': reactHooks },
  languageOptions: { globals: { ...globals.browser } },
  rules: {
    ...reactHooks.configs.recommended.rules,
    'no-restricted-syntax': [
      'error',
      {
        selector: `JSXAttribute[name.name='className'] Literal[value=/${PHYSICAL_TAILWIND}/]`,
        message: 'Use logical Tailwind utilities (ms-/me-/ps-/pe-/start-/end-) so RTL works.',
      },
    ],
  },
});

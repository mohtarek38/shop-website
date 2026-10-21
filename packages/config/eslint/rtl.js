/**
 * Physical direction utilities break RTL. Use logical ones instead:
 * ms-/me- (margin), ps-/pe- (padding), start-/end- (position), text-start/text-end,
 * border-s/border-e, rounded-s/rounded-e.
 */
const PHYSICAL_TAILWIND =
  '(?:^|\\s)-?(?:ml|mr|pl|pr|left|right|border-l|border-r|rounded-l|rounded-r|rounded-tl|rounded-tr|rounded-bl|rounded-br)-|(?:^|\\s)text-(?:left|right)(?:\\s|$)';

/** Flat-config block that rejects physical-direction Tailwind classes in JSX. */
export default {
  files: ['**/*.{ts,tsx}'],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: `JSXAttribute[name.name='className'] Literal[value=/${PHYSICAL_TAILWIND}/]`,
        message: 'Use logical Tailwind utilities (ms-/me-/ps-/pe-/start-/end-) so RTL works.',
      },
      {
        selector: `JSXAttribute[name.name='className'] TemplateElement[value.raw=/${PHYSICAL_TAILWIND}/]`,
        message: 'Use logical Tailwind utilities (ms-/me-/ps-/pe-/start-/end-) so RTL works.',
      },
    ],
  },
};

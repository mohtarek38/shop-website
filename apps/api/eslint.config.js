import base from '@shop/config/eslint/base';

export default [
  ...base,
  { ignores: ['src/generated/**'] },
  {
    // Nest resolves constructor dependencies from emitted type metadata, so injected
    // classes must be imported as values, not with `import type`.
    files: ['src/**/*.ts'],
    rules: { '@typescript-eslint/consistent-type-imports': 'off' },
  },
];

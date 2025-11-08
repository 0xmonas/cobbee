import nextPlugin from 'eslint-config-next/core-web-vitals';

const config = [
  ...nextPlugin,
  {
    rules: {
      // Disable rules that conflict with TypeScript
      'react/no-unescaped-entities': 'off',
      // Prefer const over let
      'prefer-const': 'warn',
      // Warn about console logs (should be removed in production)
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],
    },
  },
];

export default config;

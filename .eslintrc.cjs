module.exports = {
  root: true,
  env: { node: true, es2022: true, jest: true },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:promise/recommended',
    'plugin:security/recommended-legacy',
    'plugin:prettier/recommended',
  ],
  plugins: ['import', 'promise', 'security', 'unused-imports'],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'import/no-unresolved': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
    ],
  },
  settings: {
    'import/resolver': {
      node: { extensions: ['.js', '.cjs', '.mjs'] },
    },
  },
  ignorePatterns: ['dist/', 'build/', 'coverage/', 'uploads/', 'logs/', '.husky/'],
};

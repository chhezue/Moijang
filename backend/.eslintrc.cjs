/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  ignorePatterns: ['dist/**', 'node_modules/**'],
  env: {
    node: true,
    jest: true,
  },
  extends: [require.resolve('../eslint.shared.cjs'), 'prettier'],
};

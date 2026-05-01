/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  ignorePatterns: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  extends: [require.resolve('../eslint.shared.cjs'), 'next/core-web-vitals', 'prettier'],
};

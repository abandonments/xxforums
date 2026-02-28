module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier', // Ensure prettier is last to override other configs
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'knexfile.js'], // Ignore compiled output and knexfile
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    tsconfigRootDir: __dirname, // Point to backend directory
    project: ['./tsconfig.json'], // Specify tsconfig.json for type-aware linting
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // Add any specific rules or overrides here
    // For example, if you want to allow console logs in development:
    // "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    // "@typescript-eslint/no-explicit-any": "off", // If you want to allow 'any'
  },
};

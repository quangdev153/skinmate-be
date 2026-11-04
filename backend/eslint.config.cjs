const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-config-prettier/flat');

module.exports = [
    {
        name: 'backend/ignores',
        ignores: ['**/node_modules/**', '**/coverage/**', '**/.cache/**'],
    },
    {
        ...js.configs.recommended,
        name: 'backend/commonjs',
        files: ['**/*.{js,cjs}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
            globals: globals.node,
        },
        rules: {
            ...js.configs.recommended.rules,
            // Express middleware keeps its signature even when an argument is unused.
            'no-unused-vars': [
                'error',
                { args: 'none', varsIgnorePattern: '^_' },
            ],
        },
    },
    prettier,
];

export default [{
    files: ['extension.js', 'prefs.js', 'bannerManager.js', 'tests/**/*.js'],
    languageOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        globals: {
            global: 'readonly',
        },
    },
    rules: {
        eqeqeq: 'error',
        'no-constant-condition': 'error',
        'no-dupe-args': 'error',
        'no-dupe-keys': 'error',
        'no-duplicate-case': 'error',
        'no-redeclare': 'error',
        'no-unreachable': 'error',
        'no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
        'prefer-const': 'error',
        semi: ['error', 'always'],
    },
}];

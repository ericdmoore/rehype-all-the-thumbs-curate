module.exports = {
    'extends': 'eslint:recommended',
    'parserOptions': { 'ecmaVersion': 12},
    'env': {
        'browser': true,
        'commonjs': true,
        'es2021': true,
        'node': true
    },
    'rules': {
        'arrow-spacing':['error', { 'before': true, 'after': true }],
        'indent': [ 'error', 4],
        'linebreak-style': ['error','unix'],
        'quotes': ['error', 'single'],
        'semi': [ 'error','never']
    }
}

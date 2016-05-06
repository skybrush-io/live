module.exports = {
  'parser': 'babel-eslint',

  'parserOptions': {
    'ecmaFeatures': {
      'jsx': true
    }
  },

  'extends': ['standard', 'plugin:react/recommended'],

  'plugins': [
    'standard',
    'react'
  ],

  'rules': {
    'jsx-quotes': ['error', 'prefer-double'],
    'react/jsx-no-bind': 'error'
  }
};

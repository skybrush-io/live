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
    'valid-jsdoc': ['error', {
      'preferType': {
        'String': 'string',
        'number': 'Number',
        'object': 'Object'
      },
      'requireReturn': false
    }],
    'react/jsx-no-bind': 'error'
  }
};

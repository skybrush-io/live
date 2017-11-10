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
    'generator-star-spacing': ["error", {"before": false, "after": true}],
    'valid-jsdoc': ['error', {
      'preferType': {
        'String': 'string',
        'Number': 'number',
        'Boolean': 'boolean',
        'bool': 'boolean',
        'Bool': 'boolean',
        'object': 'Object'
      },
      'requireReturn': false
    }],
    'react/jsx-no-bind': 'error'
  }
};

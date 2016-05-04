const OFF = 0;
const WARNING = 1;
const ERROR = 2;

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
    'jsx-quotes': [ERROR, 'prefer-double']
  }
};

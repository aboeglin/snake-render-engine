module.exports = {
  env: {
    browser: true,
    es2020: true,
    node: true,
    "jest/globals": true,
  },
  extends: ["eslint:recommended", "plugin:react/recommended"],
  plugins: ["eslint-plugin-jest"],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  rules: {
    // Needed for now as there's no PropTypes mechanism in place at the moment
    "react/prop-types": 0,
    // Mostly not needed as it is in tests and we know what we're doing
    "react/jsx-key": 0,
  },
};

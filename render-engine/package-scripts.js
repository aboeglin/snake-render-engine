module.exports = {
  scripts: {
    test: {
      default: "jest",
      watch: "jest -u --coverage --watchAll",
      coverage: "jest --coverage"
    },
    format: "prettier --write src/**/* && prettier --write src/*"
  }
};

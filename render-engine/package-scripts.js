module.exports = {
  scripts: {
    test: {
      default: "jest",
      watch: "jest --watch"
    },
    format: "prettier --write src/**/* && prettier --write src/*"
  }
};

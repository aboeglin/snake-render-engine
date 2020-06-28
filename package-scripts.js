module.exports = {
  scripts: {
    test: {
      default: "jest",
      watch: "jest --coverage --watchAll",
      coverage: "jest --coverage",
    },
    format: "prettier --write src/**/* && prettier --write src/*",
    bundle: "microbundle build --raw -f iife",
    demo: {
      default: {
        script: "parcel demo/index.html",
        description: "runs demo",
      },
      watch: {
        script: "parcel watch demo/index.html",
        description: "runs demo",
      },
    },
  },
};

module.exports = {
  scripts: {
    test: {
      default: "jest",
      watch: "jest --coverage --watchAll",
      coverage: "jest --coverage",
    },
    format: "prettier --write src/**/* && prettier --write src/*",
    bundle: "microbundle build --raw",
    demo: {
      default: {
        script: "parcel --out-dir demo/dist demo/index.html",
        description: "runs demo",
      },
      build: {
        script: "parcel build --out-dir demo/dist demo/index.html",
        description: "runs demo",
      },
      publish: {
        script: "gh-pages -d demo/dist",
        description: "publish demo",
      },
    },
    clean: {
      description: "delete build assets",
      script: "rm -r dist/; rm -r demo/dist/; rm -r coverage/; rm -r .cache;"
    }
  },
};

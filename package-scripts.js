module.exports = {
  scripts: {
    test: {
      default: "jest",
      watch: "jest --coverage --watchAll",
      coverage: "jest --coverage",
    },
    format: {
      default: {
        script: "prettier --write '*.js' && prettier --write 'src/**/*.js'",
        description: "formats source files",
      },
      check: {
        script: "prettier --check '*.js' && prettier --check 'src/**/*.js'",
        description: "verifies formating of source files",
      },
    },
    lint: {
      dry: "eslint --fix-dry-run src/**.js",
      fix: "eslint --fix-dry-run src/**.js",
    },
    dependencies: {
      script: "madge --image dependencies.svg src/index.js",
      circular: "madge -c src/index.js",
    },
    bundle: "microbundle build --raw",
    demo: {
      default: {
        script: "parcel --out-dir demo/dist demo/index.html",
        description: "runs demo",
      },
      ci: {
        build: {
          script:
            "parcel build --public-url 'https://aboeglin.github.io/snake-render-engine/' --out-dir demo/dist demo/index.html",
          description: "runs demo",
        },
        publish: {
          script: "gh-pages -d demo/dist",
          description: "publish demo",
        },
      },
    },
    clean: {
      description: "delete build assets",
      script: "rm -r dist/; rm -r demo/dist/; rm -r coverage/; rm -r .cache;",
    },
  },
};

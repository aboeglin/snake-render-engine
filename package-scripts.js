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
        description: "Formats source files.",
      },
      check: {
        script: "prettier --check '*.js' && prettier --check 'src/**/*.js'",
        description: "Verifies formating of source files.",
      },
    },
    lint: {
      dry: "eslint --fix-dry-run src/**.js",
      fix: "eslint --fix-dry-run src/**.js",
    },
    dependencies: {
      default: {
        script: "madge --image dependencies.svg src/index.js",
        description: "Generates a svg of dependencies.",
      },
      circular: {
        script: "madge -c src/index.js",
        description:
          "Verifies that no circular dependency is present in the project.",
      },
    },
    bundle: "microbundle build --raw",
    demo: {
      default: {
        script: "parcel --out-dir demo/dist demo/index.html",
        description: "Runs the demo.",
      },
      ci: {
        build: {
          script:
            "parcel build --public-url 'https://aboeglin.github.io/snake-render-engine/' --out-dir demo/dist demo/index.html",
          description: "Builds the demo.",
        },
        publish: {
          script: "gh-pages -d demo/dist",
          description: "Publishes the demo.",
        },
      },
    },
    clean: {
      description: "Deletes build assets.",
      script: "rm -r dist/; rm -r demo/dist/; rm -r coverage/; rm -r .cache;",
    },
  },
};

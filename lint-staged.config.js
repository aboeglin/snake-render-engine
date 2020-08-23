module.exports = {
  "*.{js,css,md}": "prettier --write",
  "*.js": ["eslint --fix-dry-run", "prettier --check"],
  "*.spec.js": [`jest --bail --findRelatedTests --passWithNoTests`],
};

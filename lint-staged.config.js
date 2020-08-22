module.exports = {
  "*.{js,css,md}": "prettier --write",
  "*.spec.js": [`jest --bail --findRelatedTests --passWithNoTests`]
};

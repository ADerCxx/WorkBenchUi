module.exports = {
  plugins: ["prettier-plugin-organize-imports"],
  printWidth: 80,
  proseWrap: "never",
  singleQuote: true,
  trailingComma: "all",
  overrides: [
    {
      files: "*.md",
      options: {
        proseWrap: "preserve",
      },
    },
  ],
};

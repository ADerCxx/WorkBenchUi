/**
 * lint-staged：提交前只对本次 staged 的文件跑检查，快且精准。
 * 与 .husky/pre-commit 配合（pre-commit 触发 lint-staged）。
 *
 * 说明：.less 文件未纳入 —— Prettier 不识别 less 语法，
 * 需要 stylelint 才能格式化（后续可选补充）。
 */
export default {
  '*.{ts,tsx,js,jsx,mjs,cjs}': ['eslint --fix', 'prettier --write'],
  '*.{json,css}': ['prettier --write'],
};

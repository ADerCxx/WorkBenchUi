/**
 * commitlint：约束提交信息格式（feat: / fix: / refactor: ...）。
 * 与 .husky/commit-msg 配合（commit-msg 触发 commitlint）。
 */
export default {
  extends: ['@commitlint/config-conventional'],
};

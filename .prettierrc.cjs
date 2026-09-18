module.exports = {
  plugins: ['prettier-plugin-organize-imports'],
  printWidth: 80,
  proseWrap: 'never',
  singleQuote: true,
  trailingComma: 'all',
  // Windows 上 core.autocrlf=true 会把工作区文件转成 CRLF；
  // 若写死 'lf'，本地/CI 行尾不一致会导致 format:check 大面积误报。
  // 'auto' = 维持文件既有行尾（本地 CRLF、CI 上 LF 都能通过）。
  endOfLine: 'auto',
};

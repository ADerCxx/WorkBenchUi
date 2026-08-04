export type WhitelistPatternInput = {
  folderName: string;
  filePattern: string;
  ruleName?: string;
};

export type CompiledWhitelistRule = {
  folderName: string;
  folderNameLower: string;
  file: RegExp;
  ruleName?: string;
};

/**
 * 编译启用规则：目录名为字面量；文件正则为 RegExp。
 * 空目录名或非法文件正则 → skipped。
 */
export function compileWhitelistRules(inputs: WhitelistPatternInput[]): {
  rules: CompiledWhitelistRule[];
  skipped: WhitelistPatternInput[];
} {
  const rules: CompiledWhitelistRule[] = [];
  const skipped: WhitelistPatternInput[] = [];

  for (const input of inputs) {
    const folderName = input.folderName?.trim() ?? '';
    if (!folderName) {
      skipped.push(input);
      continue;
    }
    try {
      const file = new RegExp(input.filePattern);
      rules.push({
        folderName,
        folderNameLower: folderName.toLowerCase(),
        file,
        ruleName: input.ruleName,
      });
    } catch {
      skipped.push(input);
    }
  }

  return { rules, skipped };
}

/** 项目根第一层目录名对应的规则（忽略大小写） */
export function rulesForRootDir(
  dirName: string,
  rules: CompiledWhitelistRule[],
): CompiledWhitelistRule[] {
  const lower = dirName.toLowerCase();
  return rules.filter((r) => r.folderNameLower === lower);
}

/** 文件名是否命中任一规则的 filePattern */
export function matchesFileName(
  fileName: string,
  rules: CompiledWhitelistRule[],
): boolean {
  return rules.some((r) => r.file.test(fileName));
}

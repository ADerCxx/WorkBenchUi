/** 启用状态：与后端 enable_status 一致 */
export const RegexRuleEnableStatus = {
  Disable: 0,
  Enable: 1,
} as const;

export type RegexRuleEnableStatusCode =
  (typeof RegexRuleEnableStatus)[keyof typeof RegexRuleEnableStatus];

/** 正则白名单规则（对齐 RegexRuleVo） */
export interface RegexRule {
  id: string;
  ruleName: string;
  /** 项目根下第一层目录名（字面量，非正则） */
  folderName: string;
  /** 文件名格式正则 */
  filePattern: string;
  description?: string;
  enableStatus: RegexRuleEnableStatusCode;
  createBy?: string;
  createTime?: string;
  updateBy?: string;
  updateTime?: string;
}

/** 列表筛选（页面 Form / useAntdTable formData） */
export interface RegexRulesQueryForm {
  ruleNameSearchParam?: string;
  enableStatus?: RegexRuleEnableStatusCode;
}

/** 新增入参 */
export interface RegexRulesInsertParams {
  ruleName: string;
  folderName: string;
  filePattern: string;
  description?: string;
  enableStatus?: RegexRuleEnableStatusCode;
}

/** 修改 / 启停入参（启停可只传 id + enableStatus） */
export interface RegexRulesUpdateParams {
  id: string;
  ruleName?: string;
  folderName?: string;
  filePattern?: string;
  description?: string | null;
  enableStatus?: RegexRuleEnableStatusCode;
}

/** 批量删除入参 */
export interface RegexRulesDeleteParams {
  ids: string[];
}

/** MyBatis-Plus IPage 分页形态 */
export interface RegexRuleIPage {
  records: RegexRule[];
  total: number;
  size: number;
  current: number;
  pages?: number;
}

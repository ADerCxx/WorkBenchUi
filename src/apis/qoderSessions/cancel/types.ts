/** 后端 cancel 统一响应（与 regexRules 的 code 形态不同） */
export type MetaResponseStructure<T> = {
  meta: {
    success: boolean;
    statusCode: number;
    message?: string;
  };
  data: T;
};

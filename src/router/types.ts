/**
 * 路由 handle 元数据约定。
 *
 * 通过 `<Route handle={...} />` 声明，由 `MetaSync` 消费。
 * 新增元字段时必须在此登记，禁止在 handle 上挂未声明的字段。
 */
export interface RouteMeta {
  /** 页面标题（中文，不带站点后缀），MetaSync 会拼成「标题 · 站点名」 */
  title: string;
  /**
   * 是否需要登录态才能进入。
   * 当前项目无登录态，恒为 false；接入鉴权后由守卫读取，详见 SKILL.md「权限守卫」。
   */
  requiresAuth?: boolean;
}

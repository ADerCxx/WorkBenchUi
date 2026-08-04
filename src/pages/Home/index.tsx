import { Link } from 'react-router-dom';
import styles from './index.less';

/**
 * 首页：产品落地页（Hero + 空媒体占位）
 */
function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.meta}>产品 · 工作台</p>
        <h1 className={styles.title}>欢迎使用 fabric</h1>
        <p className={styles.subtitle}>本地扫描 · 白名单匹配 · 原文预览</p>
        <Link to="/workbench" className={styles.cta}>
          进入工作台
          <span className={styles.ctaArrow} aria-hidden>
            ↗
          </span>
        </Link>
      </section>
      <div className={styles.media} aria-hidden />
    </div>
  );
}

export default Home;

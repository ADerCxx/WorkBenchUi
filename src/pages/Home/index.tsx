import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './index.less';

const DEMO_SRC = `${import.meta.env.BASE_URL}demo/ysVideo.mp4`;

/**
 * 首页：产品落地页（Hero + 本地演示视频）
 */
function Home() {
  const [failed, setFailed] = useState(false);
  const [autoPlay, setAutoPlay] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setAutoPlay(!mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

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
      <div
        className={
          failed ? `${styles.media} ${styles.mediaEmpty}` : styles.media
        }
        aria-hidden={failed ? true : undefined}
      >
        {!failed ? (
          <video
            className={styles.video}
            src={DEMO_SRC}
            muted
            autoPlay={autoPlay}
            loop
            playsInline
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            tabIndex={-1}
            aria-hidden
            onError={() => setFailed(true)}
          />
        ) : null}
      </div>
    </div>
  );
}

export default Home;

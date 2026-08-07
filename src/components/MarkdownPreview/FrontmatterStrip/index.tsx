import { useState } from 'react';
import styles from './index.less';
import type { FeaturedKey, FrontmatterStripProps } from './types';
import { FEATURED_KEYS } from './types';

export type { FrontmatterStripProps } from './types';
export { FEATURED_KEYS } from './types';

function formatScalar(value: unknown): string {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return JSON.stringify(value);
}

function formatFeaturedValue(key: FeaturedKey, value: unknown): string {
  if (key === 'globs' && Array.isArray(value)) {
    return value.map((item) => String(item)).join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return formatScalar(value);
}

function formatExtraValue(value: unknown): { text: string; mono: boolean } {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null ||
    value === undefined
  ) {
    return { text: formatScalar(value), mono: typeof value === 'boolean' };
  }
  return { text: JSON.stringify(value), mono: true };
}

function FrontmatterStrip({ matter }: FrontmatterStripProps) {
  const featuredEntries = FEATURED_KEYS.filter((key) =>
    Object.prototype.hasOwnProperty.call(matter, key),
  ).map((key) => [key, matter[key]] as const);

  const featuredKeySet = new Set<string>(FEATURED_KEYS);
  const extraEntries = Object.entries(matter).filter(
    ([key]) => !featuredKeySet.has(key),
  );

  const onlyExtras = featuredEntries.length === 0 && extraEntries.length > 0;
  const [moreOpen, setMoreOpen] = useState(onlyExtras);

  if (featuredEntries.length === 0 && extraEntries.length === 0) {
    return null;
  }

  return (
    <aside className={styles.root} aria-label="元数据">
      <div className={styles.title}>元数据</div>
      {featuredEntries.map(([key, value]) => (
        <div key={key} className={styles.row}>
          <div className={styles.key}>{key}</div>
          <div className={styles.value}>
            {formatFeaturedValue(key, value)}
          </div>
        </div>
      ))}
      {extraEntries.length > 0 ? (
        <>
          <button
            type="button"
            className={styles.moreToggle}
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
          >
            {moreOpen ? '收起更多' : `更多（${extraEntries.length}）`}
          </button>
          {moreOpen ? (
            <div className={styles.morePanel}>
              {extraEntries.map(([key, value]) => {
                const formatted = formatExtraValue(value);
                return (
                  <div key={key} className={styles.row}>
                    <div className={styles.key}>{key}</div>
                    <div
                      className={
                        formatted.mono ? styles.valueMono : styles.value
                      }
                    >
                      {formatted.text}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </>
      ) : null}
    </aside>
  );
}

export default FrontmatterStrip;

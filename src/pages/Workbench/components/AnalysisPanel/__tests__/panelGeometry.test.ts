import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PANEL_HEIGHT,
  DEFAULT_PANEL_WIDTH,
  MIN_COMFORT_HEIGHT,
  MIN_COMFORT_WIDTH,
  getDefaultPanelBounds,
  isPanelTooSmall,
} from '../panelGeometry';

describe('panelGeometry 常量', () => {
  it('默认尺寸应为 1180×760', () => {
    expect(DEFAULT_PANEL_WIDTH).toBe(1180);
    expect(DEFAULT_PANEL_HEIGHT).toBe(760);
  });
});

describe('getDefaultPanelBounds', () => {
  it('大视口内应居中并垂直约 1/3 处', () => {
    const bounds = getDefaultPanelBounds(1600, 1000);
    expect(bounds.width).toBe(1180);
    expect(bounds.height).toBe(760);
    expect(bounds.x).toBe(Math.round((1600 - 1180) / 2));
    expect(bounds.y).toBe(Math.round((1000 - 760) / 3));
  });

  it('小视口应夹紧为 viewport - 32', () => {
    const bounds = getDefaultPanelBounds(900, 600);
    expect(bounds.width).toBe(900 - 32);
    expect(bounds.height).toBe(600 - 32);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
  });
});

describe('isPanelTooSmall', () => {
  it('低于 MIN_COMFORT 宽高时应为 true', () => {
    expect(isPanelTooSmall(MIN_COMFORT_WIDTH - 1, MIN_COMFORT_HEIGHT)).toBe(
      true,
    );
    expect(isPanelTooSmall(MIN_COMFORT_WIDTH, MIN_COMFORT_HEIGHT - 1)).toBe(
      true,
    );
  });

  it('达到 MIN_COMFORT 宽高时应为 false', () => {
    expect(isPanelTooSmall(MIN_COMFORT_WIDTH, MIN_COMFORT_HEIGHT)).toBe(false);
  });
});

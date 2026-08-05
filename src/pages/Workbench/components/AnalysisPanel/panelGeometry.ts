export const DEFAULT_PANEL_WIDTH = 720;
export const DEFAULT_PANEL_HEIGHT = 480;
export const MIN_COMFORT_WIDTH = 480;
export const MIN_COMFORT_HEIGHT = 320;

export type PanelBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function isPanelTooSmall(width: number, height: number): boolean {
  return width < MIN_COMFORT_WIDTH || height < MIN_COMFORT_HEIGHT;
}

/** 默认几何：水平居中，垂直约 1/3 处；不超过视口 */
export function getDefaultPanelBounds(
  viewportWidth: number,
  viewportHeight: number,
): PanelBounds {
  const width = Math.min(
    DEFAULT_PANEL_WIDTH,
    Math.max(280, viewportWidth - 32),
  );
  const height = Math.min(
    DEFAULT_PANEL_HEIGHT,
    Math.max(200, viewportHeight - 32),
  );
  const x = Math.max(0, Math.round((viewportWidth - width) / 2));
  const y = Math.max(0, Math.round((viewportHeight - height) / 3));
  return { x, y, width, height };
}

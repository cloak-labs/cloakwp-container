/**
 * Values for `theme.json` `settings.layout` so Gutenberg content/wide sizes
 * track `@cloakui/container` CSS variables.
 *
 * `wideSize` assumes you registered a size named `wide` on your
 * `defineContainer` config. If you use a different name, call
 * `createContainerThemeJsonLayout({ wideSizeName: "…" })` instead, or omit
 * `wideSize` entirely.
 */
export const containerThemeJsonLayout = {
  allowCustomContentAndWideSize: false,
  contentSize: "var(--cntr-width)",
  wideSize: "var(--cntr-width-wide)",
} as const;

export type ContainerThemeJsonLayoutOptions = {
  /**
   * Size name from `defineContainer({ sizes })` used for Gutenberg "wide".
   * @default "wide"
   */
  wideSizeName?: string;
  /** When false, only `contentSize` is returned (no wide layout). @default true */
  includeWide?: boolean;
};

/**
 * Build a `theme.json` `settings.layout` object pointed at your container vars.
 */
export const createContainerThemeJsonLayout = (
  options: ContainerThemeJsonLayoutOptions = {},
) => {
  const wideSizeName = options.wideSizeName ?? "wide";
  const includeWide = options.includeWide ?? true;
  const wideVar =
    wideSizeName === "default"
      ? "var(--cntr-width)"
      : `var(--cntr-width-${wideSizeName})`;

  if (!includeWide) {
    return {
      allowCustomContentAndWideSize: false,
      contentSize: "var(--cntr-width)",
    } as const;
  }

  return {
    allowCustomContentAndWideSize: false,
    contentSize: "var(--cntr-width)",
    wideSize: wideVar,
  } as const;
};

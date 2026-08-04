import plugin from "tailwindcss/plugin";

export type WpAlignContainerRulesOptions = {
  /**
   * Class used for Gutenberg `alignwide` (must match a size from
   * `defineContainer`, e.g. `cntr-wide` or `cntr-prose`).
   * @default "cntr-wide"
   */
  wideClassName?: string;
};

/**
 * Build Gutenberg align → measure-class rules for the editor canvas.
 */
export const createWpAlignContainerRules = (
  options: WpAlignContainerRulesOptions = {},
): Record<string, string> => {
  const wide = options.wideClassName ?? "cntr-wide";
  return {
    ".block-editor-block-list__layout.is-root-container > .alignwide": wide,
    ".is-layout-constrained > .alignwide": wide,
    ".alignfull > .alignwide": wide,
    ".block-editor-block-list__layout.is-root-container > .alignfull":
      "cntr-full",
    ".alignfull": "!ml-0 !mr-0",
    ".block-editor-block-list__layout.is-root-container > :where(:not(.alignleft):not(.alignright):not(.alignfull):not(.alignwide):not(.cntr-start):not(.cntr-end))":
      "cntr",
    ".is-layout-flow > .alignleft": "cntr-start float-none",
    ".is-layout-constrained > .alignleft": "cntr-start float-none",
    ".is-layout-flow > .alignright": "cntr-end float-none",
    ".is-layout-constrained > .alignright": "cntr-end float-none",
  };
};

/** Default align → class map (`alignwide` → `cntr-wide`). */
export const wpAlignContainerRules = createWpAlignContainerRules();

type ApplyClasses = (
  rules: Record<string, string>,
) => Record<string, Record<string, string>>;

/**
 * Tailwind plugin for the WP block editor canvas.
 *
 * When the editor sidebar opens, sets `--sidebar-w` and recomputes `--cntr-vw`
 * so gutters match the narrowed canvas. Pass `applyClasses` from your kit (or
 * equivalent) to expand utility class strings into CSS-in-JS declarations.
 */
export const createWpEditorContainerPlugin = (options: {
  applyClasses: ApplyClasses;
  sidebarWidth?: string;
  wideClassName?: string;
}) => {
  const {
    applyClasses,
    sidebarWidth = "280px",
    wideClassName = "cntr-wide",
  } = options;

  return plugin(({ addUtilities }) => {
    addUtilities([
      {
        ".is-sidebar-opened": {
          "--sidebar-w": sidebarWidth,
          "--cntr-vw":
            "calc(100vw - var(--sidebar-w) - var(--scrollbar-w))",
        },
      },
      applyClasses(createWpAlignContainerRules({ wideClassName })),
    ]);
  });
};

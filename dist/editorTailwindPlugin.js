import plugin from "tailwindcss/plugin";
/**
 * Maps Gutenberg align classes on the editor canvas to `@cloakui/container`
 * classes, and adjusts `--sidebar-w` when the editor sidebar is open.
 *
 * Pair with `important: ".editor-styles-wrapper"` in the WP Tailwind config.
 */
export const wpAlignContainerRules = {
    ".block-editor-block-list__layout.is-root-container > .alignwide": "cntr-wide",
    ".is-layout-constrained > .alignwide": "cntr-wide",
    ".alignfull > .alignwide": "cntr-wide",
    ".block-editor-block-list__layout.is-root-container > .alignfull": "cntr-full",
    ".alignfull": "!ml-0 !mr-0",
    ".block-editor-block-list__layout.is-root-container > :where(:not(.alignleft):not(.alignright):not(.alignfull):not(.alignwide):not(.cntr-start):not(.cntr-end))": "cntr",
    ".is-layout-flow > .alignleft": "cntr-start float-none",
    ".is-layout-constrained > .alignleft": "cntr-start float-none",
    ".is-layout-flow > .alignright": "cntr-end float-none",
    ".is-layout-constrained > .alignright": "cntr-end float-none",
};
/**
 * Tailwind plugin for the WP block editor canvas.
 * Pass `applyClasses` from the agency kit (or equivalent) to expand class
 * strings into CSS-in-JS declarations.
 */
export const createWpEditorContainerPlugin = (options) => {
    const { applyClasses, sidebarWidth = "280px" } = options;
    return plugin(({ addUtilities }) => {
        addUtilities([
            {
                ".is-sidebar-opened": {
                    "--sidebar-w": sidebarWidth,
                    "--cntr-vw": "calc(100vw - var(--sidebar-w) - var(--scrollbar-w))",
                    "--100vw": "var(--cntr-vw)",
                },
            },
            applyClasses({ ...wpAlignContainerRules }),
        ]);
    });
};

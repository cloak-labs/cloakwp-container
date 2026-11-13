import { alignClassName } from "@cloakui/container";
import plugin from "tailwindcss/plugin";
import { defaultAlignFlushSize } from "./align";
/**
 * Build Gutenberg align → measure-class rules for the editor canvas.
 */
export const createWpAlignContainerRules = (options = {}) => {
    const wide = options.wideClassName ?? "cntr-wide";
    const flush = options.alignFlushSize ?? defaultAlignFlushSize;
    const startAlign = `cntr ${alignClassName("start", flush)}`;
    const endAlign = `cntr ${alignClassName("end", flush)}`;
    return {
        ".block-editor-block-list__layout.is-root-container > .alignwide": wide,
        ".is-layout-constrained > .alignwide": wide,
        ".alignfull > .alignwide": wide,
        ".block-editor-block-list__layout.is-root-container > .alignfull": "cntr-full",
        ".alignfull": "!ml-0 !mr-0",
        // Default measure for root blocks that aren't wide/full/start/end aligned.
        // Exclude legacy cntr-start/end and compositional align-* modifiers.
        ".block-editor-block-list__layout.is-root-container > :where(:not(.alignleft):not(.alignright):not(.alignfull):not(.alignwide):not(.cntr-start):not(.cntr-end):not([class*='align-start']):not([class*='align-end']))": "cntr",
        ".is-layout-flow > .alignleft": `${startAlign} float-none`,
        ".is-layout-constrained > .alignleft": `${startAlign} float-none`,
        ".is-layout-flow > .alignright": `${endAlign} float-none`,
        ".is-layout-constrained > .alignright": `${endAlign} float-none`,
        // Nested blocks already sit inside a measure. Drop the page-edge gutter
        // and the inner measure pad so alignleft lines up with alignwide siblings.
        // Root blocks stay direct children of `.is-root-container` and keep both.
        // Mirrors `.cntr* .align-start-* { margin-inline-start: 0 }` and
        // `.cntr* .cntr* { padding-inline: 0 }`, which never match here because
        // the editor has `alignwide` / `alignleft` rather than those classes.
        ".block-editor-block-list__layout:not(.is-root-container) > .alignleft": "ms-0",
        ".block-editor-block-list__layout:not(.is-root-container) > .alignright": "me-0",
        ".block-editor-block-list__layout:not(.is-root-container) > .alignwide": "[padding-inline:0]",
        ".block-editor-block-list__layout:not(.is-root-container) > .alignfull": "[padding-inline:0]",
    };
};
/** Default align → class map (`alignwide` → `cntr-wide`, left → flush to wide). */
export const wpAlignContainerRules = createWpAlignContainerRules();
/**
 * Tailwind plugin for the WP block editor canvas.
 *
 * When the editor sidebar opens, sets `--sidebar-w` and recomputes `--cntr-vw`
 * so gutters match the narrowed canvas. `applyClasses` expands utility class
 * strings from `createWpAlignContainerRules` into CSS-in-JS for
 * `addUtilities` (e.g. map `"cntr-wide"` → `{ "@apply cntr-wide": {} }`).
 */
export const createWpEditorContainerPlugin = (options) => {
    const { applyClasses, sidebarWidth = "280px", wideClassName = "cntr-wide", alignFlushSize = defaultAlignFlushSize, } = options;
    return plugin(({ addUtilities }) => {
        addUtilities([
            {
                ".is-sidebar-opened": {
                    "--sidebar-w": sidebarWidth,
                    "--cntr-vw": "calc(100vw - var(--sidebar-w) - var(--scrollbar-w))",
                },
            },
            applyClasses(createWpAlignContainerRules({ wideClassName, alignFlushSize })),
        ]);
    });
};

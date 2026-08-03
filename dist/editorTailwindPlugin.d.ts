/**
 * Maps Gutenberg align classes on the editor canvas to `@cloakui/container`
 * classes, and adjusts `--sidebar-w` when the editor sidebar is open.
 *
 * Pair with `important: ".editor-styles-wrapper"` in the WP Tailwind config.
 */
export declare const wpAlignContainerRules: {
    readonly ".block-editor-block-list__layout.is-root-container > .alignwide": "cntr-wide";
    readonly ".is-layout-constrained > .alignwide": "cntr-wide";
    readonly ".alignfull > .alignwide": "cntr-wide";
    readonly ".block-editor-block-list__layout.is-root-container > .alignfull": "cntr-full";
    readonly ".alignfull": "!ml-0 !mr-0";
    readonly ".block-editor-block-list__layout.is-root-container > :where(:not(.alignleft):not(.alignright):not(.alignfull):not(.alignwide):not(.cntr-start):not(.cntr-end))": "cntr";
    readonly ".is-layout-flow > .alignleft": "cntr-start float-none";
    readonly ".is-layout-constrained > .alignleft": "cntr-start float-none";
    readonly ".is-layout-flow > .alignright": "cntr-end float-none";
    readonly ".is-layout-constrained > .alignright": "cntr-end float-none";
};
type ApplyClasses = (rules: Record<string, string>) => Record<string, Record<string, string>>;
/**
 * Tailwind plugin for the WP block editor canvas.
 * Pass `applyClasses` from the agency kit (or equivalent) to expand class
 * strings into CSS-in-JS declarations.
 */
export declare const createWpEditorContainerPlugin: (options: {
    applyClasses: ApplyClasses;
    sidebarWidth?: string;
}) => {
    handler: import("tailwindcss/types/config").PluginCreator;
    config?: Partial<import("tailwindcss/types/config").Config>;
};
export {};
//# sourceMappingURL=editorTailwindPlugin.d.ts.map
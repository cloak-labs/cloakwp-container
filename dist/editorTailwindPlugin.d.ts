export type WpAlignContainerRulesOptions = {
    /**
     * Class used for Gutenberg `alignwide` (must match a size from
     * `defineContainer`, e.g. `cntr-wide` or `cntr-prose`).
     * @default "cntr-wide"
     */
    wideClassName?: string;
    /**
     * Size whose gutter `alignleft` / `alignright` flush to.
     * @default "wide"
     */
    alignFlushSize?: string;
};
/**
 * Build Gutenberg align → measure-class rules for the editor canvas.
 */
export declare const createWpAlignContainerRules: (options?: WpAlignContainerRulesOptions) => Record<string, string>;
/** Default align → class map (`alignwide` → `cntr-wide`, left → flush to wide). */
export declare const wpAlignContainerRules: Record<string, string>;
type ApplyClasses = (rules: Record<string, string>) => Record<string, Record<string, string>>;
/**
 * Tailwind plugin for the WP block editor canvas.
 *
 * When the editor sidebar opens, sets `--sidebar-w` and recomputes `--cntr-vw`
 * so gutters match the narrowed canvas. `applyClasses` expands utility class
 * strings from `createWpAlignContainerRules` into CSS-in-JS for
 * `addUtilities` (e.g. map `"cntr-wide"` → `{ "@apply cntr-wide": {} }`).
 */
export declare const createWpEditorContainerPlugin: (options: {
    applyClasses: ApplyClasses;
    sidebarWidth?: string;
    wideClassName?: string;
    alignFlushSize?: string;
}) => {
    handler: import("tailwindcss/types/config").PluginCreator;
    config?: Partial<import("tailwindcss/types/config").Config>;
};
export {};
//# sourceMappingURL=editorTailwindPlugin.d.ts.map
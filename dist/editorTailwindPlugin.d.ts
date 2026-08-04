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
export declare const createWpAlignContainerRules: (options?: WpAlignContainerRulesOptions) => Record<string, string>;
/** Default align → class map (`alignwide` → `cntr-wide`). */
export declare const wpAlignContainerRules: Record<string, string>;
type ApplyClasses = (rules: Record<string, string>) => Record<string, Record<string, string>>;
/**
 * Tailwind plugin for the WP block editor canvas.
 *
 * When the editor sidebar opens, sets `--sidebar-w` and recomputes `--cntr-vw`
 * so gutters match the narrowed canvas. Pass `applyClasses` from your kit (or
 * equivalent) to expand utility class strings into CSS-in-JS declarations.
 */
export declare const createWpEditorContainerPlugin: (options: {
    applyClasses: ApplyClasses;
    sidebarWidth?: string;
    wideClassName?: string;
}) => {
    handler: import("tailwindcss/types/config").PluginCreator;
    config?: Partial<import("tailwindcss/types/config").Config>;
};
export {};
//# sourceMappingURL=editorTailwindPlugin.d.ts.map
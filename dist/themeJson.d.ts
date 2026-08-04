/**
 * Values for `theme.json` `settings.layout` so Gutenberg content/wide sizes
 * track `@cloakui/container` CSS variables.
 *
 * `wideSize` assumes you registered a size named `wide` on your
 * `defineContainer` config. If you use a different name, call
 * `createContainerThemeJsonLayout({ wideSizeName: "…" })` instead, or omit
 * `wideSize` entirely.
 */
export declare const containerThemeJsonLayout: {
    readonly allowCustomContentAndWideSize: false;
    readonly contentSize: "var(--cntr-width)";
    readonly wideSize: "var(--cntr-width-wide)";
};
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
export declare const createContainerThemeJsonLayout: (options?: ContainerThemeJsonLayoutOptions) => {
    readonly allowCustomContentAndWideSize: false;
    readonly contentSize: "var(--cntr-width)";
    readonly wideSize?: undefined;
} | {
    readonly allowCustomContentAndWideSize: false;
    readonly contentSize: "var(--cntr-width)";
    readonly wideSize: string;
};
//# sourceMappingURL=themeJson.d.ts.map
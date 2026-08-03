/**
 * Values for `theme.json` `settings.layout` so Gutenberg content/wide sizes
 * track `@cloakui/container` CSS variables.
 *
 * Register a `wide` size in `defineContainer({ sizes: { wide: … } })` when using
 * `wideSize`. Projects without a wide measure should omit `wideSize` or point it
 * at another `--cntr-width-{name}` variable they emit.
 */
export declare const containerThemeJsonLayout: {
    readonly allowCustomContentAndWideSize: false;
    readonly contentSize: "var(--cntr-width)";
    /** Requires a configured `wide` size (included in the package defaults). */
    readonly wideSize: "var(--cntr-width-wide)";
};
//# sourceMappingURL=themeJson.d.ts.map
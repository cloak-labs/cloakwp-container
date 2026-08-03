const semanticToContainerBreakpoint = {
    mobile: "base",
    tablet: "sm",
    tabletWide: "md",
    laptop: "lg",
    desktop: "xl",
    desktopWide: "2xl",
};
/**
 * Returns a CSS length expression for a block's content-box width, driven by
 * the project `container` config (not hardcoded px/rem tables).
 *
 * `align` may be a WP align token (`wide` / `full` / `none`) or any size name
 * registered on the container (e.g. `narrow`).
 */
export const getContainerWidthExpr = (align, breakpoint, container, options) => {
    const map = {
        wide: "wide",
        none: "default",
        center: "default",
        left: "default",
        right: "default",
        ...options?.alignSizeMap,
    };
    if (align === "full")
        return container.contentBoxWidth("full");
    const size = map[align] ?? align;
    const bp = semanticToContainerBreakpoint[breakpoint] ?? "base";
    return container.contentBoxWidth(size, bp);
};

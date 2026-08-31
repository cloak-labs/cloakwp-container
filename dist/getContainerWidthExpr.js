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
 * registered on the container (e.g. `narrow`). Note: `"none"` maps to the
 * **default** measure — that is *not* the same as render strategy `"none"`
 * (no own `cntr-*`, fill parent). For nested image `sizes`, prefer
 * `getLayoutSlot` / `getLayoutSlotImageSizes`, which inherit the ancestor
 * measure when the block does not contribute its own container.
 *
 * `breakpoint` may be a semantic key (`desktop`) or a container step (`xl`).
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
    const bp = semanticToContainerBreakpoint[breakpoint] ?? breakpoint ?? "base";
    return container.contentBoxWidth(size, bp);
};

import { builtinClassMap, containerClassMap, measureClassName, } from "@cloakui/container";
/**
 * Default WP `align` attribute → container size name.
 * Override via `alignSizeMap` on helpers when projects use different names.
 */
export const defaultAlignSizeMap = {
    wide: "wide",
    full: "full",
    left: "left",
    right: "right",
    center: "default",
    none: "none",
};
/**
 * Map a WP `align` attribute (or legacy className tokens) to a container size.
 */
export const alignToContainerSize = (align, className, fallbackOrOptions = "default") => {
    const options = typeof fallbackOrOptions === "object" &&
        fallbackOrOptions !== null &&
        ("fallback" in fallbackOrOptions || "alignSizeMap" in fallbackOrOptions)
        ? fallbackOrOptions
        : { fallback: fallbackOrOptions };
    const fallback = options.fallback ?? "default";
    const alignSizeMap = { ...defaultAlignSizeMap, ...options.alignSizeMap };
    if (align) {
        return alignSizeMap[align] ?? align;
    }
    const classList = className?.split(/\s+/) ?? [];
    if (classList.includes("alignwide") || classList.includes("cntr-wide")) {
        return alignSizeMap.wide ?? "wide";
    }
    if (classList.includes("alignfull") || classList.includes("cntr-full")) {
        return alignSizeMap.full ?? "full";
    }
    if (classList.includes("alignleft") || classList.includes("cntr-start")) {
        return alignSizeMap.left ?? "left";
    }
    if (classList.includes("alignright") || classList.includes("cntr-end")) {
        return alignSizeMap.right ?? "right";
    }
    return fallback;
};
/**
 * Resolve a CSS class for a container size. Prefers a project `container`
 * instance when provided; otherwise falls back to builtins + `cntr-{name}`.
 */
export const getCntrClass = (size, container) => {
    if (container)
        return container.className(size);
    if (size == null || size === "")
        return builtinClassMap.default;
    if (size in builtinClassMap) {
        return builtinClassMap[size];
    }
    if (size in containerClassMap) {
        return containerClassMap[size];
    }
    return measureClassName(size);
};
const normalizeAlign = (align, known) => {
    if (!align)
        return "full";
    if (known && !known.has(align))
        return "full";
    return align;
};
/**
 * Walk up the parent tree while align is `"full"` so nested full-width blocks
 * inherit their parent's constrained width.
 */
export const resolveBlockContainerAlign = (block, options) => {
    const known = new Set(options?.containerAligns ?? ["full", "wide", "none"]);
    let current = block;
    let align = normalizeAlign(current?.attrs?.align, known);
    while (align === "full" && current?.context?.parent) {
        current = current.context.parent;
        align = normalizeAlign(current?.attrs?.align, known);
    }
    return align;
};

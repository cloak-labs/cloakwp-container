import { alignToContainerSize } from "./align";
import { withHorizontalPadding } from "./horizontalPadding";
import { fillMissingBreakpoints } from "@cloakui/responsive";
import { composeLayoutSlot } from "./composeLayoutSlot";
import { withFlexItemWidthFraction } from "./flexItem";
/** Root slot before any measure/column contribution. */
export const ROOT_LAYOUT_SLOT = {
    measureSize: "full",
    subtractPad: false,
    padApplied: false,
    fractionByBreakpoint: { mobile: 1 },
};
const semanticToContainerBreakpoint = {
    mobile: "base",
    tablet: "sm",
    tabletWide: "md",
    laptop: "lg",
    desktop: "xl",
    desktopWide: "2xl",
};
const baseWidthExpr = (slot, breakpoint, container) => {
    const { measureSize, subtractPad } = slot;
    if (measureSize === "full") {
        return container.contentBoxWidth("full");
    }
    const bp = semanticToContainerBreakpoint[breakpoint] ?? breakpoint ?? "base";
    if (subtractPad) {
        return container.contentBoxWidth(measureSize, bp);
    }
    return container.width(measureSize, bp);
};
/**
 * Resolve a CSS length for a layout slot at a breakpoint (measure × fraction,
 * optionally clamped to an ancestor slot).
 */
export const layoutSlotContentWidthAt = (slot, breakpoint, container) => {
    const fraction = Number(fillMissingBreakpoints(slot.fractionByBreakpoint, 1)[breakpoint] ?? 1);
    let base = slot.widthBasis
        ? layoutSlotContentWidthAt(slot.widthBasis, breakpoint, container)
        : baseWidthExpr(slot, breakpoint, container);
    const padding = slot.paddingByBreakpoint?.[breakpoint];
    if (padding) {
        const bp = semanticToContainerBreakpoint[breakpoint] ?? breakpoint;
        const lengths = padding
            .filter((value) => value !== "0px" && value !== "0rem")
            .map((value) => value.startsWith("gutter:")
            ? `((100vw - ${container.contentBoxWidth(value.slice(7), bp)}) / 2)`
            : value);
        if (lengths.length)
            base = `max(0px, calc(${base} - ${lengths.join(" - ")}))`;
    }
    if (slot.clampSlot) {
        const ceiling = layoutSlotContentWidthAt(slot.clampSlot, breakpoint, container);
        base = `min(${base}, ${ceiling})`;
    }
    if (base === "100vw") {
        return fraction === 1 ? base : `${fraction * 100}vw`;
    }
    return fraction === 1 ? base : `calc((${base}) * ${fraction})`;
};
export const bindLayoutSlot = (slot, container) => ({
    measureSize: slot.measureSize,
    isFull: slot.measureSize === "full",
    fractionByBreakpoint: slot.fractionByBreakpoint,
    contentWidthAt: (breakpoint) => layoutSlotContentWidthAt(slot, breakpoint, container),
});
const measureSizeFromBlockAlign = (align, className) => {
    if (!align ||
        align === "none" ||
        align === "center" ||
        align === "left" ||
        align === "right") {
        return "default";
    }
    if (align === "full")
        return "full";
    return alignToContainerSize(align, className, "default");
};
/**
 * Decide whether this block establishes its own measure on top of the ancestor
 * slot. `fromAncestors.layoutSlot` is the *parent's* composed slot (pushed via
 * nested descent); blocks that inject/wrap a container (e.g. alignwide posts)
 * must still compose their own measure for accurate image `sizes`.
 */
const resolveOwnContainerDecision = (block, hasAncestorSlot) => {
    const align = block?.attrs?.align;
    const size = measureSizeFromBlockAlign(align, block?.attrs?.className);
    const hasExplicitMeasureAlign = !!align &&
        align !== "none" &&
        align !== "center" &&
        align !== "left" &&
        align !== "right";
    // Root-level leaves (no ancestor slot): own align / default establishes the
    // measure. Nested leaves only contribute when they have an explicit width
    // align — otherwise keep the ancestor slot (column/flex fractions intact).
    const strategy = !hasAncestorSlot || hasExplicitMeasureAlign ? "inject" : "none";
    return { strategy, size };
};
/**
 * Read the composed layout slot for a block: ancestor measure/fractions plus
 * this block's own container contribution (align / inject), then leaf flex-item
 * width when the parent is a horizontal flex container.
 *
 * `context.fromAncestors.layoutSlot` alone is the parent slot; using it without
 * composing this block's measure incorrectly treats alignwide roots as full-bleed.
 */
export const getLayoutSlot = (block, container) => {
    const fromAncestors = block?.context?.fromAncestors?.layoutSlot;
    const parentSlot = fromAncestors ?? ROOT_LAYOUT_SLOT;
    const decision = resolveOwnContainerDecision(block, !!fromAncestors);
    const measured = composeLayoutSlot(parentSlot, block, decision);
    return bindLayoutSlot(withHorizontalPadding(withFlexItemWidthFraction(measured, block), block?.attrs?.className), container);
};

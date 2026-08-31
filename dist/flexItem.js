import { fillMissingBreakpoints, } from "@cloakui/responsive";
/**
 * True when a WP layout config lays out children in a horizontal flex row.
 * Vertical flex must not affect width fractions (`flexSize` then sizes height).
 */
export const isHorizontalFlexLayout = (layout) => {
    if (!layout)
        return false;
    if (layout.orientation === "vertical")
        return false;
    return layout.orientation === "horizontal" || layout.type === "flex";
};
/**
 * Parse a WP `style.layout.flexSize` value into a 0–1 width fraction.
 * Only percentage values qualify (e.g. `"50%"`) — px/rem/`fit-content` are
 * ignored because they don't map cleanly to responsive `sizes`.
 */
export const parseFlexSizeFraction = (flexSize) => {
    if (!flexSize || typeof flexSize !== "string")
        return null;
    const match = flexSize.trim().match(/^(\d+(?:\.\d+)?)%$/);
    if (!match)
        return null;
    const pct = Number(match[1]);
    if (!(pct > 0 && pct <= 100))
        return null;
    return pct / 100;
};
/**
 * Width share of a flex item relative to its parent row, or `null` when this
 * block is not a percentage-sized item in a horizontal flex parent.
 */
export const resolveFlexItemWidthFraction = (block) => {
    const fraction = parseFlexSizeFraction(block?.attrs?.style?.layout?.flexSize);
    if (fraction == null)
        return null;
    if (!isHorizontalFlexLayout(block?.context?.parent?.attrs?.layout)) {
        return null;
    }
    return fraction;
};
const multiplyFractionsByFactor = (parent, factor) => {
    const filled = fillMissingBreakpoints(parent, 1);
    return Object.fromEntries(Object.entries(filled).map(([bp, value]) => [
        bp,
        Math.min(parseFloat((Number(value) * factor).toFixed(4)), 1),
    ]));
};
/**
 * Multiply a layout slot by this block's horizontal flex-item width share.
 * No-op (same reference) when the flex-item edge case does not apply.
 */
export const withFlexItemWidthFraction = (slot, block) => {
    const fraction = resolveFlexItemWidthFraction(block);
    if (fraction == null || fraction >= 1)
        return slot;
    return {
        ...slot,
        fractionByBreakpoint: multiplyFractionsByFactor(slot.fractionByBreakpoint, fraction),
    };
};

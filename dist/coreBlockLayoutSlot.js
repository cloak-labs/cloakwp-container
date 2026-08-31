import { fillMissingBreakpoints, } from "@cloakui/responsive";
import { getColumnsLayout } from "./columnsLayout";
import { withFlexItemWidthFraction } from "./flexItem";
const multiplyFractions = (parent, child) => {
    const parentFilled = fillMissingBreakpoints(parent, 1);
    const childFilled = fillMissingBreakpoints(child, 1);
    return Object.fromEntries(Object.keys({ ...parentFilled, ...childFilled }).map((bp) => {
        const p = Number(parentFilled[bp] ?? 1);
        const c = Number(childFilled[bp] ?? 1);
        return [bp, Math.min(parseFloat((p * c).toFixed(4)), 1)];
    }));
};
/**
 * Column share of its columns row at each semantic breakpoint.
 */
export const columnFractionByBreakpoint = (column) => {
    const columnsBlock = column.context?.parent;
    const colIndex = column.context?.index ?? 0;
    const isStackedOnMobile = columnsBlock?.attrs?.isStackedOnMobile;
    const innerBlocks = columnsBlock?.innerBlocks ?? [];
    const { gridCols, colSpans } = getColumnsLayout(innerBlocks ?? []);
    const colSpansForBlock = colSpans[colIndex] ?? 1;
    const responsiveGridCols = {
        mobile: isStackedOnMobile === false ? gridCols : 1,
        ...{
            1: { tablet: 1, tabletWide: 1 },
            2: { tablet: 1, tabletWide: 2 },
            3: { tablet: 2, tabletWide: 3 },
            4: { tablet: 2, tabletWide: 3 },
        }[Math.min(gridCols, 4)],
        laptop: gridCols,
        desktop: gridCols,
        desktopWide: gridCols,
    };
    const fractionByBreakpoint = Object.fromEntries(Object.entries(fillMissingBreakpoints(responsiveGridCols, gridCols)).map(([bp, cols]) => {
        const fraction = Math.min(parseFloat((colSpansForBlock / Number(cols)).toFixed(2)), 1);
        return [bp, fraction];
    }));
    return fillMissingBreakpoints(fractionByBreakpoint, 1);
};
/**
 * `blockContainerPlugin` `composeLayoutSlot` filter for WP `core/column`.
 *
 * Multiplies the inherited layout slot by this column's share of the row.
 * Custom column systems can register a similar filter that detects their own
 * block name/shape and applies the same fraction multiply.
 */
export const applyColumnLayoutSlot = (slot, { block }) => {
    if (block.name !== "core/column")
        return slot;
    return {
        ...slot,
        fractionByBreakpoint: multiplyFractions(slot.fractionByBreakpoint, columnFractionByBreakpoint(block)),
    };
};
/**
 * When descending into a block that is a percentage-sized item in a
 * horizontal flex parent, multiply the slot by that item's `flexSize` share.
 */
export const applyFlexItemLayoutSlot = (slot, { block }) => withFlexItemWidthFraction(slot, block);
/**
 * Default WP core subdivision: columns then flex-item width.
 * Used as `blockContainerPlugin`'s default `composeLayoutSlot` filter.
 */
export const applyCoreBlockLayoutSlot = (slot, ctx) => applyFlexItemLayoutSlot(applyColumnLayoutSlot(slot, ctx), ctx);

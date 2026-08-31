import { type BreakpointOptions } from "@cloakui/responsive";
import type { ComposeLayoutSlotFilter } from "./blockContainerPlugin";
type ColumnBlock = {
    name?: string;
    attrs?: {
        width?: string | number;
        isStackedOnMobile?: boolean;
    };
    innerBlocks?: ColumnBlock[];
    context?: {
        parent?: ColumnBlock;
        index?: number;
    };
};
/**
 * Column share of its columns row at each semantic breakpoint.
 */
export declare const columnFractionByBreakpoint: (column: ColumnBlock) => BreakpointOptions<number>;
/**
 * `blockContainerPlugin` `composeLayoutSlot` filter for WP `core/column`.
 *
 * Multiplies the inherited layout slot by this column's share of the row.
 * Custom column systems can register a similar filter that detects their own
 * block name/shape and applies the same fraction multiply.
 */
export declare const applyColumnLayoutSlot: ComposeLayoutSlotFilter;
/**
 * When descending into a block that is a percentage-sized item in a
 * horizontal flex parent, multiply the slot by that item's `flexSize` share.
 */
export declare const applyFlexItemLayoutSlot: ComposeLayoutSlotFilter;
/**
 * Default WP core subdivision: columns then flex-item width.
 * Used as `blockContainerPlugin`'s default `composeLayoutSlot` filter.
 */
export declare const applyCoreBlockLayoutSlot: ComposeLayoutSlotFilter;
export {};
//# sourceMappingURL=coreBlockLayoutSlot.d.ts.map
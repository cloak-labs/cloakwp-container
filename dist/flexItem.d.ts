import type { LayoutSlot } from "./layoutSlot";
type FlexLayout = {
    type?: string;
    orientation?: string;
};
export type BlockWithFlexItem = {
    attrs?: {
        style?: {
            layout?: {
                flexSize?: string;
            };
        };
        [key: string]: unknown;
    };
    context?: {
        parent?: {
            attrs?: {
                layout?: FlexLayout;
                [key: string]: unknown;
            };
            [key: string]: unknown;
        };
        [key: string]: unknown;
    };
    [key: string]: unknown;
};
/**
 * True when a WP layout config lays out children in a horizontal flex row.
 * Vertical flex must not affect width fractions (`flexSize` then sizes height).
 */
export declare const isHorizontalFlexLayout: (layout?: FlexLayout | null) => boolean;
/**
 * Parse a WP `style.layout.flexSize` value into a 0–1 width fraction.
 * Only percentage values qualify (e.g. `"50%"`) — px/rem/`fit-content` are
 * ignored because they don't map cleanly to responsive `sizes`.
 */
export declare const parseFlexSizeFraction: (flexSize?: string | null) => number | null;
/**
 * Width share of a flex item relative to its parent row, or `null` when this
 * block is not a percentage-sized item in a horizontal flex parent.
 */
export declare const resolveFlexItemWidthFraction: (block?: BlockWithFlexItem | null) => number | null;
/**
 * Multiply a layout slot by this block's horizontal flex-item width share.
 * No-op (same reference) when the flex-item edge case does not apply.
 */
export declare const withFlexItemWidthFraction: (slot: LayoutSlot, block?: BlockWithFlexItem | null) => LayoutSlot;
export {};
//# sourceMappingURL=flexItem.d.ts.map
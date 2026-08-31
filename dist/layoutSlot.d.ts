import type { ContainerInstance } from "@cloakui/container";
import type { BreakpointOptions } from "@cloakui/responsive";
export type LayoutSlotBreakpoint = keyof BreakpointOptions<string>;
/**
 * Serializable layout context pushed down the block tree via
 * `context.fromAncestors.layoutSlot`.
 */
export type LayoutSlot = {
    /** Active measure size name (`default`, `wide`, `full`, …). */
    measureSize: string;
    /**
     * When true, `contentWidthAt` subtracts horizontal container pad
     * (`contentBoxWidth`). Nested measures set this false to match nest CSS
     * (inner `padding-inline: 0`).
     */
    subtractPad: boolean;
    /** True once an ancestor measure established a content box. */
    padApplied: boolean;
    /** Share of the parent measure at each semantic breakpoint (1 = full). */
    fractionByBreakpoint: BreakpointOptions<number>;
    /**
     * Optional ceiling: new measures inside a tighter ancestor (e.g. a column)
     * clamp to this slot's width.
     */
    clampSlot?: LayoutSlot;
};
export type LayoutSlotApi = {
    measureSize: string;
    /** True when the active measure is full-bleed. */
    isFull: boolean;
    fractionByBreakpoint: BreakpointOptions<number>;
    contentWidthAt: (breakpoint: LayoutSlotBreakpoint | string) => string;
};
/** Root slot before any measure/column contribution. */
export declare const ROOT_LAYOUT_SLOT: LayoutSlot;
/**
 * Resolve a CSS length for a layout slot at a breakpoint (measure × fraction,
 * optionally clamped to an ancestor slot).
 */
export declare const layoutSlotContentWidthAt: (slot: LayoutSlot, breakpoint: LayoutSlotBreakpoint | string, container: Pick<ContainerInstance, "contentBoxWidth" | "width">) => string;
export declare const bindLayoutSlot: (slot: LayoutSlot, container: Pick<ContainerInstance, "contentBoxWidth" | "width">) => LayoutSlotApi;
type BlockWithLayoutContext = {
    attrs?: {
        align?: string;
        className?: string;
        style?: {
            layout?: {
                flexSize?: string;
            };
        };
    };
    context?: {
        fromAncestors?: Record<string, unknown>;
        parent?: {
            name?: string;
            attrs?: {
                layout?: {
                    type?: string;
                    orientation?: string;
                };
            };
        };
    };
};
/**
 * Read the composed layout slot for a block: ancestor measure/fractions plus
 * this block's own container contribution (align / inject), then leaf flex-item
 * width when the parent is a horizontal flex container.
 *
 * `context.fromAncestors.layoutSlot` alone is the parent slot; using it without
 * composing this block's measure incorrectly treats alignwide roots as full-bleed.
 */
export declare const getLayoutSlot: (block: BlockWithLayoutContext | undefined, container: Pick<ContainerInstance, "contentBoxWidth" | "width">) => LayoutSlotApi;
export {};
//# sourceMappingURL=layoutSlot.d.ts.map
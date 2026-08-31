import type { ContainerInstance } from "@cloakui/container";
import { type BreakpointOptions } from "@cloakui/responsive";
import { getLayoutSlot } from "./layoutSlot";
type BlockForLayoutSlot = Parameters<typeof getLayoutSlot>[0];
export type GetLayoutSlotImageSizesOptions = {
    /**
     * Fallback percentage when a breakpoint is missing from `itemWidths`.
     * @default 100
     */
    fallbackWidth?: number | string;
};
/**
 * Build an `<img sizes>` value from a grid/masonry item's per-breakpoint width
 * map (percentage of its parent) and the block's descent-composed layout slot.
 *
 * Prefer this over `getContainerWidthExpr(align, …)` for nested blocks: missing
 * align means "no own measure" (inherit parent), not the default `cntr` size.
 */
export declare const getLayoutSlotImageSizes: (block: BlockForLayoutSlot, itemWidths: BreakpointOptions<string | number>, container: Pick<ContainerInstance, "contentBoxWidth" | "width">, options?: GetLayoutSlotImageSizesOptions) => string;
export {};
//# sourceMappingURL=getLayoutSlotImageSizes.d.ts.map
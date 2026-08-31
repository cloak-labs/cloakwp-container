import type { ContainerInstance } from "@cloakui/container";
import {
  fillMissingBreakpoints,
  type BreakpointOptions,
} from "@cloakui/responsive";
import { getImageSizesFromBreakpointWidths } from "@cloakui/responsive/getImageSizesFromBreakpointWidths";
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
export const getLayoutSlotImageSizes = (
  block: BlockForLayoutSlot,
  itemWidths: BreakpointOptions<string | number>,
  container: Pick<ContainerInstance, "contentBoxWidth" | "width">,
  options?: GetLayoutSlotImageSizesOptions,
): string => {
  const { fallbackWidth = 100 } = options ?? {};
  const { contentWidthAt, isFull } = getLayoutSlot(block, container);

  const widths = fillMissingBreakpoints(
    Object.fromEntries(
      Object.entries(itemWidths).map(([bp, w]) => [bp, String(w)]),
    ) as BreakpointOptions<string>,
    String(fallbackWidth),
  );

  return getImageSizesFromBreakpointWidths(widths, {
    filter: (itemWidth, { breakpoint }) => {
      if (isFull) return `${itemWidth}vw`;
      return `calc((${contentWidthAt(breakpoint)}) * ${itemWidth} / 100)`;
    },
  });
};

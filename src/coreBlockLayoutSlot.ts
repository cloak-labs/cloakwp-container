import {
  fillMissingBreakpoints,
  type BreakpointOptions,
} from "@cloakui/responsive";
import type { ComposeLayoutSlotFilter } from "./blockContainerPlugin";
import { getColumnsLayout } from "./columnsLayout";
import { withFlexItemWidthFraction } from "./flexItem";
import type { LayoutSlot } from "./layoutSlot";

type ColumnBlock = {
  name?: string;
  attrs?: { width?: string | number; isStackedOnMobile?: boolean };
  innerBlocks?: ColumnBlock[];
  context?: {
    parent?: ColumnBlock;
    index?: number;
  };
};

const multiplyFractions = (
  parent: BreakpointOptions<number>,
  child: BreakpointOptions<number>,
): BreakpointOptions<number> => {
  const parentFilled = fillMissingBreakpoints(parent, 1);
  const childFilled = fillMissingBreakpoints(child, 1);
  return Object.fromEntries(
    Object.keys({ ...parentFilled, ...childFilled }).map((bp) => {
      const p = Number(parentFilled[bp as keyof typeof parentFilled] ?? 1);
      const c = Number(childFilled[bp as keyof typeof childFilled] ?? 1);
      return [bp, Math.min(parseFloat((p * c).toFixed(4)), 1)];
    }),
  ) as BreakpointOptions<number>;
};

/**
 * Column share of its columns row at each semantic breakpoint.
 */
export const columnFractionByBreakpoint = (
  column: ColumnBlock,
): BreakpointOptions<number> => {
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
  } as BreakpointOptions<number>;

  const fractionByBreakpoint = Object.fromEntries(
    Object.entries(fillMissingBreakpoints(responsiveGridCols, gridCols)).map(
      ([bp, cols]) => {
        const fraction = Math.min(
          parseFloat((colSpansForBlock / Number(cols)).toFixed(2)),
          1,
        );
        return [bp, fraction];
      },
    ),
  ) as BreakpointOptions<number>;

  return fillMissingBreakpoints(fractionByBreakpoint, 1);
};

/**
 * `blockContainerPlugin` `composeLayoutSlot` filter for WP `core/column`.
 *
 * Multiplies the inherited layout slot by this column's share of the row.
 * Custom column systems can register a similar filter that detects their own
 * block name/shape and applies the same fraction multiply.
 */
export const applyColumnLayoutSlot: ComposeLayoutSlotFilter = (
  slot,
  { block },
): LayoutSlot => {
  if ((block as ColumnBlock).name !== "core/column") return slot;

  return {
    ...slot,
    fractionByBreakpoint: multiplyFractions(
      slot.fractionByBreakpoint,
      columnFractionByBreakpoint(block as ColumnBlock),
    ),
  };
};

/**
 * When descending into a block that is a percentage-sized item in a
 * horizontal flex parent, multiply the slot by that item's `flexSize` share.
 */
export const applyFlexItemLayoutSlot: ComposeLayoutSlotFilter = (
  slot,
  { block },
): LayoutSlot => withFlexItemWidthFraction(slot, block);

/**
 * Default WP core subdivision: columns then flex-item width.
 * Used as `blockContainerPlugin`'s default `composeLayoutSlot` filter.
 */
export const applyCoreBlockLayoutSlot: ComposeLayoutSlotFilter = (
  slot,
  ctx,
): LayoutSlot => applyFlexItemLayoutSlot(applyColumnLayoutSlot(slot, ctx), ctx);

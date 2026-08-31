import { getGridLayoutFromColumnWidths } from "@cloakui/utils";

type ColumnLike = {
  attrs?: { width?: string | number };
};

/**
 * Read percentage widths from WP `core/column` inner blocks.
 * Missing widths split the row evenly.
 */
export const getColumnWidths = (innerBlocks: ColumnLike[]): number[] =>
  innerBlocks.map(
    (col) => parseFloat(String(col.attrs?.width)) || 100 / innerBlocks.length,
  );

/**
 * Map WP columns inner blocks to a CSS-grid-friendly `{ gridCols, colSpans }`
 * layout via `@cloakui/utils`.
 */
export const getColumnsLayout = (innerBlocks: ColumnLike[]) => {
  const columnWidths = getColumnWidths(innerBlocks);
  return getGridLayoutFromColumnWidths(columnWidths);
};

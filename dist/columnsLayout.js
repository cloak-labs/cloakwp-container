import { getGridLayoutFromColumnWidths } from "@cloakui/utils";
/**
 * Read percentage widths from WP `core/column` inner blocks.
 * Missing widths split the row evenly.
 */
export const getColumnWidths = (innerBlocks) => innerBlocks.map((col) => parseFloat(String(col.attrs?.width)) || 100 / innerBlocks.length);
/**
 * Map WP columns inner blocks to a CSS-grid-friendly `{ gridCols, colSpans }`
 * layout via `@cloakui/utils`.
 */
export const getColumnsLayout = (innerBlocks) => {
    const columnWidths = getColumnWidths(innerBlocks);
    return getGridLayoutFromColumnWidths(columnWidths);
};

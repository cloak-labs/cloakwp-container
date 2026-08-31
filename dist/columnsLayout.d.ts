type ColumnLike = {
    attrs?: {
        width?: string | number;
    };
};
/**
 * Read percentage widths from WP `core/column` inner blocks.
 * Missing widths split the row evenly.
 */
export declare const getColumnWidths: (innerBlocks: ColumnLike[]) => number[];
/**
 * Map WP columns inner blocks to a CSS-grid-friendly `{ gridCols, colSpans }`
 * layout via `@cloakui/utils`.
 */
export declare const getColumnsLayout: (innerBlocks: ColumnLike[]) => {
    gridCols: number;
    colSpans: number[];
};
export {};
//# sourceMappingURL=columnsLayout.d.ts.map
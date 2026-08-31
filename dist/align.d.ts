import { type ContainerInstance, type ContainerSizeName } from "@cloakui/container";
/**
 * Default WP `align` attribute → container size name.
 * Override via `alignSizeMap` on helpers when projects use different names.
 *
 * `left` / `right` are semantic tokens resolved by `getCntrClass` into
 * `cntr align-start-{flush}` / `cntr align-end-{flush}` (not measure sizes).
 */
export declare const defaultAlignSizeMap: Record<string, string>;
/** Default size whose gutter `alignleft` / `alignright` flush to. */
export declare const defaultAlignFlushSize = "wide";
export type AlignToSizeOptions = {
    fallback?: ContainerSizeName | string;
    /** Maps align tokens (e.g. `alignwide` / `wide`) to size names. */
    alignSizeMap?: Record<string, string>;
};
export type GetCntrClassOptions = {
    /**
     * Size whose gutter `left` / `right` flush to via `align-start-*` /
     * `align-end-*`. Ignored for other sizes.
     * @default "wide"
     */
    alignFlushSize?: string;
};
/**
 * Map a WP `align` attribute (or legacy className tokens) to a container size.
 */
export declare const alignToContainerSize: (align?: string | null, className?: string | null, fallbackOrOptions?: ContainerSizeName | string | AlignToSizeOptions) => string;
/**
 * Resolve a CSS class for a container size. Prefers a project `container`
 * instance when provided; otherwise falls back to builtins + `cntr-{name}`.
 *
 * Semantic `left` / `right` become compositional flush classes:
 * `cntr align-start-wide` / `cntr align-end-wide` by default.
 */
export declare const getCntrClass: (size?: ContainerSizeName | string | null, container?: Pick<ContainerInstance, "className">, options?: GetCntrClassOptions) => string;
export type BlockContainerAlign = "full" | "wide" | "none" | (string & {});
type BlockWithAlignContext = {
    attrs?: {
        align?: string;
    };
    context?: {
        parent?: BlockWithAlignContext;
    };
};
/**
 * Walk up the parent tree while align is `"full"` so nested full-width blocks
 * inherit their parent's constrained width.
 */
export declare const resolveBlockContainerAlign: (block?: BlockWithAlignContext, options?: {
    containerAligns?: string[];
}) => BlockContainerAlign;
export {};
//# sourceMappingURL=align.d.ts.map
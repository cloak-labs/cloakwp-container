import { type ContainerInstance, type ContainerSizeName } from "@cloakui/container";
/**
 * Default WP `align` attribute → container size name.
 * Override via `alignSizeMap` on helpers when projects use different names.
 */
export declare const defaultAlignSizeMap: Record<string, string>;
export type AlignToSizeOptions = {
    fallback?: ContainerSizeName | string;
    /** Maps align tokens (e.g. `alignwide` / `wide`) to size names. */
    alignSizeMap?: Record<string, string>;
};
/**
 * Map a WP `align` attribute (or legacy className tokens) to a container size.
 */
export declare const alignToContainerSize: (align?: string | null, className?: string | null, fallbackOrOptions?: ContainerSizeName | string | AlignToSizeOptions) => string;
/**
 * Resolve a CSS class for a container size. Prefers a project `container`
 * instance when provided; otherwise falls back to builtins + `cntr-{name}`.
 */
export declare const getCntrClass: (size?: ContainerSizeName | string | null, container?: Pick<ContainerInstance, "className">) => string;
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
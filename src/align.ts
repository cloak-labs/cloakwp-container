import {
  builtinClassMap,
  containerClassMap,
  measureClassName,
  type ContainerInstance,
  type ContainerSizeName,
} from "@cloakui/container";

/**
 * Default WP `align` attribute → container size name.
 * Override via `alignSizeMap` on helpers when projects use different names.
 */
export const defaultAlignSizeMap: Record<string, string> = {
  wide: "wide",
  full: "full",
  left: "left",
  right: "right",
  center: "default",
  none: "none",
};

export type AlignToSizeOptions = {
  fallback?: ContainerSizeName | string;
  /** Maps align tokens (e.g. `alignwide` / `wide`) to size names. */
  alignSizeMap?: Record<string, string>;
};

/**
 * Map a WP `align` attribute (or legacy className tokens) to a container size.
 */
export const alignToContainerSize = (
  align?: string | null,
  className?: string | null,
  fallbackOrOptions: ContainerSizeName | string | AlignToSizeOptions = "default",
): string => {
  const options: AlignToSizeOptions =
    typeof fallbackOrOptions === "object" &&
    fallbackOrOptions !== null &&
    ("fallback" in fallbackOrOptions || "alignSizeMap" in fallbackOrOptions)
      ? fallbackOrOptions
      : { fallback: fallbackOrOptions as string };

  const fallback = options.fallback ?? "default";
  const alignSizeMap = { ...defaultAlignSizeMap, ...options.alignSizeMap };

  if (align) {
    return alignSizeMap[align] ?? align;
  }

  const classList = className?.split(/\s+/) ?? [];

  if (classList.includes("alignwide") || classList.includes("cntr-wide")) {
    return alignSizeMap.wide ?? "wide";
  }
  if (classList.includes("alignfull") || classList.includes("cntr-full")) {
    return alignSizeMap.full ?? "full";
  }
  if (classList.includes("alignleft") || classList.includes("cntr-start")) {
    return alignSizeMap.left ?? "left";
  }
  if (classList.includes("alignright") || classList.includes("cntr-end")) {
    return alignSizeMap.right ?? "right";
  }

  return fallback;
};

/**
 * Resolve a CSS class for a container size. Prefers a project `container`
 * instance when provided; otherwise falls back to builtins + `cntr-{name}`.
 */
export const getCntrClass = (
  size?: ContainerSizeName | string | null,
  container?: Pick<ContainerInstance, "className">,
): string => {
  if (container) return container.className(size);
  if (size == null || size === "") return builtinClassMap.default;
  if (size in builtinClassMap) {
    return builtinClassMap[size as keyof typeof builtinClassMap];
  }
  if (size in containerClassMap) {
    return containerClassMap[size as keyof typeof containerClassMap];
  }
  return measureClassName(size);
};

export type BlockContainerAlign = "full" | "wide" | "none" | (string & {});

type BlockWithAlignContext = {
  attrs?: { align?: string };
  context?: { parent?: BlockWithAlignContext };
};

const normalizeAlign = (
  align?: string,
  known?: Set<string>,
): string => {
  if (!align) return "full";
  if (known && !known.has(align)) return "full";
  return align;
};

/**
 * Walk up the parent tree while align is `"full"` so nested full-width blocks
 * inherit their parent's constrained width.
 */
export const resolveBlockContainerAlign = (
  block?: BlockWithAlignContext,
  options?: { containerAligns?: string[] },
): BlockContainerAlign => {
  const known = new Set(options?.containerAligns ?? ["full", "wide", "none"]);
  let current = block;
  let align = normalizeAlign(current?.attrs?.align, known);

  while (align === "full" && current?.context?.parent) {
    current = current.context.parent;
    align = normalizeAlign(current?.attrs?.align, known);
  }

  return align;
};

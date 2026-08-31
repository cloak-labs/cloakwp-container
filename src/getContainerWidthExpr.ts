import type { ContainerInstance } from "@cloakui/container";
import type { BlockContainerAlign } from "./align";

/**
 * Semantic breakpoints used by `@cloakui/responsive` image helpers.
 * Also accepts raw `@cloakui/container` step names (`base`, `sm`, `xl`, …).
 */
export type ContainerWidthBreakpoint =
  | "mobile"
  | "tablet"
  | "tabletWide"
  | "laptop"
  | "desktop"
  | "desktopWide"
  | "base"
  | (string & {});

const semanticToContainerBreakpoint: Record<string, string> = {
  mobile: "base",
  tablet: "sm",
  tabletWide: "md",
  laptop: "lg",
  desktop: "xl",
  desktopWide: "2xl",
};

export type GetContainerWidthExprOptions = {
  /**
   * Maps align tokens to size names registered on the container instance.
   * @default { wide: "wide", none/center → "default", full → full }
   */
  alignSizeMap?: Record<string, string>;
};

/**
 * Returns a CSS length expression for a block's content-box width, driven by
 * the project `container` config (not hardcoded px/rem tables).
 *
 * `align` may be a WP align token (`wide` / `full` / `none`) or any size name
 * registered on the container (e.g. `narrow`). Note: `"none"` maps to the
 * **default** measure — that is *not* the same as render strategy `"none"`
 * (no own `cntr-*`, fill parent). For nested image `sizes`, prefer
 * `getLayoutSlot` / `getLayoutSlotImageSizes`, which inherit the ancestor
 * measure when the block does not contribute its own container.
 *
 * `breakpoint` may be a semantic key (`desktop`) or a container step (`xl`).
 */
export const getContainerWidthExpr = (
  align: BlockContainerAlign | string,
  breakpoint: ContainerWidthBreakpoint,
  container: Pick<ContainerInstance, "contentBoxWidth" | "width">,
  options?: GetContainerWidthExprOptions,
): string => {
  const map = {
    wide: "wide",
    none: "default",
    center: "default",
    left: "default",
    right: "default",
    ...options?.alignSizeMap,
  };

  if (align === "full") return container.contentBoxWidth("full");

  const size = map[align] ?? align;
  const bp = semanticToContainerBreakpoint[breakpoint] ?? breakpoint ?? "base";
  return container.contentBoxWidth(size, bp);
};

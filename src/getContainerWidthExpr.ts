import type { ContainerInstance } from "@cloakui/container";
import type { BlockContainerAlign } from "./align";

type SemanticBreakpoint =
  | "mobile"
  | "tablet"
  | "tabletWide"
  | "laptop"
  | "desktop"
  | "desktopWide";

const semanticToContainerBreakpoint = {
  mobile: "base",
  tablet: "sm",
  tabletWide: "md",
  laptop: "lg",
  desktop: "xl",
  desktopWide: "2xl",
} as const;

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
 * registered on the container (e.g. `narrow`).
 */
export const getContainerWidthExpr = (
  align: BlockContainerAlign | string,
  breakpoint: SemanticBreakpoint,
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
  const bp = semanticToContainerBreakpoint[breakpoint] ?? "base";
  return container.contentBoxWidth(size, bp);
};

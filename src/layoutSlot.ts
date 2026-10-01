import type { ContainerInstance } from "@cloakui/container";
import type { BreakpointOptions } from "@cloakui/responsive";
import { alignToContainerSize } from "./align";
import { composeLayoutSlot } from "./composeLayoutSlot";
import { withFlexItemWidthFraction } from "./flexItem";
import type { BlockContainerDecision } from "./resolveBlockContainerDecision";

export type LayoutSlotBreakpoint = keyof BreakpointOptions<string>;

/**
 * Serializable layout context pushed down the block tree via
 * `context.fromAncestors.layoutSlot`.
 */
export type LayoutSlot = {
  /** Active measure size name (`default`, `wide`, `full`, …). */
  measureSize: string;
  /**
   * When true, `contentWidthAt` subtracts horizontal container pad
   * (`contentBoxWidth`). Nested measures set this false to match nest CSS
   * (inner `padding-inline: 0`).
   */
  subtractPad: boolean;
  /** True once an ancestor measure established a content box. */
  padApplied: boolean;
  /** Share of the parent measure at each semantic breakpoint (1 = full). */
  fractionByBreakpoint: BreakpointOptions<number>;
  /**
   * Optional ceiling: new measures inside a tighter ancestor (e.g. a column)
   * clamp to this slot's width.
   */
  clampSlot?: LayoutSlot;
};

export type LayoutSlotApi = {
  measureSize: string;
  /** True when the active measure is full-bleed. */
  isFull: boolean;
  fractionByBreakpoint: BreakpointOptions<number>;
  contentWidthAt: (breakpoint: LayoutSlotBreakpoint | string) => string;
};

/** Root slot before any measure/column contribution. */
export const ROOT_LAYOUT_SLOT: LayoutSlot = {
  measureSize: "full",
  subtractPad: false,
  padApplied: false,
  fractionByBreakpoint: { mobile: 1 },
};

const semanticToContainerBreakpoint: Record<string, string> = {
  mobile: "base",
  tablet: "sm",
  tabletWide: "md",
  laptop: "lg",
  desktop: "xl",
  desktopWide: "2xl",
};

const baseWidthExpr = (
  slot: LayoutSlot,
  breakpoint: string,
  container: Pick<ContainerInstance, "contentBoxWidth" | "width">,
): string => {
  const { measureSize, subtractPad } = slot;

  if (measureSize === "full") {
    return container.contentBoxWidth("full");
  }

  const bp = semanticToContainerBreakpoint[breakpoint] ?? breakpoint ?? "base";

  if (subtractPad) {
    return container.contentBoxWidth(measureSize, bp);
  }

  return container.width(measureSize, bp);
};

/**
 * Resolve a CSS length for a layout slot at a breakpoint (measure × fraction,
 * optionally clamped to an ancestor slot).
 */
export const layoutSlotContentWidthAt = (
  slot: LayoutSlot,
  breakpoint: LayoutSlotBreakpoint | string,
  container: Pick<ContainerInstance, "contentBoxWidth" | "width">,
): string => {
  const fraction = Number(
    slot.fractionByBreakpoint[breakpoint as keyof BreakpointOptions<number>] ??
      1,
  );

  let base = baseWidthExpr(slot, breakpoint, container);

  if (slot.clampSlot) {
    const ceiling = layoutSlotContentWidthAt(
      slot.clampSlot,
      breakpoint,
      container,
    );
    base = `min(${base}, ${ceiling})`;
  }

  if (slot.measureSize === "full") {
    return fraction === 1 ? base : `${fraction * 100}vw`;
  }

  return fraction === 1 ? base : `calc((${base}) * ${fraction})`;
};

export const bindLayoutSlot = (
  slot: LayoutSlot,
  container: Pick<ContainerInstance, "contentBoxWidth" | "width">,
): LayoutSlotApi => ({
  measureSize: slot.measureSize,
  isFull: slot.measureSize === "full",
  fractionByBreakpoint: slot.fractionByBreakpoint,
  contentWidthAt: (breakpoint) =>
    layoutSlotContentWidthAt(slot, breakpoint, container),
});

type BlockWithLayoutContext = {
  attrs?: {
    align?: string;
    className?: string;
    style?: {
      layout?: {
        flexSize?: string;
      };
    };
  };
  context?: {
    fromAncestors?: Record<string, unknown>;
    parent?: {
      name?: string;
      attrs?: {
        layout?: {
          type?: string;
          orientation?: string;
        };
      };
    };
  };
};

const measureSizeFromBlockAlign = (
  align?: string | null,
  className?: string | null,
): string => {
  if (
    !align ||
    align === "none" ||
    align === "center" ||
    align === "left" ||
    align === "right"
  ) {
    return "default";
  }
  if (align === "full") return "full";
  return alignToContainerSize(align, className, "default");
};

/**
 * Decide whether this block establishes its own measure on top of the ancestor
 * slot. `fromAncestors.layoutSlot` is the *parent's* composed slot (pushed via
 * nested descent); blocks that inject/wrap a container (e.g. alignwide posts)
 * must still compose their own measure for accurate image `sizes`.
 */
const resolveOwnContainerDecision = (
  block: BlockWithLayoutContext | undefined,
  hasAncestorSlot: boolean,
): BlockContainerDecision => {
  const align = block?.attrs?.align;
  const size = measureSizeFromBlockAlign(align, block?.attrs?.className);

  const hasExplicitMeasureAlign =
    !!align &&
    align !== "none" &&
    align !== "center" &&
    align !== "left" &&
    align !== "right";

  // Root-level leaves (no ancestor slot): own align / default establishes the
  // measure. Nested leaves only contribute when they have an explicit width
  // align — otherwise keep the ancestor slot (column/flex fractions intact).
  const strategy =
    !hasAncestorSlot || hasExplicitMeasureAlign ? "inject" : "none";

  return { strategy, size };
};

/**
 * Read the composed layout slot for a block: ancestor measure/fractions plus
 * this block's own container contribution (align / inject), then leaf flex-item
 * width when the parent is a horizontal flex container.
 *
 * `context.fromAncestors.layoutSlot` alone is the parent slot; using it without
 * composing this block's measure incorrectly treats alignwide roots as full-bleed.
 */
export const getLayoutSlot = (
  block: BlockWithLayoutContext | undefined,
  container: Pick<ContainerInstance, "contentBoxWidth" | "width">,
): LayoutSlotApi => {
  const fromAncestors = block?.context?.fromAncestors?.layoutSlot as
    | LayoutSlot
    | undefined;
  const parentSlot = fromAncestors ?? ROOT_LAYOUT_SLOT;
  const decision = resolveOwnContainerDecision(block, !!fromAncestors);
  const measured = composeLayoutSlot(
    parentSlot,
    block as Parameters<typeof composeLayoutSlot>[1],
    decision,
  );

  return bindLayoutSlot(withFlexItemWidthFraction(measured, block), container);
};

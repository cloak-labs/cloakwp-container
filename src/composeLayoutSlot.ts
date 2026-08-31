import type { BlockDataWithExtraContext } from "cloakwp/blocks";
import type { BlockContainerDecision } from "./resolveBlockContainerDecision";
import { ROOT_LAYOUT_SLOT, type LayoutSlot } from "./layoutSlot";

const normalizeMeasureSize = (size: string): string => {
  if (!size || size === "none" || size === "center") return "default";
  if (size === "left" || size === "right") return "default";
  return size;
};

/**
 * Compose a child layout slot from the parent's slot plus this block's
 * measure contribution (inject/wrap). Column / flex-item subdivision is
 * applied via `hooks.filters.composeLayoutSlot` (defaults to
 * `applyCoreBlockLayoutSlot`).
 */
export const composeLayoutSlot = (
  parentSlot: LayoutSlot | undefined,
  _block: BlockDataWithExtraContext,
  decision: BlockContainerDecision,
): LayoutSlot => {
  const slot: LayoutSlot = parentSlot ?? ROOT_LAYOUT_SLOT;

  const contributesMeasure =
    decision.strategy === "inject" || decision.strategy === "wrap";

  if (!contributesMeasure) {
    return slot;
  }

  const measureSize = normalizeMeasureSize(decision.size);

  const hasSubdivision = Object.values(slot.fractionByBreakpoint).some(
    (f) => Number(f) < 1,
  );

  if (measureSize === "full") {
    // `.cntr-full` is `width: 100%` — it fills the current slot and does not
    // break out of an ancestor measure or column. Only treat as viewport-full
    // when we are still at the root (no padded measure / no fraction yet).
    if (slot.padApplied || hasSubdivision) {
      return slot;
    }

    return {
      ...slot,
      measureSize: "full",
      subtractPad: false,
      // full does not establish a padded measure for nest-collapse purposes
    };
  }

  const shouldClamp = slot.padApplied || hasSubdivision;

  return {
    measureSize,
    subtractPad: !slot.padApplied,
    padApplied: true,
    fractionByBreakpoint: { mobile: 1 },
    clampSlot: shouldClamp ? slot : undefined,
  };
};

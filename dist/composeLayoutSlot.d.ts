import type { BlockDataWithExtraContext } from "cloakwp/blocks";
import type { BlockContainerDecision } from "./resolveBlockContainerDecision";
import { type LayoutSlot } from "./layoutSlot";
/**
 * Compose a child layout slot from the parent's slot plus this block's
 * measure contribution (inject/wrap). Column / flex-item subdivision is
 * applied via `hooks.filters.composeLayoutSlot` (defaults to
 * `applyCoreBlockLayoutSlot`).
 */
export declare const composeLayoutSlot: (parentSlot: LayoutSlot | undefined, _block: BlockDataWithExtraContext, decision: BlockContainerDecision) => LayoutSlot;
//# sourceMappingURL=composeLayoutSlot.d.ts.map
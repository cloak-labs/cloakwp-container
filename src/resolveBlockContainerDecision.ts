import type { BlockDataWithExtraContext } from "cloakwp/blocks";
import type {
  ContainerMeta,
  ContainerSize,
  ContainerStrategy,
} from "./containerTypes";

export type BlockContainerDecision = {
  strategy: ContainerStrategy;
  size: ContainerSize;
};

export type ResolveBlockContainerDecisionOptions = {
  defaultStrategy?: ContainerMeta["container"]["strategy"];
  defaultSize?: ContainerMeta["container"]["size"];
  filters?: {
    containerStrategy?: (
      defaultStrategy: ContainerStrategy,
      context: {
        block: BlockDataWithExtraContext;
        props: Record<string, any>;
      },
    ) => ContainerStrategy;
    containerSize?: (
      defaultSize: ContainerSize,
      context: {
        block: BlockDataWithExtraContext;
        props: Record<string, any>;
      },
    ) => ContainerSize;
  };
};

/**
 * Shared strategy/size resolution for visual containers and descent
 * layout-slot composition. Mirrors `blockContainerPlugin` meta + filters.
 */
export const resolveBlockContainerDecision = (
  block: BlockDataWithExtraContext,
  props: Record<string, any> = {},
  options: ResolveBlockContainerDecisionOptions = {},
): BlockContainerDecision => {
  const {
    defaultStrategy = "inject",
    defaultSize = "default",
    filters = {},
  } = options;

  const blockCntr = block?.meta?.container as ContainerMeta["container"];

  const rawStrategy =
    typeof blockCntr?.strategy === "function"
      ? blockCntr.strategy({ block, props })
      : (blockCntr?.strategy ?? defaultStrategy);

  const strategy =
    filters.containerStrategy?.(rawStrategy as ContainerStrategy, {
      block,
      props,
    }) ?? (rawStrategy as ContainerStrategy);

  const rawSize =
    typeof blockCntr?.size === "function"
      ? blockCntr.size({ block, props })
      : (blockCntr?.size ?? defaultSize);

  const size =
    filters.containerSize?.(rawSize as ContainerSize, { block, props }) ??
    (rawSize as ContainerSize);

  return { strategy, size };
};

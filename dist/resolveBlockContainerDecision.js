/**
 * Shared strategy/size resolution for visual containers and descent
 * layout-slot composition. Mirrors `blockContainerPlugin` meta + filters.
 */
export const resolveBlockContainerDecision = (block, props = {}, options = {}) => {
    const { defaultStrategy = "inject", defaultSize = "default", filters = {}, } = options;
    const blockCntr = block?.meta?.container;
    const rawStrategy = typeof blockCntr?.strategy === "function"
        ? blockCntr.strategy({ block, props })
        : (blockCntr?.strategy ?? defaultStrategy);
    const strategy = filters.containerStrategy?.(rawStrategy, {
        block,
        props,
    }) ?? rawStrategy;
    const rawSize = typeof blockCntr?.size === "function"
        ? blockCntr.size({ block, props })
        : (blockCntr?.size ?? defaultSize);
    const size = filters.containerSize?.(rawSize, { block, props }) ??
        rawSize;
    return { strategy, size };
};

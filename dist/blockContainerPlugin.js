import { deepMerge } from "@kaelan/deep-merge-ts";
export const blockContainerPlugin = (pluginConfig) => {
    const { wrapperComponent, getContainerProps, childrenProp = "children", defaultSize = "default", defaultStrategy = "inject", groupWrap = true, hooks = {}, } = pluginConfig;
    const resolveStrategy = (component) => {
        const blockCntr = component.block.meta
            ?.container;
        const strategy = typeof blockCntr?.strategy === "function"
            ? blockCntr.strategy({ block: component.block, props: component.props })
            : blockCntr?.strategy;
        return (hooks?.filters?.containerStrategy?.(strategy, {
            block: component.block,
            props: component.props,
        }) ?? strategy);
    };
    const resolveSize = (component) => {
        const blockCntr = component.block.meta
            ?.container;
        const size = typeof blockCntr?.size === "function"
            ? blockCntr.size({ block: component.block, props: component.props })
            : blockCntr?.size;
        return (hooks?.filters?.containerSize?.(size, {
            block: component.block,
            props: component.props,
        }) ?? size);
    };
    return (userConfig, { executionCount, processedBlocks }) => {
        const originalRenderBlock = userConfig.renderBlock;
        const originalCombineBlocks = userConfig.combineBlocks;
        const firstExecutionConfigOverrides = executionCount === 1
            ? {
                renderBlock: (component, options, renderer) => {
                    const strategy = resolveStrategy(component);
                    if (strategy === "none") {
                        return originalRenderBlock(component, options, renderer);
                    }
                    if (strategy === "inject") {
                        return originalRenderBlock({
                            ...component,
                            props: {
                                ...component.props,
                                ...getContainerProps(component.props, {
                                    size: resolveSize(component),
                                }),
                            },
                        }, options, renderer);
                    }
                    if (strategy === "wrap" && !groupWrap) {
                        const { index, parent } = component.block.context;
                        return wrapperComponent({
                            ...getContainerProps({}, { size: resolveSize(component) }),
                            key: parent ? `${parent.context.index}_${index}` : index,
                            [childrenProp]: originalRenderBlock(component, options, renderer),
                        });
                    }
                    return originalRenderBlock(component, options, renderer);
                },
                combineBlocks: (renderedBlocks, components, options, renderer) => {
                    if (!groupWrap) {
                        return originalCombineBlocks(renderedBlocks, components, options, renderer);
                    }
                    const blocksWithGroupedWrappers = [];
                    let currentGroup = null;
                    let numGroups = 1;
                    const addCurrentGroup = () => {
                        if (currentGroup) {
                            blocksWithGroupedWrappers.push(wrapperComponent({
                                ...getContainerProps({}, { size: currentGroup.size }),
                                key: `group-${numGroups}`,
                                [childrenProp]: currentGroup.blocks,
                            }));
                            numGroups++;
                            currentGroup = null;
                        }
                    };
                    components.forEach((component, i) => {
                        const renderedBlock = renderedBlocks[i];
                        const strategy = resolveStrategy(component);
                        if (strategy !== "wrap") {
                            addCurrentGroup();
                            blocksWithGroupedWrappers.push(renderedBlock);
                            return;
                        }
                        const size = resolveSize(component);
                        if (!currentGroup || currentGroup.size !== size) {
                            addCurrentGroup();
                            currentGroup = { size, blocks: [renderedBlock] };
                        }
                        else {
                            currentGroup.blocks.push(renderedBlock);
                        }
                    });
                    addCurrentGroup();
                    return originalCombineBlocks(blocksWithGroupedWrappers, components, options, renderer);
                },
            }
            : {};
        const blocks = Object.entries(userConfig.blocks).reduce((acc, [key, blockConfig]) => {
            const hasContainerStrategy = blockConfig?.meta?.container?.strategy !== undefined;
            if (processedBlocks.has(key) && hasContainerStrategy) {
                return { ...acc, [key]: blockConfig };
            }
            processedBlocks.add(key);
            return {
                ...acc,
                [key]: {
                    ...blockConfig,
                    meta: {
                        ...blockConfig.meta,
                        container: {
                            strategy: defaultStrategy,
                            size: defaultSize,
                            ...blockConfig.meta?.container,
                        },
                    },
                },
            };
        }, {});
        return deepMerge(userConfig, { ...firstExecutionConfigOverrides, blocks });
    };
};

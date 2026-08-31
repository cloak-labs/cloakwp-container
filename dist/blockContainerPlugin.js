import { deepMerge } from "@kaelan/deep-merge-ts";
import { composeLayoutSlot } from "./composeLayoutSlot";
import { applyCoreBlockLayoutSlot } from "./coreBlockLayoutSlot";
import { ROOT_LAYOUT_SLOT } from "./layoutSlot";
import { resolveBlockContainerDecision, } from "./resolveBlockContainerDecision";
export const blockContainerPlugin = (pluginConfig) => {
    const { wrapperComponent, getContainerProps, childrenProp = "children", defaultSize = "default", defaultStrategy = "inject", groupWrap = true, hooks = {}, } = pluginConfig;
    const decisionOptions = {
        defaultStrategy,
        defaultSize,
        filters: hooks.filters,
    };
    const resolveDecision = (block, props = {}) => resolveBlockContainerDecision(block, props, decisionOptions);
    const composeSlotFilter = hooks.filters?.composeLayoutSlot ?? applyCoreBlockLayoutSlot;
    return (userConfig, { executionCount, processedBlocks }) => {
        const originalRenderBlock = userConfig.renderBlock;
        const originalCombineBlocks = userConfig.combineBlocks;
        const previousNestedRenderOptions = userConfig.hooks?.filters?.nestedRenderOptions ??
            ((options) => options);
        const nestedRenderOptions = (options, ctx) => {
            const next = previousNestedRenderOptions(options, ctx);
            const parentFromAncestors = ctx.parent.context?.fromAncestors ?? {};
            const parentSlot = (parentFromAncestors.layoutSlot ??
                ROOT_LAYOUT_SLOT);
            const decision = resolveDecision(ctx.parent, ctx.props);
            const measured = composeLayoutSlot(parentSlot, ctx.parent, decision);
            const layoutSlot = composeSlotFilter(measured, {
                block: ctx.parent,
                props: ctx.props,
                decision,
                parentSlot,
            });
            // Threaded separately from `context.parent` — that link is only one
            // hop deep, so a walk cannot see `core/column` two+ levels up.
            const insideCoreColumn = ctx.parent.name === "core/column" ||
                parentFromAncestors.insideCoreColumn === true;
            return {
                ...next,
                fromAncestors: {
                    ...next.fromAncestors,
                    layoutSlot,
                    insideCoreColumn,
                },
            };
        };
        const firstExecutionConfigOverrides = executionCount === 1
            ? {
                hooks: {
                    filters: {
                        ...userConfig.hooks?.filters,
                        nestedRenderOptions,
                    },
                },
                renderBlock: (component, options, renderer) => {
                    const { strategy, size } = resolveDecision(component.block, component.props);
                    if (strategy === "none") {
                        return originalRenderBlock(component, options, renderer);
                    }
                    if (strategy === "inject") {
                        return originalRenderBlock({
                            ...component,
                            props: {
                                ...component.props,
                                ...getContainerProps(component.props, { size }),
                            },
                        }, options, renderer);
                    }
                    if (strategy === "wrap" && !groupWrap) {
                        const { index, parent } = component.block.context;
                        return wrapperComponent({
                            ...getContainerProps({}, { size }),
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
                        const { strategy, size } = resolveDecision(component.block, component.props);
                        if (strategy !== "wrap") {
                            addCurrentGroup();
                            blocksWithGroupedWrappers.push(renderedBlock);
                            return;
                        }
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
        return deepMerge(userConfig, {
            ...firstExecutionConfigOverrides,
            blocks,
        });
    };
};

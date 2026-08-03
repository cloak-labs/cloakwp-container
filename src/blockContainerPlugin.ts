import { deepMerge } from "@kaelan/deep-merge-ts";
import {
  type BlockRendererPlugin,
  type BlockRendererConfig,
  type BlockDataWithExtraContext,
  type RenderPreparedBlock,
} from "cloakwp/cms";

export type ContainerStrategy = "inject" | "wrap" | "none";
export type ContainerSize = string;
export type ContainerMeta = {
  container?: {
    strategy?:
      | ContainerStrategy
      | ((props: {
          block: BlockDataWithExtraContext;
          props: Record<string, any>;
        }) => ContainerStrategy);
    size?:
      | ContainerSize
      | ((props: {
          block: BlockDataWithExtraContext;
          props: Record<string, any>;
        }) => ContainerSize);
  };
};

type ContainerPluginConfig<
  TComponent extends (props: any) => any = (props: any) => any
> = {
  /** The component to use for the "wrap" container strategy. */
  wrapperComponent: TComponent;
  /**
   * Returns props for the wrapper (wrap) or block component (inject). Typically
   * includes a `className` from `@cloakui/container`'s `container.className(size)`.
   */
  getContainerProps: (
    defaultProps: Record<string, any>,
    context: {
      size: ContainerSize;
    }
  ) => Record<string, any>;
  /** Framework children prop name. Defaults to "children". */
  childrenProp?: string;
  /** Default/fallback size for all block containers. */
  defaultSize?: ContainerMeta["container"]["size"];
  /** Default/fallback strategy for all block containers. */
  defaultStrategy?: ContainerMeta["container"]["strategy"];
  /**
   * Group sibling blocks that use "wrap" with the same size into one wrapper.
   */
  groupWrap?: boolean;
  hooks?: {
    filters?: {
      containerStrategy?: (
        defaultStrategy: ContainerStrategy,
        context: {
          block: BlockDataWithExtraContext;
          props: Record<string, any>;
        }
      ) => ContainerStrategy;
      containerSize?: (
        defaultSize: ContainerSize,
        context: {
          block: BlockDataWithExtraContext;
          props: Record<string, any>;
        }
      ) => ContainerSize;
    };
  };
};

export const blockContainerPlugin = <
  TComponent extends (props: any) => any = (props: any) => any,
  TRenderOutput = any,
  TBlockData extends Record<string, any> = Record<string, any>
>(
  pluginConfig: ContainerPluginConfig<TComponent>
): BlockRendererPlugin<TComponent, TRenderOutput, TBlockData> => {
  const {
    wrapperComponent,
    getContainerProps,
    childrenProp = "children",
    defaultSize = "default",
    defaultStrategy = "inject",
    groupWrap = true,
    hooks = {},
  } = pluginConfig;

  const resolveStrategy = (
    component: RenderPreparedBlock<
      TComponent,
      Record<string, any>,
      Record<string, any>
    >
  ): ContainerStrategy => {
    const blockCntr = component.block.meta
      ?.container as ContainerMeta["container"];

    const strategy =
      typeof blockCntr?.strategy === "function"
        ? blockCntr.strategy({ block: component.block, props: component.props })
        : blockCntr?.strategy;

    return (
      hooks?.filters?.containerStrategy?.(strategy, {
        block: component.block,
        props: component.props,
      }) ?? strategy
    );
  };

  const resolveSize = (
    component: RenderPreparedBlock<
      TComponent,
      Record<string, any>,
      Record<string, any>
    >
  ): ContainerSize => {
    const blockCntr = component.block.meta
      ?.container as ContainerMeta["container"];

    const size =
      typeof blockCntr?.size === "function"
        ? blockCntr.size({ block: component.block, props: component.props })
        : blockCntr?.size;

    return (
      hooks?.filters?.containerSize?.(size, {
        block: component.block,
        props: component.props,
      }) ?? size
    );
  };

  return (
    userConfig: BlockRendererConfig<TComponent, TRenderOutput, TBlockData>,
    { executionCount, processedBlocks }
  ): BlockRendererConfig<TComponent, TRenderOutput, TBlockData> => {
    const originalRenderBlock = userConfig.renderBlock;
    const originalCombineBlocks = userConfig.combineBlocks;

    const firstExecutionConfigOverrides: Partial<
      BlockRendererConfig<TComponent, TRenderOutput, TBlockData>
    > =
      executionCount === 1
        ? {
            renderBlock: (component, options, renderer) => {
              const strategy = resolveStrategy(component);

              if (strategy === "none") {
                return originalRenderBlock(component, options, renderer);
              }

              if (strategy === "inject") {
                return originalRenderBlock(
                  {
                    ...component,
                    props: {
                      ...component.props,
                      ...getContainerProps(component.props, {
                        size: resolveSize(component),
                      }),
                    },
                  },
                  options,
                  renderer
                );
              }

              if (strategy === "wrap" && !groupWrap) {
                const { index, parent } = component.block.context;
                return wrapperComponent({
                  ...getContainerProps({}, { size: resolveSize(component) }),
                  key: parent ? `${parent.context.index}_${index}` : index,
                  [childrenProp]: originalRenderBlock(
                    component,
                    options,
                    renderer
                  ),
                });
              }

              return originalRenderBlock(component, options, renderer);
            },

            combineBlocks: (renderedBlocks, components, options, renderer) => {
              if (!groupWrap) {
                return originalCombineBlocks(
                  renderedBlocks,
                  components,
                  options,
                  renderer
                );
              }

              const blocksWithGroupedWrappers = [];
              let currentGroup = null;
              let numGroups = 1;

              const addCurrentGroup = () => {
                if (currentGroup) {
                  blocksWithGroupedWrappers.push(
                    wrapperComponent({
                      ...getContainerProps({}, { size: currentGroup.size }),
                      key: `group-${numGroups}`,
                      [childrenProp]: currentGroup.blocks,
                    })
                  );

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
                } else {
                  currentGroup.blocks.push(renderedBlock);
                }
              });

              addCurrentGroup();

              return originalCombineBlocks(
                blocksWithGroupedWrappers,
                components,
                options,
                renderer
              );
            },
          }
        : {};

    const blocks = Object.entries(userConfig.blocks).reduce(
      (acc, [key, blockConfig]) => {
        const hasContainerStrategy =
          blockConfig?.meta?.container?.strategy !== undefined;

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
      },
      {}
    );

    return deepMerge(userConfig, { ...firstExecutionConfigOverrides, blocks });
  };
};

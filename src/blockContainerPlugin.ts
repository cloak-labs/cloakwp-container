import { deepMerge } from "@kaelan/deep-merge-ts";
import {
  type BlockRendererPlugin,
  type BlockRendererConfig,
  type BlockDataWithExtraContext,
  type RenderOptions,
} from "cloakwp/blocks";
import { composeLayoutSlot } from "./composeLayoutSlot";
import {
  type ContainerMeta,
  type ContainerSize,
  type ContainerStrategy,
} from "./containerTypes";
import { applyCoreBlockLayoutSlot } from "./coreBlockLayoutSlot";
import { ROOT_LAYOUT_SLOT, type LayoutSlot } from "./layoutSlot";
import {
  resolveBlockContainerDecision,
  type BlockContainerDecision,
} from "./resolveBlockContainerDecision";

export type { ContainerMeta, ContainerSize, ContainerStrategy };

export type ComposeLayoutSlotFilterContext = {
  block: BlockDataWithExtraContext;
  props: Record<string, any>;
  decision: BlockContainerDecision;
  parentSlot: LayoutSlot;
};

export type ComposeLayoutSlotFilter = (
  slot: LayoutSlot,
  context: ComposeLayoutSlotFilterContext,
) => LayoutSlot;

type ContainerPluginConfig<
  TComponent extends (props: any) => any = (props: any) => any,
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
    },
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
        },
      ) => ContainerStrategy;
      containerSize?: (
        defaultSize: ContainerSize,
        context: {
          block: BlockDataWithExtraContext;
          props: Record<string, any>;
        },
      ) => ContainerSize;
      /**
       * Runs after measure composition on nested descent. Use to apply column
       * fractions or other subdivision of the ancestor layout slot.
       */
      composeLayoutSlot?: ComposeLayoutSlotFilter;
    };
  };
};

export const blockContainerPlugin = <
  TComponent extends (props: any) => any = (props: any) => any,
  TRenderOutput = any,
  TBlockData extends Record<string, any> = Record<string, any>,
>(
  pluginConfig: ContainerPluginConfig<TComponent>,
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

  const decisionOptions = {
    defaultStrategy,
    defaultSize,
    filters: hooks.filters,
  };

  const resolveDecision = (
    block: BlockDataWithExtraContext,
    props: Record<string, any> = {},
  ) => resolveBlockContainerDecision(block, props, decisionOptions);

  const composeSlotFilter: ComposeLayoutSlotFilter =
    hooks.filters?.composeLayoutSlot ?? applyCoreBlockLayoutSlot;

  return (
    userConfig: BlockRendererConfig<TComponent, TRenderOutput, TBlockData>,
    { executionCount, processedBlocks },
  ): BlockRendererConfig<TComponent, TRenderOutput, TBlockData> => {
    const originalRenderBlock = userConfig.renderBlock;
    const originalCombineBlocks = userConfig.combineBlocks;
    const previousNestedRenderOptions =
      userConfig.hooks?.filters?.nestedRenderOptions ??
      ((options: RenderOptions<TBlockData>) => options);

    const nestedRenderOptions = (
      options: RenderOptions<TBlockData>,
      ctx: {
        parent: BlockDataWithExtraContext<Partial<TBlockData>>;
        props: Record<string, any>;
      },
    ): RenderOptions<TBlockData> => {
      const next = previousNestedRenderOptions(options, ctx);
      const parentFromAncestors = ctx.parent.context?.fromAncestors ?? {};
      const parentSlot = (parentFromAncestors.layoutSlot ??
        ROOT_LAYOUT_SLOT) as LayoutSlot;
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
      const insideCoreColumn =
        ctx.parent.name === "core/column" ||
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

    const firstExecutionConfigOverrides: Partial<
      BlockRendererConfig<TComponent, TRenderOutput, TBlockData>
    > =
      executionCount === 1
        ? {
            hooks: {
              filters: {
                ...userConfig.hooks?.filters,
                nestedRenderOptions,
              },
            },
            renderBlock: (component, options, renderer) => {
              const { strategy, size } = resolveDecision(
                component.block,
                component.props,
              );

              if (strategy === "none") {
                return originalRenderBlock(component, options, renderer);
              }

              if (strategy === "inject") {
                return originalRenderBlock(
                  {
                    ...component,
                    props: {
                      ...component.props,
                      ...getContainerProps(component.props, { size }),
                    },
                  },
                  options,
                  renderer,
                );
              }

              if (strategy === "wrap" && !groupWrap) {
                const { index, parent } = component.block.context;
                return wrapperComponent({
                  ...getContainerProps({}, { size }),
                  key: parent ? `${parent.context.index}_${index}` : index,
                  [childrenProp]: originalRenderBlock(
                    component,
                    options,
                    renderer,
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
                  renderer,
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
                    }),
                  );

                  numGroups++;
                  currentGroup = null;
                }
              };

              components.forEach((component, i) => {
                const renderedBlock = renderedBlocks[i];
                const { strategy, size } = resolveDecision(
                  component.block,
                  component.props,
                );

                if (strategy !== "wrap") {
                  addCurrentGroup();
                  blocksWithGroupedWrappers.push(renderedBlock);
                  return;
                }

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
                renderer,
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
      {},
    );

    return deepMerge(userConfig, {
      ...firstExecutionConfigOverrides,
      blocks,
    });
  };
};

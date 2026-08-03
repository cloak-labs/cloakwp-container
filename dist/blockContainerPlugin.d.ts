import { type BlockRendererPlugin, type BlockDataWithExtraContext } from "cloakwp/cms";
export type ContainerStrategy = "inject" | "wrap" | "none";
export type ContainerSize = string;
export type ContainerMeta = {
    container?: {
        strategy?: ContainerStrategy | ((props: {
            block: BlockDataWithExtraContext;
            props: Record<string, any>;
        }) => ContainerStrategy);
        size?: ContainerSize | ((props: {
            block: BlockDataWithExtraContext;
            props: Record<string, any>;
        }) => ContainerSize);
    };
};
type ContainerPluginConfig<TComponent extends (props: any) => any = (props: any) => any> = {
    /** The component to use for the "wrap" container strategy. */
    wrapperComponent: TComponent;
    /**
     * Returns props for the wrapper (wrap) or block component (inject). Typically
     * includes a `className` from `@cloakui/container`'s `container.className(size)`.
     */
    getContainerProps: (defaultProps: Record<string, any>, context: {
        size: ContainerSize;
    }) => Record<string, any>;
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
            containerStrategy?: (defaultStrategy: ContainerStrategy, context: {
                block: BlockDataWithExtraContext;
                props: Record<string, any>;
            }) => ContainerStrategy;
            containerSize?: (defaultSize: ContainerSize, context: {
                block: BlockDataWithExtraContext;
                props: Record<string, any>;
            }) => ContainerSize;
        };
    };
};
export declare const blockContainerPlugin: <TComponent extends (props: any) => any = (props: any) => any, TRenderOutput = any, TBlockData extends Record<string, any> = Record<string, any>>(pluginConfig: ContainerPluginConfig<TComponent>) => BlockRendererPlugin<TComponent, TRenderOutput, TBlockData>;
export {};
//# sourceMappingURL=blockContainerPlugin.d.ts.map
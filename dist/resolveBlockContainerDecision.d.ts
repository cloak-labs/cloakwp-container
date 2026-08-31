import type { BlockDataWithExtraContext } from "cloakwp/blocks";
import type { ContainerMeta, ContainerSize, ContainerStrategy } from "./containerTypes";
export type BlockContainerDecision = {
    strategy: ContainerStrategy;
    size: ContainerSize;
};
export type ResolveBlockContainerDecisionOptions = {
    defaultStrategy?: ContainerMeta["container"]["strategy"];
    defaultSize?: ContainerMeta["container"]["size"];
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
/**
 * Shared strategy/size resolution for visual containers and descent
 * layout-slot composition. Mirrors `blockContainerPlugin` meta + filters.
 */
export declare const resolveBlockContainerDecision: (block: BlockDataWithExtraContext, props?: Record<string, any>, options?: ResolveBlockContainerDecisionOptions) => BlockContainerDecision;
//# sourceMappingURL=resolveBlockContainerDecision.d.ts.map
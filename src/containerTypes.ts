import type { BlockDataWithExtraContext } from "cloakwp/blocks";

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

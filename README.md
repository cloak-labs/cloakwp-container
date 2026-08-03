# `@cloakwp/container`

WordPress / CloakWP integration for [`@cloakui/container`](https://github.com/cloak-labs/cloakui-container).

## Includes

- `blockContainerPlugin` — inject/wrap/none strategies for the block renderer
- `alignToContainerSize` / `getCntrClass` — WP align → container class
- `getContainerWidthExpr` — image `sizes` math from a `defineContainer` instance
- `createWpEditorContainerPlugin` — Gutenberg align → `cntr*` class mapping
- `containerThemeJsonLayout` — `theme.json` content/wide size helpers
- `editor.css` — iframe preview padding sync

## Example

```ts
import { defineContainer } from "@cloakui/container";
import {
  blockContainerPlugin,
  getCntrClass,
  alignToContainerSize,
} from "@cloakwp/container";

export const container = defineContainer({
  sizes: { wide: { base: "72rem", xl: "84rem", "2xl": "96rem" } },
});

blockContainerPlugin({
  wrapperComponent: ({ children, ...props }) => <div {...props}>{children}</div>,
  getContainerProps: (props, { size }) => ({
    className: [getCntrClass(size, container), props.className],
  }),
  hooks: {
    filters: {
      containerSize: (fallback, { block }) =>
        alignToContainerSize(block?.attrs?.align, block?.attrs?.className, fallback),
    },
  },
});
```

## License

LGPL-3.0-only

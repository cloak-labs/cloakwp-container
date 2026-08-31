# `@cloakwp/container`

A complete UI container system for WordPress blocks that are rendered on decoupled frontends via [`@cloakui/block-renderer`](https://github.com/cloak-labs/cloakui-block-renderer); built on top of [`@cloakui/container`](https://github.com/cloak-labs/cloakui-container) for users of CloakWP.

`@cloakui/container` owns content widths (the "measure"), CSS classes like `.cntr` / `.cntr-wide`, and JS helpers such as `contentBoxWidth()` for image `sizes`. This package connects that system to Gutenberg and CloakWP:

- Map WP block `align` values (`wide`, `full`, `left`, …) to container sizes / classes
- Apply those classes while rendering blocks (`blockContainerPlugin`)
- Push a composed **layout slot** down the block tree so nested columns, flex items, and measures yield accurate image `sizes` (enabling massive performance boosts with zero effort)
- Keep the block editor canvas and `theme.json` layout sizes pointed at the same CSS variables/values that your decoupled frontend uses

If you are not using WordPress / CloakWP, you only need `@cloakui/container`.

## Concepts (skim once)

### Align vs size vs class

In Gutenberg, a block can have an **align** attribute: `wide`, `full`, `left`, `right`, or none.

This package turns that into a **size name** from your `@cloakui/container` config (for example `"wide"` or `"default"`), then into a **CSS class** (`.cntr-wide`, `.cntr`, …).

```text
block.attrs.align = "wide"
        ↓ alignToContainerSize()
size name = "wide"          (must exist in defineContainer({ sizes }))
        ↓ getCntrClass(size, container) / container.className(size)
class = "cntr-wide"
```

`left` / `right` are special: they become compositional flush classes (default measure + align modifier), not a separate measure size:

```text
block.attrs.align = "left"
        ↓
class = "cntr align-start-wide"   (flush to the wide band; override via alignFlushSize)
```

`@cloakui/container` only ships a built-in `default` measure. Gutenberg's "wide" alignment needs a size you register yourself (usually named `wide`). See the quick start.

### Container strategies (`inject` / `wrap` / `none`)

When pairing with [`@cloakui/block-renderer`](https://github.com/cloak-labs/cloakui-block-renderer), each block can declare (via `meta.container` in each block config object) how measure classes are applied:

| Strategy | Behavior |
|----------|----------|
| `inject` (default) | Merge container props (usually `className`) onto the block component itself |
| `wrap` | Render a wrapper around the block; consecutive same-size wraps are grouped when `groupWrap` is on |
| `none` | Skip visual containers for this block |

`strategy` and `size` may be static values or functions of `{ block, props }`. Plugin-level filters (`containerStrategy`, `containerSize`) run after meta resolution and are the usual place to map WP `align` → size.

### Layout slots (nested width context)

Visual classes are only half the story. When a block sits inside a wide group, then a 50% column, then a nested measure, image `sizes` must reflect that composed width — not the root measure alone.

`blockContainerPlugin` pushes a serializable **layout slot** into `context.fromAncestors.layoutSlot` as it the BlockRenderer descends through the block tree:

```text
ROOT_LAYOUT_SLOT  (full, fraction 1)
        ↓ composeLayoutSlot (parent's inject/wrap measure)
measured slot
        ↓ composeLayoutSlot filter (default: applyCoreBlockLayoutSlot)
          · core/column → multiply by column share
          · horizontal flex item with flexSize: "50%" → multiply by 0.5
child layoutSlot
```

Data routers read the composed slot with `getLayoutSlot(block, container)` and call `contentWidthAt(breakpoint)` for `sizes`. Nested measures collapse pad (matching nest CSS) and clamp to tighter ancestors.

```ts
import { getLayoutSlot } from "@cloakwp/container";

const { contentWidthAt, isFull } = getLayoutSlot(block, container);
// contentWidthAt("desktop") → CSS length for this block's content box
```

Prefer `getLayoutSlot` over bare `getContainerWidthExpr` whenever the block tree can nest (columns, flex, nested groups). Use `getContainerWidthExpr` for simple align-only cases with no ancestor context.

### Why the editor needs extras

The frontend uses your normal container CSS. The block editor is different:

- The canvas can shrink when the sidebar opens
- Gutenberg's own content / wide widths come from `theme.json`
- Individual block preview iframes need a few CSS overrides so padding does not double up

Those pieces live here: `createWpEditorContainerPlugin`, `containerThemeJsonLayout`, and `editor.css`.

## Install

```bash
pnpm add @cloakui/container @cloakwp/container
```

| Peer | Required? | Used by |
|------|-----------|---------|
| `cloakwp` `>=0.6.0` | For `blockContainerPlugin` | Block renderer plugin + layout-slot descent |
| `tailwindcss` `>=3` | Optional | `createWpEditorContainerPlugin` |

Align helpers, theme.json, layout-slot math, and `getContainerWidthExpr` work without the CloakWP peer. The editor Tailwind plugin needs `tailwindcss`.

**Exports:**

| Import path | Contents |
|-------------|----------|
| `@cloakwp/container` | All JS/TS APIs |
| `@cloakwp/container/theme-json` | `containerThemeJsonLayout` / `createContainerThemeJsonLayout` only (handy for Node theme build scripts) |
| `@cloakwp/container/editor.css` | Gutenberg block preview iframe CSS overrides |

## Quick start

### 1. Define containers (include `wide` for Gutenberg)

```ts
// container.ts
import { defineContainer } from "@cloakui/container";

export const container = defineContainer({
  sizes: {
    default: { base: "56rem", "2xl": "64rem" },
    // Needed if you use alignwide / theme.json wideSize / alignleft flush
    wide: { base: "72rem", xl: "84rem", "2xl": "96rem" },
  },
  padding: { base: "1rem", sm: "1.5rem" },
  // Optional: account for scrollbar + editor sidebar via --sidebar-w
  scrollbarCompensation: true,
  selectors: [":root", "#root", ".editor-styles-wrapper"],
});
```

Emit CSS with the Tailwind plugin or `container.writeCss(..., { theme: true })`. See the [`@cloakui/container` README](https://github.com/cloak-labs/cloakui-container).

### 2. Map align → class when rendering blocks

```ts
import {
  blockContainerPlugin,
  getCntrClass,
  alignToContainerSize,
} from "@cloakwp/container";
import { container } from "./container";

export const withContainers = blockContainerPlugin({
  wrapperComponent: ({ children, ...props }) => (
    <div {...props}>{children}</div>
  ),
  getContainerProps: (props, { size }) => ({
    className: [getCntrClass(size, container), props.className]
      .filter(Boolean)
      .join(" "),
  }),
  hooks: {
    filters: {
      containerSize: (fallback, { block }) =>
        alignToContainerSize(
          block?.attrs?.align,
          block?.attrs?.className,
          fallback,
        ),
      // Optional: override strategy; layout-slot subdivision defaults to
      // applyCoreBlockLayoutSlot (columns + horizontal flex items).
      // composeLayoutSlot: (slot, ctx) => …,
    },
  },
});
```

Per-block overrides via block meta:

```ts
blocks: {
  "core/paragraph": {
    component: Paragraph,
    meta: {
      container: {
        strategy: "inject", // or "wrap" | "none" | ({ block, props }) => …
        size: "default",    // or ({ block, props }) => …
      },
    },
  },
}
```

In short:

- Each block can declare how it should be wrapped (`inject`, `wrap`, or `none`) via block meta
- Size usually comes from the block's WP `align` value (via the `containerSize` filter)
- The class on the wrapper / block is the matching `.cntr*` class from your config
- Descent automatically composes `layoutSlot` for nested width math

### 3. Read layout slots for image `sizes`

```ts
import { getLayoutSlot } from "@cloakwp/container";
import { container } from "./container";

function imageDataRouter(block) {
  const { contentWidthAt } = getLayoutSlot(block, container);

  const sizes = [
    `(max-width: 1023px) ${contentWidthAt("mobile")}`,
    `(max-width: 1279px) ${contentWidthAt("laptop")}`,
    contentWidthAt("desktop"),
  ].join(", ");

  const { src, alt = "" } = block.attrs ?? {};

  return { src, alt, sizes };
}
```

`getLayoutSlot` uses the ancestor-composed slot when present (from `blockContainerPlugin` descent). At the root it falls back to the block's own align. It also takes into account this block's own `style.layout.flexSize` when the parent is a horizontal flex row.

Simpler align-only helper (no nesting awareness):

```ts
import { getContainerWidthExpr } from "@cloakwp/container";

getContainerWidthExpr("wide", "desktop", container);
// → calc(min(<wide at xl>, 100%|100vw) - <padding total>)
```

Breakpoint names may be semantic (`mobile`, `tablet`, `laptop`, `desktop`, …) or raw container steps (`base`, `sm`, `xl`, …). Pass any registered size name as `align` if you are not using WP align tokens.

### 4. Point `theme.json` at the same CSS variables

```ts
import { containerThemeJsonLayout } from "@cloakwp/container/theme-json";

// theme.json → settings.layout
{
  ...containerThemeJsonLayout
  // contentSize: "var(--cntr-width)"
  // wideSize: "var(--cntr-width-wide)"  // requires sizes.wide
}
```

Different wide name:

```ts
import { createContainerThemeJsonLayout } from "@cloakwp/container";

createContainerThemeJsonLayout({ wideSizeName: "prose" });
// wideSize → var(--cntr-width-prose)

createContainerThemeJsonLayout({ includeWide: false });
// contentSize only
```

### 5. Sync the block editor canvas (optional but recommended)

```css
/* in your decoupled frontend's CSS file: */
@import "@cloakwp/container/editor.css";
```

Add `.gutenberg-preview` to `document.body` when the frontend preview runs inside the editor iframe so these rules apply.

`editor.css` zeroes measure padding inside that iframe and restores it under `.cntr-full`. It targets `.cntr` and `.cntr-wide` by default; if you rename the wide measure, override those selectors in your theme.

Map Gutenberg align classes on the editor canvas to your measure classes with the rules helper (wire into CSS or a Tailwind plugin however you prefer):

```ts
import { createWpAlignContainerRules } from "@cloakwp/container";

createWpAlignContainerRules();
// { ".… > .alignwide": "cntr-wide", ".… > .alignfull": "cntr-full", … }

createWpAlignContainerRules({
  wideClassName: "cntr-prose",
  alignFlushSize: "prose",
});
```

For Tailwind editor configs, `createWpEditorContainerPlugin` applies those rules and updates `--cntr-vw` when the sidebar opens. It needs a small adapter that turns utility class strings into CSS-in-JS for `addUtilities` (Tailwind does not expand class names for you):

```ts
import { createWpEditorContainerPlugin } from "@cloakwp/container";

plugins: [
  createWpEditorContainerPlugin({
    sidebarWidth: "280px",
    // wideClassName / alignFlushSize forwarded to createWpAlignContainerRules
    applyClasses: (rules) =>
      Object.fromEntries(
        Object.entries(rules).map(([selector, classes]) => [
          selector,
          { [`@apply ${classes}`]: {} },
        ]),
      ),
  }),
];
```

## Custom align → size mapping

By default, Gutenberg `wide` maps to the size named `"wide"`. If your config uses another name, keep every surface in sync:

```ts
alignToContainerSize(align, className, {
  alignSizeMap: { wide: "prose" },
});

getContainerWidthExpr(align, "desktop", container, {
  alignSizeMap: { wide: "prose" },
});

createWpAlignContainerRules({ wideClassName: "cntr-prose" });

createContainerThemeJsonLayout({ wideSizeName: "prose" });
```

`left` / `right` flush size (independent of the wide measure name):

```ts
getCntrClass("left", container, { alignFlushSize: "prose" });
// → "cntr align-start-prose"

createWpAlignContainerRules({
  wideClassName: "cntr-prose",
  alignFlushSize: "prose",
});
```

## Layout slots in depth

### Slot shape

```ts
type LayoutSlot = {
  measureSize: string;              // "default" | "wide" | "full" | …
  subtractPad: boolean;             // contentBoxWidth vs width()
  padApplied: boolean;              // an ancestor already established a measure
  fractionByBreakpoint: {           // share of parent (1 = full)
    mobile?: number;
    tablet?: number;
    // …
  };
  clampSlot?: LayoutSlot;           // ceiling from a tighter ancestor
};
```

### Composition rules

| Situation | Result |
|-----------|--------|
| Parent `inject`/`wrap` with size `default`/`wide` | Child slot gets that measure; first measure subtracts pad |
| Nested measure inside a padded/fractioned ancestor | Inner pad collapsed (`subtractPad: false`); width clamped via `clampSlot` |
| Nested `full` inside a padded or fractioned slot | Keeps the ancestor measure (`.cntr-full` is `width: 100%`, not a viewport breakout) |
| Root-level `full` | Viewport-full slot |
| `strategy: "none"` | Slot passes through unchanged (subdivision filters may still run) |
| `core/column` (default filter) | Multiplies `fractionByBreakpoint` by the column's share of the row |
| Horizontal flex item with `flexSize: "50%"` | Multiplies fraction by `0.5` (px/rem/`fit-content` ignored) |

### Custom subdivision

Replace or wrap the default filter when you have non-core column systems:

```ts
import {
  blockContainerPlugin,
  applyCoreBlockLayoutSlot,
  type LayoutSlot,
} from "@cloakwp/container";

blockContainerPlugin({
  // …
  hooks: {
    filters: {
      composeLayoutSlot: (slot, ctx) => {
        const next = applyCoreBlockLayoutSlot(slot, ctx);
        if (ctx.block.name !== "acf/my-columns-item") return next;
        // multiply next.fractionByBreakpoint by your item's share…
        return next;
      },
    },
  },
});
```

Standalone helpers for building your own filter: `applyColumnLayoutSlot`, `applyFlexItemLayoutSlot`, `columnFractionByBreakpoint`, `withFlexItemWidthFraction`, `getColumnsLayout`, `getColumnWidths`.

### Nesting-aware vs align-only widths

```ts
import {
  getLayoutSlot,
  getContainerWidthExpr,
  resolveBlockContainerAlign,
} from "@cloakwp/container";

// Preferred when blockContainerPlugin is in the renderer:
getLayoutSlot(block, container).contentWidthAt("desktop");

// Align-only (ignores columns / nested measures):
const align = resolveBlockContainerAlign(block); // walks parents while align === "full"
getContainerWidthExpr(align, "desktop", container);
```

`resolveBlockContainerAlign` walks up while align is `"full"` so nested full-width blocks inherit a real constrained width from an ancestor. Known aligns default to `full` / `wide` / `none`; pass `containerAligns` to extend.

## API overview

### Align & classes

| Export | Role |
|--------|------|
| `alignToContainerSize(align, className?, fallbackOrOptions?)` | WP align / legacy class → size name |
| `defaultAlignSizeMap` | Default align → size map (`wide`→`wide`, `left`→`left`, …) |
| `defaultAlignFlushSize` | `"wide"` — size `left`/`right` flush to |
| `getCntrClass(size, container?, options?)` | Size name → CSS class (`left`/`right` → flush classes) |
| `resolveBlockContainerAlign(block, options?)` | Walk parents while align is `full` |

### Block renderer plugin

| Export | Role |
|--------|------|
| `blockContainerPlugin({ … })` | CloakWP plugin: inject / wrap / none + layout-slot descent |
| `resolveBlockContainerDecision(block, props?, options?)` | Shared strategy/size resolution (meta + filters) |
| Types: `ContainerStrategy`, `ContainerSize`, `ContainerMeta`, `BlockContainerDecision`, `ComposeLayoutSlotFilter` | Block meta and filter typing |

Plugin options: `wrapperComponent`, `getContainerProps`, `childrenProp`, `defaultSize`, `defaultStrategy`, `groupWrap` (default `true`), `hooks.filters` (`containerStrategy`, `containerSize`, `composeLayoutSlot`).

### Layout slots & subdivision

| Export | Role |
|--------|------|
| `ROOT_LAYOUT_SLOT` | Starting slot before any measure |
| `composeLayoutSlot(parent, block, decision)` | Apply this block's measure contribution |
| `getLayoutSlot(block, container)` | Read composed slot (+ leaf flexSize); returns `LayoutSlotApi` |
| `bindLayoutSlot(slot, container)` | Bind a raw slot to `contentWidthAt` |
| `layoutSlotContentWidthAt(slot, breakpoint, container)` | CSS length for a slot at a breakpoint |
| `applyCoreBlockLayoutSlot` | Default `composeLayoutSlot` filter (columns then flex) |
| `applyColumnLayoutSlot` / `columnFractionByBreakpoint` | `core/column` share of row |
| `applyFlexItemLayoutSlot` / `withFlexItemWidthFraction` | Horizontal flex `%` width |
| `isHorizontalFlexLayout` / `parseFlexSizeFraction` / `resolveFlexItemWidthFraction` | Flex-item parsing |
| `getColumnWidths` / `getColumnsLayout` | WP columns → `%` widths / grid spans |

### Image widths (align-only)

| Export | Role |
|--------|------|
| `getContainerWidthExpr(align, breakpoint, container, options?)` | CSS length from align/size + breakpoint (no nesting) |

### Editor sync

| Export | Role |
|--------|------|
| `containerThemeJsonLayout` / `createContainerThemeJsonLayout(options?)` | `theme.json` `settings.layout` helpers |
| `createWpEditorContainerPlugin({ applyClasses, … })` | Optional Tailwind plugin: sidebar `--cntr-vw` + align rules via your class→CSS adapter |
| `wpAlignContainerRules` / `createWpAlignContainerRules({ wideClassName?, alignFlushSize? })` | Align → measure-class map (use directly or via the plugin) |
| `@cloakwp/container/editor.css` | Preview iframe CSS (expects `.gutenberg-preview` on `body`) |

## License

LGPL-3.0-only

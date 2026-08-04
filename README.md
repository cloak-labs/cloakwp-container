# `@cloakwp/container`

WordPress / CloakWP helpers on top of [`@cloakui/container`](https://github.com/cloak-labs/cloakui-container).

`@cloakui/container` owns content widths (the "measure"), CSS classes like `.cntr` / `.cntr-wide`, and JS helpers such as `contentBoxWidth()` for image `sizes`. This package connects that system to Gutenberg and CloakWP:

- Map WP block `align` values (`wide`, `full`, `left`, …) to container sizes / classes
- Apply those classes while rendering blocks (`blockContainerPlugin`)
- Keep the block editor canvas and `theme.json` layout sizes pointed at the same CSS variables
- Build width expressions for responsive images from the same config

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

`@cloakui/container` only ships a built-in `default` measure. Gutenberg's "wide" alignment needs a size you register yourself (usually named `wide`). See the quick start.

### Why the editor needs extras

The frontend uses your normal container CSS. The block editor is different:

- The canvas can shrink when the sidebar opens
- Gutenberg's own content / wide widths come from `theme.json`
- Preview iframes need a few CSS overrides so padding does not double up

Those pieces live here: `createWpEditorContainerPlugin`, `containerThemeJsonLayout`, and `editor.css`.

## Install

```bash
pnpm add @cloakui/container @cloakwp/container
```

`blockContainerPlugin` needs a CloakWP block renderer (`cloakwp` peer). Align helpers, theme.json, and editor bits work without it.

## Quick start

### 1. Define containers (include `wide` for Gutenberg)

```ts
// container.ts
import { defineContainer } from "@cloakui/container";

export const container = defineContainer({
  sizes: {
    default: { base: "56rem", "2xl": "64rem" },
    // Needed if you use alignwide / theme.json wideSize
    wide: { base: "72rem", xl: "84rem", "2xl": "96rem" },
  },
  padding: { base: "1rem", sm: "1.5rem" },
  // Optional: start/end gutters line up with the wide band
  startEndAlignSize: "wide",
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
    },
  },
});
```

In short:

- Each block can declare how it should be wrapped (`inject`, `wrap`, or `none`) via block meta
- Size usually comes from the block's WP `align` value
- The class on the wrapper / block is the matching `.cntr*` class from your config

### 3. Point `theme.json` at the same CSS variables

```ts
import { containerThemeJsonLayout } from "@cloakwp/container/theme-json";
// or: import { containerThemeJsonLayout } from "@cloakwp/container";

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
```

### 4. Sync the block editor canvas (optional but recommended)

```ts
import { createWpEditorContainerPlugin } from "@cloakwp/container";

// In your WP / editor Tailwind config:
plugins: [
  createWpEditorContainerPlugin({
    applyClasses, // expands "cntr-wide" → CSS decls (from your kit or equivalent)
    sidebarWidth: "280px",
    // wideClassName: "cntr-wide", // default; change if your size isn't named "wide"
  }),
];
```

```css
@import "@cloakwp/container/editor.css";
```

`editor.css` tweaks padding inside Gutenberg's frontend preview iframe. It targets `.cntr` and `.cntr-wide` by default; if you rename the wide measure, override those selectors in your theme. The Tailwind plugin maps `.alignwide` / `.alignfull` on the canvas to your measure classes and updates `--cntr-vw` when the sidebar is open.

## API overview

| Export | Role |
|--------|------|
| `alignToContainerSize(align, className?, fallbackOrOptions?)` | WP align / legacy class → size name |
| `getCntrClass(size, container?)` | Size name → CSS class (uses your `container` instance when passed) |
| `resolveBlockContainerAlign(block)` | Walk parents while align is `full` so nested full blocks inherit a real width |
| `blockContainerPlugin({ … })` | CloakWP renderer plugin: inject / wrap / none |
| `getContainerWidthExpr(align, breakpoint, container)` | CSS length for image `sizes` from the same config |
| `containerThemeJsonLayout` / `createContainerThemeJsonLayout()` | `theme.json` `settings.layout` helpers |
| `createWpEditorContainerPlugin({ … })` | Editor Tailwind plugin |
| `wpAlignContainerRules` / `createWpAlignContainerRules({ wideClassName? })` | Align → class map used by that plugin |
| `@cloakwp/container/editor.css` | Preview iframe CSS |

### Custom align → size mapping

By default, Gutenberg `wide` maps to the size named `"wide"`. If your config uses another name:

```ts
alignToContainerSize(align, className, {
  alignSizeMap: { wide: "prose" },
});

getContainerWidthExpr(align, "desktop", container, {
  alignSizeMap: { wide: "prose" },
});

createWpEditorContainerPlugin({
  applyClasses,
  wideClassName: "cntr-prose",
});

createContainerThemeJsonLayout({ wideSizeName: "prose" });
```

### Image `sizes`

```ts
import { getContainerWidthExpr } from "@cloakwp/container";

getContainerWidthExpr("wide", "desktop", container);
// → calc(min(<wide at xl>, 100%|100vw) - <padding total>)
```

Breakpoint names here are semantic (`mobile`, `tablet`, `laptop`, `desktop`, …) and map onto `@cloakui/container` steps (`base`, `sm`, `lg`, `xl`, …). Pass any registered size name as `align` if you are not using WP align tokens.

## License

LGPL-3.0-only

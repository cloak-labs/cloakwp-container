import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defineContainer } from "@cloakui/container";
import {
  bindLayoutSlot,
  getLayoutSlot,
  ROOT_LAYOUT_SLOT,
  type LayoutSlot,
} from "./layoutSlot.js";
import { getLayoutSlotImageSizes } from "./getLayoutSlotImageSizes.js";
import { composeLayoutSlot } from "./composeLayoutSlot.js";
import {
  isHorizontalFlexLayout,
  parseFlexSizeFraction,
  resolveFlexItemWidthFraction,
  withFlexItemWidthFraction,
} from "./flexItem.js";
import { getColumnWidths, getColumnsLayout } from "./columnsLayout.js";
import {
  applyColumnLayoutSlot,
  applyCoreBlockLayoutSlot,
  applyFlexItemLayoutSlot,
} from "./coreBlockLayoutSlot.js";

const container = defineContainer({
  scrollbarCompensation: true,
  sizes: {
    default: { base: "56rem" },
    wide: { base: "72rem", xl: "76rem" },
  },
});

describe("composeLayoutSlot", () => {
  it("composes a root measure for children", () => {
    const slot = composeLayoutSlot(
      ROOT_LAYOUT_SLOT,
      { name: "core/group" },
      {
        strategy: "inject",
        size: "default",
      },
    );

    assert.equal(slot.measureSize, "default");
    assert.equal(slot.subtractPad, true);
    assert.equal(slot.padApplied, true);
    assert.equal(slot.fractionByBreakpoint.mobile, 1);

    const { contentWidthAt } = bindLayoutSlot(slot, container);
    assert.equal(
      contentWidthAt("mobile"),
      container.contentBoxWidth("default", "base"),
    );
  });

  it("collapses pad for nested measures and clamps to parent", () => {
    const outer = composeLayoutSlot(
      ROOT_LAYOUT_SLOT,
      { name: "core/group" },
      {
        strategy: "inject",
        size: "default",
      },
    );
    const inner = composeLayoutSlot(
      outer,
      { name: "core/group" },
      {
        strategy: "inject",
        size: "wide",
      },
    );

    assert.equal(inner.measureSize, "wide");
    assert.equal(inner.subtractPad, false);
    assert.ok(inner.clampSlot);

    const { contentWidthAt } = bindLayoutSlot(inner, container);
    const width = contentWidthAt("desktop");
    assert.match(width, /^min\(/);
    assert.match(width, /76rem/);
  });

  it("passes through unchanged when strategy is none", () => {
    const measure = composeLayoutSlot(
      ROOT_LAYOUT_SLOT,
      { name: "core/columns" },
      {
        strategy: "inject",
        size: "default",
      },
    );
    const slot = composeLayoutSlot(
      measure,
      { name: "core/column" },
      {
        strategy: "none",
        size: "default",
      },
    );

    assert.equal(slot, measure);
  });

  it("clamps nested measure when parent slot already has a fraction", () => {
    const fractioned: LayoutSlot = {
      measureSize: "wide",
      subtractPad: true,
      padApplied: true,
      fractionByBreakpoint: { mobile: 1, laptop: 0.5 },
    };

    const nested = composeLayoutSlot(
      fractioned,
      { name: "core/group" },
      {
        strategy: "inject",
        size: "default",
      },
    );

    assert.equal(nested.fractionByBreakpoint.mobile, 1);
    assert.ok(nested.clampSlot);
    assert.equal(nested.clampSlot?.fractionByBreakpoint.laptop, 0.5);
  });

  it("keeps ancestor measure when nested full sits inside a padded slot", () => {
    const wide = composeLayoutSlot(
      ROOT_LAYOUT_SLOT,
      { name: "core/columns" },
      {
        strategy: "wrap",
        size: "wide",
      },
    );

    const nestedFull = composeLayoutSlot(
      wide,
      { name: "core/group" },
      {
        strategy: "inject",
        size: "full",
      },
    );

    assert.equal(nestedFull, wide);
    assert.equal(nestedFull.measureSize, "wide");

    const { contentWidthAt } = bindLayoutSlot(nestedFull, container);
    assert.equal(
      contentWidthAt("laptop"),
      container.contentBoxWidth("wide", "lg"),
    );
  });

  it("keeps column fraction when nested full sits inside a subdivided slot", () => {
    const fractioned: LayoutSlot = {
      measureSize: "wide",
      subtractPad: true,
      padApplied: true,
      fractionByBreakpoint: { mobile: 1, laptop: 0.5 },
    };

    const nestedFull = composeLayoutSlot(
      fractioned,
      { name: "core/group" },
      {
        strategy: "inject",
        size: "full",
      },
    );

    assert.equal(nestedFull, fractioned);
    assert.equal(nestedFull.measureSize, "wide");
    assert.equal(nestedFull.fractionByBreakpoint.laptop, 0.5);

    const { contentWidthAt } = bindLayoutSlot(nestedFull, container);
    assert.equal(
      contentWidthAt("laptop"),
      `calc((${container.contentBoxWidth("wide", "lg")}) * 0.5)`,
    );
    assert.notEqual(contentWidthAt("laptop"), "50vw");
  });

  it("still treats root-level full as viewport-full", () => {
    const slot = composeLayoutSlot(
      ROOT_LAYOUT_SLOT,
      { name: "core/group" },
      {
        strategy: "inject",
        size: "full",
      },
    );

    assert.equal(slot.measureSize, "full");
    assert.equal(slot.padApplied, false);

    const { contentWidthAt } = bindLayoutSlot(slot, container);
    assert.equal(contentWidthAt("mobile"), container.contentBoxWidth("full"));
  });
});

describe("getLayoutSlot", () => {
  it("reads fromAncestors.layoutSlot", () => {
    const slot: LayoutSlot = {
      measureSize: "wide",
      subtractPad: true,
      padApplied: true,
      fractionByBreakpoint: { mobile: 1, laptop: 0.5 },
    };

    const api = getLayoutSlot(
      { context: { fromAncestors: { layoutSlot: slot } } },
      container,
    );

    assert.equal(api.measureSize, "wide");
    assert.equal(api.isFull, false);
    assert.equal(
      api.contentWidthAt("laptop"),
      `calc((${container.contentBoxWidth("wide", "lg")}) * 0.5)`,
    );
  });

  it("falls back to block align at the root", () => {
    const api = getLayoutSlot({ attrs: { align: "wide" } }, container);
    assert.equal(api.measureSize, "wide");
    assert.equal(
      api.contentWidthAt("mobile"),
      container.contentBoxWidth("wide", "base"),
    );
  });

  it("composes the block's own wide measure onto a full ancestor slot", () => {
    const api = getLayoutSlot(
      {
        attrs: { align: "wide" },
        context: {
          fromAncestors: {
            layoutSlot: {
              measureSize: "full",
              subtractPad: false,
              padApplied: false,
              fractionByBreakpoint: { mobile: 1 },
            },
          },
          parent: { name: "core/group", attrs: { align: "full" } as never },
        },
      },
      container,
    );

    assert.equal(api.measureSize, "wide");
    assert.equal(api.isFull, false);
    assert.equal(
      api.contentWidthAt("mobile"),
      container.contentBoxWidth("wide", "base"),
    );
  });

  it("keeps ancestor column fractions for nested leaves without align", () => {
    const slot: LayoutSlot = {
      measureSize: "wide",
      subtractPad: true,
      padApplied: true,
      fractionByBreakpoint: { mobile: 1, laptop: 0.5 },
    };

    const api = getLayoutSlot(
      {
        context: {
          fromAncestors: { layoutSlot: slot },
          parent: { name: "core/column" },
        },
      },
      container,
    );

    assert.equal(api.measureSize, "wide");
    assert.equal(api.isFull, false);
    assert.equal(api.fractionByBreakpoint.laptop, 0.5);
    assert.equal(
      api.contentWidthAt("laptop"),
      `calc((${container.contentBoxWidth("wide", "lg")}) * 0.5)`,
    );
  });

  it("multiplies ancestor slot by leaf flexSize in a horizontal flex parent", () => {
    const slot: LayoutSlot = {
      measureSize: "wide",
      subtractPad: true,
      padApplied: true,
      fractionByBreakpoint: { mobile: 1, laptop: 0.5 },
    };

    const api = getLayoutSlot(
      {
        attrs: { style: { layout: { flexSize: "50%" } } },
        context: {
          fromAncestors: { layoutSlot: slot },
          parent: {
            attrs: { layout: { type: "flex", orientation: "horizontal" } },
          },
        },
      },
      container,
    );

    assert.equal(api.fractionByBreakpoint.laptop, 0.25);
    assert.equal(
      api.contentWidthAt("laptop"),
      `calc((${container.contentBoxWidth("wide", "lg")}) * 0.25)`,
    );
  });

  it("ignores leaf flexSize when parent is vertical flex", () => {
    const slot: LayoutSlot = {
      measureSize: "wide",
      subtractPad: true,
      padApplied: true,
      fractionByBreakpoint: { mobile: 1, laptop: 0.5 },
    };

    const api = getLayoutSlot(
      {
        attrs: { style: { layout: { flexSize: "50%" } } },
        context: {
          fromAncestors: { layoutSlot: slot },
          parent: {
            attrs: { layout: { type: "flex", orientation: "vertical" } },
          },
        },
      },
      container,
    );

    assert.equal(api.fractionByBreakpoint.laptop, 0.5);
  });
});

describe("columnsLayout", () => {
  it("maps equal columns to a 2-col grid", () => {
    const layout = getColumnsLayout([
      { attrs: { width: "50" } },
      { attrs: { width: "50" } },
    ]);
    assert.deepEqual(layout, { gridCols: 2, colSpans: [1, 1] });
  });

  it("splits evenly when widths are missing", () => {
    assert.deepEqual(getColumnWidths([{}, {}, {}]), [
      100 / 3,
      100 / 3,
      100 / 3,
    ]);
  });
});

describe("coreBlockLayoutSlot", () => {
  it("applyColumnLayoutSlot multiplies by column fraction", () => {
    const measure = composeLayoutSlot(
      ROOT_LAYOUT_SLOT,
      { name: "core/columns" },
      { strategy: "inject", size: "default" },
    );

    const columnsBlock = {
      name: "core/columns",
      attrs: { isStackedOnMobile: true },
      innerBlocks: [
        { name: "core/column", attrs: { width: "50" } },
        { name: "core/column", attrs: { width: "50" } },
      ],
    };

    const columnBlock = {
      name: "core/column",
      attrs: { width: "50" },
      context: { parent: columnsBlock, index: 0 },
      meta: { container: { strategy: "none" } },
    };

    const measured = composeLayoutSlot(measure, columnBlock, {
      strategy: "none",
      size: "default",
    });
    const slot = applyColumnLayoutSlot(measured, {
      block: columnBlock,
      props: {},
      decision: { strategy: "none", size: "default" },
      parentSlot: measure,
    });

    assert.equal(slot.fractionByBreakpoint.mobile, 1);
    assert.equal(slot.fractionByBreakpoint.laptop, 0.5);
  });

  it("applyFlexItemLayoutSlot multiplies % flexSize in horizontal flex", () => {
    const columnSlot: LayoutSlot = {
      measureSize: "wide",
      subtractPad: true,
      padApplied: true,
      fractionByBreakpoint: { mobile: 1, laptop: 0.5 },
    };

    const flexChildGroup = {
      name: "core/group",
      attrs: { style: { layout: { flexSize: "50%" } } },
      context: {
        parent: {
          attrs: { layout: { type: "flex", orientation: "horizontal" } },
        },
      },
    };

    const slot = applyFlexItemLayoutSlot(columnSlot, {
      block: flexChildGroup,
      props: {},
      decision: { strategy: "none", size: "default" },
      parentSlot: columnSlot,
    });

    assert.equal(slot.fractionByBreakpoint.laptop, 0.25);
  });

  it("smoke: image flexSize 50% inside flex-row group inside 50% wide column", () => {
    const columnsMeasure = composeLayoutSlot(
      ROOT_LAYOUT_SLOT,
      { name: "core/columns" },
      { strategy: "wrap", size: "wide" },
    );
    const columnsBlock = {
      name: "core/columns",
      attrs: { isStackedOnMobile: true },
      innerBlocks: [
        { name: "core/column", attrs: { width: "50" } },
        { name: "core/column", attrs: { width: "50" } },
      ],
    };
    const columnBlock = {
      name: "core/column",
      context: { parent: columnsBlock, index: 0 },
      meta: { container: { strategy: "none" } },
    };
    const measured = composeLayoutSlot(columnsMeasure, columnBlock, {
      strategy: "none",
      size: "default",
    });
    const columnSlot = applyCoreBlockLayoutSlot(measured, {
      block: columnBlock,
      props: {},
      decision: { strategy: "none", size: "default" },
      parentSlot: columnsMeasure,
    });

    const groupSlot = composeLayoutSlot(
      columnSlot,
      { name: "core/group" },
      {
        strategy: "inject",
        size: "full",
      },
    );

    const imageBlock = {
      name: "core/image",
      attrs: { style: { layout: { flexSize: "50%" } } },
      context: {
        fromAncestors: { layoutSlot: groupSlot },
        parent: {
          name: "core/group",
          attrs: { layout: { type: "flex", orientation: "horizontal" } },
        },
      },
    };

    const { contentWidthAt, fractionByBreakpoint } = getLayoutSlot(
      imageBlock,
      container,
    );

    assert.equal(fractionByBreakpoint.laptop, 0.25);
    assert.equal(
      contentWidthAt("laptop"),
      `calc((${container.contentBoxWidth("wide", "lg")}) * 0.25)`,
    );
  });
});

describe("flexItem", () => {
  it("parses percentage flexSize only", () => {
    assert.equal(parseFlexSizeFraction("50%"), 0.5);
    assert.equal(parseFlexSizeFraction("33.33%"), 0.3333);
    assert.equal(parseFlexSizeFraction("200px"), null);
    assert.equal(parseFlexSizeFraction("fit-content"), null);
    assert.equal(parseFlexSizeFraction(""), null);
  });

  it("detects horizontal flex layouts carefully", () => {
    assert.equal(isHorizontalFlexLayout({ orientation: "horizontal" }), true);
    assert.equal(isHorizontalFlexLayout({ type: "flex" }), true);
    assert.equal(
      isHorizontalFlexLayout({ type: "flex", orientation: "vertical" }),
      false,
    );
    assert.equal(isHorizontalFlexLayout({ type: "constrained" }), false);
  });

  it("resolveFlexItemWidthFraction requires % flexSize + horizontal parent", () => {
    assert.equal(
      resolveFlexItemWidthFraction({
        attrs: { style: { layout: { flexSize: "50%" } } },
        context: {
          parent: {
            attrs: { layout: { type: "flex", orientation: "horizontal" } },
          },
        },
      }),
      0.5,
    );
    assert.equal(
      resolveFlexItemWidthFraction({
        attrs: { style: { layout: { flexSize: "50%" } } },
        context: {
          parent: {
            attrs: { layout: { type: "flex", orientation: "vertical" } },
          },
        },
      }),
      null,
    );
  });

  it("withFlexItemWidthFraction is a no-op without a matching flex item", () => {
    const slot: LayoutSlot = {
      measureSize: "wide",
      subtractPad: true,
      padApplied: true,
      fractionByBreakpoint: { mobile: 1 },
    };
    assert.equal(withFlexItemWidthFraction(slot, {}), slot);
  });
});

describe("getLayoutSlotImageSizes", () => {
  it("inherits a wide ancestor measure for nested leaves without align", () => {
    const sizes = getLayoutSlotImageSizes(
      {
        context: {
          fromAncestors: {
            layoutSlot: {
              measureSize: "wide",
              subtractPad: true,
              padApplied: true,
              fractionByBreakpoint: { mobile: 1 },
            },
          },
          parent: { name: "acf/tabs" },
        },
      },
      { mobile: "100%", tablet: "50%" },
      container,
    );

    assert.match(sizes, /72rem/);
    assert.doesNotMatch(sizes, /56rem/);
    assert.match(sizes, /50 \/ 100|50%/);
  });

  it("uses the block's own wide measure at the root", () => {
    const sizes = getLayoutSlotImageSizes(
      { attrs: { align: "wide" } },
      { mobile: "100%", tablet: "50%" },
      container,
    );

    assert.match(sizes, /72rem/);
    assert.doesNotMatch(sizes, /56rem/);
  });

  it("emits vw fractions for full-bleed measures", () => {
    const sizes = getLayoutSlotImageSizes(
      { attrs: { align: "full" } },
      { mobile: "100%", tablet: "50%" },
      container,
    );

    assert.match(sizes, /50vw/);
    assert.doesNotMatch(sizes, /calc\(/);
  });
});

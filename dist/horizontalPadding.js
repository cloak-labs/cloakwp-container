import { breakpoints } from "@cloakui/responsive";
const prefixes = ["", "sm", "md", "lg", "xl", "2xl"];
/** Match the shared container gutter utilities and ordinary horizontal padding.
 * Store tokens, not CSS variables: sizes is evaluated before element CSS exists.
 */
export function withHorizontalPadding(slot, className) {
    if (!className)
        return slot;
    const declarations = [];
    for (const token of className.split(/\s+/)) {
        const parts = token.split(":");
        const utility = parts.pop();
        const bp = parts.length ? prefixes.indexOf(parts.join(":")) : 0;
        if (bp < 0)
            continue;
        const legacy = utility.match(/^cntr(?:-(wide|narrow))?-p([xlrse])$/);
        const match = utility.match(/^p([xlrse])-(gutter(?:-[\w-]+)?|\d+(?:\.\d+)?|\[(?:\d*\.)?\d+(?:px|rem|vw)\])$/);
        if (!legacy && !match)
            continue;
        const sides = legacy ? legacy[2] : match[1];
        const raw = legacy ? `gutter-${legacy[1] ?? "default"}` : match[2];
        const value = raw.startsWith("gutter")
            ? `gutter:${raw.slice(7) || "default"}`
            : raw.startsWith("[")
                ? raw.slice(1, -1)
                : `${Number(raw) * 0.25}rem`;
        declarations.push({ bp, sides, value });
    }
    if (!declarations.length)
        return slot;
    let left = "0px", right = "0px";
    const paddingByBreakpoint = {};
    breakpoints.forEach((bp, index) => {
        // px precedes side-specific overrides, matching Tailwind utility ordering.
        declarations
            .filter((d) => d.bp === index)
            .sort((a, b) => Number(a.sides !== "x") - Number(b.sides !== "x"))
            .forEach((d) => {
            if ("xls".includes(d.sides))
                left = d.value;
            if ("xre".includes(d.sides))
                right = d.value;
        });
        paddingByBreakpoint[bp] = [left, right];
    });
    return {
        ...slot,
        widthBasis: slot,
        clampSlot: undefined,
        fractionByBreakpoint: { mobile: 1 },
        paddingByBreakpoint,
    };
}

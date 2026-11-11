import { expect, type Locator } from "@playwright/test";

// Measure actual text lines as well as boxes: an ancestor's clipping can conceal
// overflow from document.scrollWidth, and inline spans can escape an h2's box.
export async function expectHorizontalFit(root: Locator) {
  const result = await root.evaluate((root) => {
    const issues: string[] = [];
    const scrollers = new Set<Element>();
    const identify = (element: Element) =>
      `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}.${element.getAttribute("class") || ""}`;
    for (const element of [root, ...root.querySelectorAll("*")]) {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      if (!box.width || !box.height || style.visibility === "hidden") continue;

      // The only deliberate horizontal crop: the native, swipeable scene strip.
      // Its viewport must fit, and every offscreen card must remain scrollable.
      const strip = element.closest(".environment-picker > div");
      if (strip && strip !== element && getComputedStyle(strip).overflowX === "auto") {
        scrollers.add(strip);
        continue;
      }
      if (box.left < -0.5 || box.right > innerWidth + 0.5)
        issues.push(`${identify(element)} box: ${box.left.toFixed(1)}…${box.right.toFixed(1)}`);
      if (
        element.clientWidth && element.scrollWidth > element.clientWidth + 1 &&
        !element.matches("input, .environment-picker > div")
      )
        issues.push(`${identify(element)} content: ${element.scrollWidth} > ${element.clientWidth}`);

      for (const node of element.childNodes) {
        if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const line of range.getClientRects()) {
          if (line.width && (line.left < -0.5 || line.right > innerWidth + 0.5))
            issues.push(`${identify(element)} text: ${node.textContent.trim()} (${line.left.toFixed(1)}…${line.right.toFixed(1)})`);
        }
      }
    }
    for (const strip of scrollers) {
      if (strip.scrollWidth <= strip.clientWidth)
        issues.push("Scene strip crops content without horizontal scrolling");
    }
    return { issues, width: innerWidth, scrollWidth: document.documentElement.scrollWidth };
  });
  expect(result.scrollWidth, "Document must fit without global overflow clipping").toBeLessThanOrEqual(result.width);
  expect(result.issues).toEqual([]);
}

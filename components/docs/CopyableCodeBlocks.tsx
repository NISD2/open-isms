"use client";

import { useEffect } from "react";

/**
 * Adds a copy button to every code block in the rendered article.
 *
 * The HTML comes from the markdown pipeline as a string, so there is no React
 * element to hang a button on. Rather than post-processing the HTML with
 * string surgery, the button is attached to the real DOM nodes after mount and
 * copies `textContent` — whatever Shiki actually rendered, not a second copy of
 * the source that could drift from it.
 */
export function CopyableCodeBlocks({ containerId }: { containerId: string }) {
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const cleanups: Array<() => void> = [];

    for (const pre of Array.from(container.querySelectorAll("pre"))) {
      if (pre.dataset.copyReady === "true") continue;
      pre.dataset.copyReady = "true";

      // The <code> child, not the <pre>: the button is appended inside the
      // <pre>, so pre.textContent would hand the reader their command with the
      // word "Copy" stuck on the end.
      const source = pre.querySelector("code") ?? pre;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "docs-copy-button";
      button.textContent = "Copy";
      button.setAttribute("aria-label", "Copy code to clipboard");

      const onClick = async () => {
        // navigator.clipboard is undefined outside a secure context, which is
        // exactly where a self-hoster reads these docs: their own instance on
        // plain http. Fall back rather than throw an unhandled rejection.
        const text = source.textContent ?? "";
        const copied = await navigator.clipboard
          ?.writeText(text)
          .then(() => true)
          .catch(() => false);

        button.textContent = copied ? "Copied" : "Select and copy";
        window.setTimeout(() => {
          button.textContent = "Copy";
        }, 1600);
      };

      button.addEventListener("click", onClick);
      pre.appendChild(button);

      cleanups.push(() => {
        button.removeEventListener("click", onClick);
        button.remove();
        delete pre.dataset.copyReady;
      });
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, [containerId]);

  return null;
}

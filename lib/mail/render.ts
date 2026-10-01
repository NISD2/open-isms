/**
 * Render a React Email component to the HTML that goes out. One place, so every email is rendered
 * the same way, and the builders in ./templates stay free of JSX.
 */
import { render } from "@react-email/render";
import { createElement, type FunctionComponent } from "react";

export function renderEmail<P extends object>(
  Email: FunctionComponent<P>,
  props: P,
): Promise<string> {
  return render(createElement(Email, props));
}

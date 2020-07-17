export { initWithRenderer } from "./core";
export { createElement } from "./create-element";
export { initRenderer } from "./renderer/renderer";

import R from "./nodes/rect";
export const Rect = R;

import { initWithRenderer } from "./core";
import { createElement } from "./create-element";
import { initRenderer } from "./renderer/renderer";

export default {
  initWithRenderer,
  initRenderer,
  Rect: R,
  createElement,
};

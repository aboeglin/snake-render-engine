export { initWithRenderer, reconcile, enhance } from "./core";
export { makeStore, withStore } from "./store";
export { createElement } from "./create-element";
export { initRenderer } from "./renderer/renderer";
export { onGlobalKeyPress, onGlobalKeyDown } from "./events";
export { default as withClock } from "./nodes/withClock";
export { default as Rect } from "./nodes/rect";

import { createElement } from "./create-element";
export default {
  createElement,
};

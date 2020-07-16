import { curry, pipe } from "ramda";
import { Spark } from "./spark";
import { createClock } from "./clock";
import { handleEvent, fromDOMEvent } from "./events";
import Rect from "./nodes/rect";

const defaultConfig = {
  clock: createClock(Date.now),
};

const throttle = curry((delay, fn) => {
  let timeout = null;
  return (...args) => {
    if (!timeout) {
      timeout = setTimeout(() => {
        fn(...args);
        timeout = null;
      }, delay);
    }
  };
});

const updateQueue = [];

export const pushUpdate = (spark) => {
  updateQueue.push(spark);
  processQueue();
};

// That needs debounce ...
const processQueue = throttle(200, () => {
  let sparkToUpdate;
  while ((sparkToUpdate = updateQueue.shift())) {
    if (sparkToUpdate.isDirty()) {
      reconcile({}, sparkToUpdate.getVNode());
    } else {
      console.log("SKIPPED");
    }
  }
});

const sparkleVNode = (vnode) => {
  if (vnode && !vnode._instance) {
    Object.defineProperty(vnode, "_instance", {
      value: Spark(vnode),
      configurable: true,
    });
  }
  return vnode._instance;
};

export const reconcile = curry((config, vnode) => {
  // We need that copy for the unmount, otherwise the tree is already mutated and we can't diff it anymore.
  const oldChildren = vnode.children ? [...vnode.children] : null;

  let instance = sparkleVNode(vnode);

  // Compute the children of the newNode
  const nextRender = instance.render(vnode) || [];

  // Render will return the same reference if it shouldn't be updated.
  if (nextRender === vnode.children) {
    return vnode;
  }

  vnode.children = nextRender;

  // If it's a core node, we assign what is rendered to the node directly.
  if (vnode.type._system) {
    vnode = vnode.children;
  }

  // We wrap children that are single objects in arrays for consistency
  if (!Array.isArray(vnode.children) && typeof vnode.children === "object") {
    vnode.children = [vnode.children];
  }

  if (Array.isArray(vnode.children)) {
    vnode.children.forEach((n, i) => {
      if (oldChildren[i] && oldChildren[i].type === n.type) {
        Object.defineProperty(n, "_instance", {
          value: oldChildren[i]._instance,
          configurable: true,
        });
      }
    });
  }

  // Check for unmounted
  if (oldChildren) {
    oldChildren.forEach((oldChild, i) => {
      const newChild = vnode.children[i];
      if (
        ((oldChild && !newChild) ||
          (newChild && newChild.type !== oldChild.type)) &&
        oldChild._instance
      ) {
        oldChild._instance.triggerUnmounted();
      }
    });
  }

  if (Array.isArray(vnode.children) && vnode.children.length > 0) {
    vnode.children = vnode.children.map(reconcile(config));
  }

  return vnode;
});

export const initWithRenderer = (container, render, config = defaultConfig) => {
  // We need to closure the vdom, so that event handlers act on what is currently rendered
  let tree = null;

  const wireEvent = pipe(
    fromDOMEvent(container),
    (event) => handleEvent(event, tree)
  );

  const start = (newTree) => {
    tree = reconcile(config, newTree);
  };

  container.addEventListener("click", wireEvent);

  return start;
};

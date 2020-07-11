import { curry, pipe } from "ramda";
import { Spark } from "./spark";
import { createClock } from "./clock";
import { handleEvent, fromDOMEvent } from "./events";

const defaultConfig = {
  clock: createClock(Date.now)
};

const updateQueue = [];

const pushUpdate = spark => {
  spark._dirty = true;

  queue.push(spark);

  processQueue();
};

// That needs debounce ...
const processQueue = () => {
  let sparkToUpdate;
  while ((sparkToUpdate = updateQueue.shift())) {
    reconcile({}, sparkToUpdate.getVNode());
    spark._dirty = false;
  }
};

const sparkleVNode = vnode => {
  if (vnode && !vnode.hasOwnProperty("_instance")) {
    Object.defineProperty(vnode, "_instance", {
      value: Spark(vnode),
      configurable: true
    });
  }

  return vnode._instance;
};

export const reconcile = curry((config, vnode) => {
  // We need that copy for the unmount, otherwise the tree is already mutated and we can't diff it anymore.
  const oldChildren = vnode.children ? [...vnode.children] : null;

  let instance = sparkleVNode(vnode);

  // Compute the children of the newNode
  if (vnode && instance.render) {
    vnode.children =
      instance.render(
        { ...vnode.props, children: vnode.children },
        {
          state: instance.getState(),
          setState: instance.setState,
          mounted: instance.mounted,
          unmounted: instance.unmounted
        }
      ) || [];
  } else {
    vnode.children = [];
  }

  // We wrap children that are single objects in arrays for consistency
  if (!Array.isArray(vnode.children) && typeof vnode.children === "object") {
    vnode.children = [vnode.children];
  }

  // Check for unmounted
  if (oldChildren) {
    oldChildren.forEach((oldChild, i) => {
      const newChild = vnode.children[i];
      if (
        (oldChild && !newChild) ||
        (newChild && newChild.type !== oldChild.type)
      ) {
        oldChild._instance.triggerUnmounted();
      }
    });
  }

  if (Array.isArray(vnode.children) && vnode.children.length > 0) {
    // Arrays will definitely need some special attention !
    vnode.children = vnode.children.map((n, i) => {
      return reconcile(config, n);
    });
    return vnode;
  }

  return vnode;
});

export const initWithRenderer = (container, render, config = defaultConfig) => {
  // We need to closure the vdom, so that event handlers act on what is currently rendered
  let tree = null;

  const wireEvent = pipe(
    fromDOMEvent(container),
    event => handleEvent(event, tree)
  );

  const start = newTree => {
    tree = reconcile(config, newTree);

    // render(tree);
    // requestAnimationFrame(() => start(nodeElement));
  };

  container.addEventListener("click", wireEvent);

  return start;
};

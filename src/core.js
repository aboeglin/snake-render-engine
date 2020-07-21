import { curry, pipe } from "ramda";
import { Spark } from "./spark";
import { createClock } from "./clock";
import { handleEvent, fromDOMEvent } from "./events";
import constants from "./constants";

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

const processQueue = throttle(constants.BATCH_UPDATE_INTERVAL, () => {
  let sparkToUpdate;
  while ((sparkToUpdate = updateQueue.shift())) {
    if (sparkToUpdate.isDirty()) {
      reconcile({}, sparkToUpdate.getVNode());
    }
  }
});

const sparkFromNode = (vnode) => {
  if (vnode && !vnode._instance) {
    Object.defineProperty(vnode, "_instance", {
      value: Spark(vnode),
      configurable: true,
      writable: false,
    });
  }
  return vnode._instance;
};

const sanitizeAndCopyChildren = (children) => {
  if (Array.isArray(children)) {
    return [...children];
  } else if (children) {
    return [children];
  }
  return [];
};

export const reconcile = curry((config, vnode) => {
  // We need that copy for the unmount, otherwise the tree is already mutated and we can't diff it anymore.
  const oldChildren = sanitizeAndCopyChildren(vnode.children);

  let instance = sparkFromNode(vnode);

  // Compute the children of the newNode
  const nextRender = instance.render(vnode) || [];

  // Render will return the same reference if it shouldn't be updated. Which happens if state and props
  // have not changed since the previous render.
  if (nextRender === vnode.children) {
    return vnode;
  }

  vnode.children = nextRender;

  // If it's a core node, we assign what is rendered to the node directly.
  if (vnode.type && vnode.type._system) {
    vnode = vnode.children;
  }

  // We wrap children that are single objects in arrays for consistency
  // TODO: Should this be just for objects ?
  // Before that should we record the initial children type so that later we
  // can separate between arrays which need keys and other types ?
  // Render could probably do that and set one of:
  // - CHILDREN_OBJECT
  // - CHILDREN_EMPTY
  // - CHILDREN_VALUE
  // - CHILDREN_ARRAY
  if (!Array.isArray(vnode.children) && typeof vnode.children === "object") {
    vnode.children = [vnode.children];
  }

  // Reassign instances of previous children to new children
  if (Array.isArray(vnode.children)) {
    vnode.children.forEach((newChild, i) => {
      const oldChild = findVNodeByKey(
        oldChildren,
        oldChildren[i],
        newChild.key
      );

      if (oldChild && oldChild.type === newChild.type) {
        Object.defineProperty(newChild, "_instance", {
          value: oldChild._instance,
          configurable: true,
          writable: false,
        });
      }
    });
  }

  // Check for unmounted
  oldChildren.forEach((oldChild, i) => {
    const newChild = findVNodeByKey(
      vnode.children,
      vnode.children[i],
      oldChild.key
    );

    if (
      (!newChild || (newChild && newChild.type !== oldChild.type)) &&
      oldChild._instance
    ) {
      oldChild._instance.triggerUnmounted();
    }
  });

  if (Array.isArray(vnode.children) && vnode.children.length > 0) {
    vnode.children = vnode.children.map(reconcile(config));
  }

  return vnode;
});

const findVNodeByKey = curry((children, fallback, key) =>
  key !== undefined ? children.find((x) => x.key === key) || fallback : fallback
);

export const initWithRenderer = (container, render, config = defaultConfig) => {
  // We need to closure the vdom, so that event handlers act on what is currently rendered
  let tree = null;

  const wireEvent = pipe(
    fromDOMEvent(container),
    (event) => handleEvent(event, tree)
  );

  const start = (vnode) => {
    tree = reconcile(config, vnode);

    renderLoop();
  };

  const renderLoop = () => {
    render(tree);
    requestAnimationFrame(renderLoop);
  };

  container.addEventListener("click", wireEvent);

  return start;
};

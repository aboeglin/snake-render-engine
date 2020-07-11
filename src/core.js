import { curry, pipe } from "ramda";
import { Node } from "./node";
import { createClock } from "./clock";
import { handleEvent, fromDOMEvent } from "./events";

const defaultConfig = {
  clock: createClock(Date.now),
};

export const traverse = curry((config, oldNode, newNode) => {
  // Retrieve or create node instance

  // We need that copy for the unmount, otherwise the tree is already mutated and we can't diff it anymore.
  const oldChildren = oldNode ? [...oldNode.children] : null;

  let instance;
  if (
    oldNode &&
    oldNode.hasOwnProperty("_instance") &&
    oldNode.type === newNode.type
  ) {
    instance = oldNode._instance;
    instance.setVNode(newNode);
  } else {
    instance = Node(newNode);
  }

  Object.defineProperty(newNode, "_instance", {
    value: instance,
    configurable: true,
  });


  // Compute the children of the newNode
  if (newNode && instance.render) {
    newNode.children =
      instance.render(
        { ...newNode.props, children: newNode.children },
        {
          state: newNode._instance.getState(),
          setState: newNode._instance.setState,
          mounted: newNode._instance.mounted,
          unmounted: newNode._instance.unmounted,
        }
      ) || [];
  } else {
    newNode.children = [];
  }

  // We wrap children that are single objects in arrays for consistency
  if (
    !Array.isArray(newNode.children) &&
    typeof newNode.children === "object"
  ) {
    newNode.children = [newNode.children];
  }

  // Check for unmounted
  if (oldChildren) {
    oldChildren.forEach((oldChild, i) => {
      const newChild = newNode.children[i];
      if (
        (oldChild && !newChild) ||
        (newChild && newChild.type !== oldChild.type)
      ) {
        oldChild._instance.triggerUnmounted();
      }
    });
  }

  if (Array.isArray(newNode.children) && newNode.children.length > 0) {
    // Arrays will definitely need some special attention !
    newNode.children = newNode.children.map((n, i) => {
      const oldChild = oldNode ? oldChildren[i] : null;
      return traverse(config, oldChild, n);
    });
    return newNode;
  }

  return newNode;
});

export const initWithRenderer = (container, render, config = defaultConfig) => {
  // We need to closure the vdom, so that event handlers act on what is currently rendered
  let tree = null;

  const wireEvent = pipe(
    fromDOMEvent(container),
    (event) => handleEvent(event, tree)
  );

  const start = (newTree) => {
    tree = traverse(config, tree, newTree);

    // render(tree);
    // requestAnimationFrame(() => start(nodeElement));
  };

  container.addEventListener("click", wireEvent);

  return start;
};

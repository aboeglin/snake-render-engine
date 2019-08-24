const { replaceRaf } = require("raf-stub");

const { traverse, initWithRenderer } = require("./core");
const { Node } = require("./node");

replaceRaf([global]);

describe("core", () => {
  const Scene = Node(() =>
    SomeOtherNode({
      children: [Rect({ x: 2, y: 3 }), Rect({ x: 5, y: 7 })]
    })
  );
  const Rect = Node(props => ({
    x: props.x,
    y: props.y
  }));
  const SomeOtherNode = Node(props => ({
    children: props.children
  }));

  test("It should export a traverse function", () => {
    expect(typeof traverse).toBe("function");
  });

  test("traverse should resolve the node given", () => {
    const SomeNode = Node(() => {});
    const node = jest.fn(SomeNode({}));
    traverse(node);
    expect(node.mock.calls.length).toBe(1);
  });

  test("traverse should return a tree of resolved nodes", () => {
    const expected = {
      children: [
        {
          children: [{ x: 2, y: 3, children: [] }, { x: 5, y: 7, children: [] }]
        }
      ]
    };

    const scene = Scene();
    const tree = traverse(scene);
    expect(tree).toEqual(expected);
  });

  test("traverse should be able to handle Nodes that return an array of NodeElements", () => {
    const Scene = Node(() => [Rect({ x: 2, y: 3 }), Rect({ x: 5, y: 7 })]);
    const Rect = Node(props => ({
      x: props.x,
      y: props.y
    }));

    const expected = {
      children: [{ x: 2, y: 3, children: [] }, { x: 5, y: 7, children: [] }]
    };

    const scene = Scene();
    const tree = traverse(scene);
    expect(tree).toEqual(expected);
  });

  test("It should export an initWithRenderer function", () => {
    expect(typeof initWithRenderer).toBe("function");
  });

  test("initWithRenderer should accept a renderer function called with the renderer node tree", done => {
    const expected = {
      children: [
        {
          children: [{ x: 2, y: 3, children: [] }, { x: 5, y: 7, children: [] }]
        }
      ]
    };
    const renderer = tree => {
      expect(tree).toEqual(expected);
      done();
    };

    const init = initWithRenderer(renderer);
    init(Scene());
  });

  test("initWithRenderer should accept a renderer function called with the renderer node tree on every requestAnimationFrame", () => {
    const expected = {
      children: [
        {
          children: [{ x: 2, y: 3, children: [] }, { x: 5, y: 7, children: [] }]
        }
      ]
    };
    const renderer = jest.fn();

    const init = initWithRenderer(renderer);
    init(Scene());

    requestAnimationFrame.step();

    expect(renderer).toHaveBeenNthCalledWith(2, expected);
  });
});

const { traverse } = require("./core");
const { Node } = require("./node");

describe("core", () => {
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
});

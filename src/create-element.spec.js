import { createElement } from "./create-element";

describe("createElement", () => {
  test("it should build a vnode object", () => {
    const SomeNode = (props) => {};

    const vnode = createElement(SomeNode, { someProp: "value" }, [
      "some child",
    ]);

    const expected = {
      type: SomeNode,
      props: {
        someProp: "value",
      },
      key: undefined,
      children: ["some child"],
    };

    expect(vnode).toEqual(expected);
  });

  test("it should handle empty props and children", () => {
    const SomeNode = () => {};

    const vnode = createElement(SomeNode);

    const expected = {
      type: SomeNode,
      props: {},
      key: undefined,
      children: [],
    };

    expect(vnode).toEqual(expected);
  });
});

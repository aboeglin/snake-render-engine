import Rect from "./rect";
import { Node } from "../node";
import { traverse } from "../core";
import { createClock } from "../clock";

const getTime = () => 500;
const clock = createClock(getTime);
const lifecycles = {
  mounted: () => {},
};
const config = { clock, lifecycles };

const configuredTraverse = traverse(config);

describe("Rect", () => {
  test("It should have a Rect function", () => {
    expect(typeof Rect).toBe("function");
  });

  test("The Rect function should build a rect js object", () => {
    const expected = {
      type: "RECT",
      x: 0,
      y: 0,
      z: 0,
      width: 5,
      height: 5,
      children: [],
    };

    const actual = configuredTraverse(
      Rect({
        x: 0,
        y: 0,
        z: 0,
        width: 5,
        height: 5,
        children: [],
      })
    );

    expect(actual).toEqual(expected);
  });

  test("The Rect function should take children", () => {
    const expected = {
      type: "RECT",
      x: 0,
      y: 0,
      z: 0,
      width: 5,
      height: 5,
      children: [
        {
          type: "RECT",
          x: 0,
          y: 0,
          z: 0,
          width: 5,
          height: 5,
          children: [],
        },
      ],
    };

    const actual = configuredTraverse(
      Rect({
        x: 0,
        y: 0,
        z: 0,
        width: 5,
        height: 5,
        children: [
          Rect({ x: 0, y: 0, z: 0, width: 5, height: 5, children: [] }),
        ],
      })
    );

    expect(actual).toEqual(expected);
  });

  test("The node functions should be able to render custom logic nodes", () => {
    const expected = {
      children: [
        {
          type: "RECT",
          x: 1,
          y: 1,
          z: 1,
          width: 5,
          height: 5,
          children: [],
        },
      ],
    };

    const CustomNode = Node((props) =>
      Rect({
        x: props.x / 2,
        y: props.y / 2,
        z: props.z / 2,
        width: props.width / 2,
        height: props.height / 2,
        children: [],
      })
    );

    const actual = configuredTraverse(
      CustomNode({
        x: 2,
        y: 2,
        z: 2,
        width: 10,
        height: 10,
        children: [],
      })
    );

    expect(actual).toEqual(expected);
  });
});

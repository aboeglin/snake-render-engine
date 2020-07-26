import Rect from "./rect";
import { reconcile } from "../core";
import { createElement } from "../create-element";
import { createClock } from "../clock";

/** @jsx createElement */

const getTime = () => 500;
const clock = createClock(getTime);
const lifecycles = {
  mounted: () => {},
  unmounted: () => {},
};
const config = { clock, lifecycles };

const configuredReconcile = reconcile(config);

describe("Rect", () => {
  test("It should have a Rect function", () => {
    expect(typeof Rect).toBe("function");
  });

  test("The Rect function should build a rect js object", () => {
    const expected = {
      type: "RECT",
      props: { x: 0, y: 0, z: 0, width: 5, height: 5, onClick: undefined },
      children: [],
    };

    const actual = configuredReconcile(
      <Rect x={0} y={0} z={0} width={5} height={5} />
    );

    expect(actual).toEqual(expected);
  });

  test("The Rect function should take children", () => {
    const expected = {
      type: "RECT",
      props: { x: 0, y: 0, z: 0, width: 5, height: 5, onClick: undefined },
      children: [
        {
          type: "RECT",
          props: {
            x: 0,
            y: 0,
            z: 0,
            width: 15,
            height: 15,
            onClick: undefined,
          },
          children: [],
        },
      ],
    };

    const actual = configuredReconcile(
      <Rect x={0} y={0} z={0} width={5} height={5}>
        <Rect x={0} y={0} z={0} width={15} height={15} />
      </Rect>
    );
    expect(actual).toEqual(expected);
  });

  test("The node functions should be able to render custom logic nodes", () => {
    const CustomNode = (props) => (
      <Rect
        x={props.x / 2}
        y={props.y / 2}
        z={props.z / 2}
        width={props.width / 2}
        height={props.height / 2}
      />
    );

    const expected = {
      type: CustomNode,
      props: {
        x: 2,
        y: 2,
        z: 2,
        width: 10,
        height: 10,
      },
      children: [
        {
          type: "RECT",
          props: { x: 1, y: 1, z: 1, width: 5, height: 5 },
          children: [],
        },
      ],
    };

    const actual = configuredReconcile(
      <CustomNode x={2} y={2} z={2} width={10} height={10} />
    );

    expect(actual).toEqual(expected);
  });
});

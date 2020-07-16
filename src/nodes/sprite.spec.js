import Sprite from "./sprite";
import { reconcile } from "../core";
import { createElement } from "../create-element";
import { createClock } from "../clock";

const getTime = () => 500;
const clock = createClock(getTime);
const lifecycles = {
  mounted: () => {},
  unmounted: () => {},
};
const config = { clock, lifecycles };

const configuredReconcile = reconcile(config);

describe("Sprite", () => {
  test("It should have a Sprite function", () => {
    expect(typeof Sprite).toBe("function");
  });

  test("The Sprite function should build a sprite js object", () => {
    const expected = {
      type: "SPRITE",
      x: 0,
      y: 0,
      z: 0,
      width: 5,
      height: 5,
      texture: {
        width: 100,
        height: 100,
        data: [],
      },
      children: [],
    };

    const actual = configuredReconcile(
      createElement(Sprite, {
        x: 0,
        y: 0,
        z: 0,
        width: 5,
        height: 5,
        // TODO: verify that texture is complete
        texture: {
          width: 100,
          height: 100,
          data: [],
        },
      })
    );

    expect(actual).toEqual(expected);
  });
});

const makeGL = require("gl");
const { toMatchImageSnapshot } = require("jest-image-snapshot");

const { initRenderer } = require("./renderer");
const { makeSnapshot } = require("./test-utils");

expect.extend({ toMatchImageSnapshot });

const VIEWPORT_WIDTH = 128;
const VIEWPORT_HEIGHT = 128;

let gl = null;

describe("renderer", () => {
  beforeAll(() => {
    gl = makeGL(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  });

  afterAll(() => {
    gl.getExtension("STACKGL_destroy_context").destroy();
  });

  test("It should export a initRenderer constructor", () => {
    expect(typeof initRenderer).toBe("function");
  });

  test("initRenderer should accept a context", () => {
    expect(initRenderer.length).toBe(1);
  });

  test("initRenderer should return the renderer function", () => {
    expect(typeof initRenderer({ gl })).toBe("function");
  });

  test("initRenderer should throw if no context is given", () => {
    expect(() => initRenderer()).toThrow();
  });

  test("renderer should render a Rect", done => {
    const renderer = initRenderer({
      gl,
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT
    });
    const rect = {
      type: "RECT",
      x: 72,
      y: 39,
      z: 0,
      width: 80,
      height: 14,
      children: []
    };

    renderer(rect);

    makeSnapshot(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT).then(ss => {
      expect(ss).toMatchImageSnapshot();
      done();
    });
  });

  test("renderer should render a Rect with rotation", done => {
    const renderer = initRenderer({
      gl,
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT
    });
    const scene = {
      type: "TRANSFORM",
      rotation: 30,
      children: [
        {
          type: "RECT",
          x: 72,
          y: 39,
          z: 0,
          width: 80,
          height: 14,
          children: []
        }
      ]
    };

    renderer(scene);

    makeSnapshot(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT).then(ss => {
      expect(ss).toMatchImageSnapshot();
      done();
    });
  });
});

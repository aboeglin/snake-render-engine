const makeGL = require("gl");
const { toMatchImageSnapshot } = require("jest-image-snapshot");
const fs = require("fs");
const PNG = require("pngjs").PNG;

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

  test("renderer should apply rotation to grand children", done => {
    const renderer = initRenderer({
      gl,
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT
    });
    const scene = {
      type: "TRANSFORM",
      rotation: 60,
      children: [
        {
          type: "RECT",
          x: 72,
          y: 39,
          z: 0,
          width: 80,
          height: 14,
          children: [
            {
              type: "TRANSFORM",
              rotation: 0,
              children: [
                {
                  type: "RECT",
                  x: 10,
                  y: 40,
                  z: 0,
                  width: 20,
                  height: 20
                }
              ]
            }
          ]
        }
      ]
    };

    renderer(scene);

    makeSnapshot(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT).then(ss => {
      expect(ss).toMatchImageSnapshot();
      done();
    });
  });

  test("renderer should apply translation to grand children", done => {
    const renderer = initRenderer({
      gl,
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT
    });
    const scene = {
      type: "TRANSFORM",
      rotation: 60,
      translationX: 30,
      children: [
        {
          type: "RECT",
          x: 72,
          y: 39,
          z: 0,
          width: 80,
          height: 14,
          children: [
            {
              type: "TRANSFORM",
              translationX: 10,
              translationY: 10,
              rotation: 30,
              children: [
                {
                  type: "RECT",
                  x: 10,
                  y: 40,
                  z: 0,
                  width: 20,
                  height: 20
                }
              ]
            }
          ]
        }
      ]
    };

    renderer(scene);

    makeSnapshot(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT).then(ss => {
      expect(ss).toMatchImageSnapshot();
      done();
    });
  });

  test("renderer should render static sprites", done => {
    const data = fs.readFileSync("./fixtures/sprite.png");
    const image = PNG.sync.read(data);
    const pixels = [];

    for (var y = 0; y < image.height; y++) {
      for (var x = 0; x < image.width; x++) {
        var idx = (image.width * y + x) << 2;

        pixels[idx] = image.data[idx];
        pixels[idx + 1] = image.data[idx + 1];
        pixels[idx + 2] = image.data[idx + 2];
        pixels[idx + 3] = image.data[idx + 3];
      }
    }

    image.data = pixels;

    const renderer = initRenderer({
      gl,
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT
    });
    const scene = {
      type: "SPRITE",
      texture: image,
      children: [],
      x: 40,
      y: 40,
      z: 0,
      width: 40,
      height: 40
    };

    renderer(scene);

    makeSnapshot(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT).then(ss => {
      expect(ss).toMatchImageSnapshot();
      done();
    });
  });
});

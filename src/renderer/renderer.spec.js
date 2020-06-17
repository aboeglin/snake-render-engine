const makeGL = require("gl");
const { toMatchImageSnapshot } = require("jest-image-snapshot");
const fs = require("fs");
const PNG = require("pngjs").PNG;

const { initRenderer } = require("./renderer");
const { makeSnapshot } = require("../test-utils");

expect.extend({ toMatchImageSnapshot });

const VIEWPORT_WIDTH = 128;
const VIEWPORT_HEIGHT = 128;

let gl = null;

const loadImage = (path) => {
  const data = fs.readFileSync(path);
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

  return image;
};

const enhanceGL = (gl) => {
  if (gl.__PATCHED__) return gl;
  gl.__PATCHED__ = true;

  let textureCount = 0;
  const createTexture = gl.createTexture;

  gl.createTexture = () => {
    textureCount = textureCount + 1;
    return createTexture();
  };

  gl.getTextureCount = () => textureCount;
  return gl;
};

describe("renderer", () => {
  beforeAll(() => {
    gl = enhanceGL(enhanceGL(makeGL(VIEWPORT_WIDTH, VIEWPORT_HEIGHT)));
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

  test("renderer should render a Rect", (done) => {
    const render = initRenderer({
      gl,
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT,
    });
    const rect = {
      type: "RECT",
      x: 72,
      y: 39,
      z: 0,
      width: 80,
      height: 14,
      children: [],
    };

    render(rect);

    makeSnapshot(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT).then((ss) => {
      expect(ss).toMatchImageSnapshot({
        failureThreshold: 0.002,
        failureThresholdType: "percent",
      });
      done();
    });
  });

  test("renderer should render a Rect with rotation", (done) => {
    const render = initRenderer({
      gl,
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT,
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
          children: [],
        },
      ],
    };

    render(scene);

    makeSnapshot(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT).then((ss) => {
      expect(ss).toMatchImageSnapshot({
        failureThreshold: 0.002,
        failureThresholdType: "percent",
      });
      done();
    });
  });

  test("renderer should apply rotation to grand children", (done) => {
    const render = initRenderer({
      gl,
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT,
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
                  height: 20,
                },
              ],
            },
          ],
        },
      ],
    };

    render(scene);

    makeSnapshot(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT).then((ss) => {
      expect(ss).toMatchImageSnapshot({
        failureThreshold: 0.002,
        failureThresholdType: "percent",
      });
      done();
    });
  });

  test("renderer should apply translation to grand children", (done) => {
    const render = initRenderer({
      gl,
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT,
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
                  height: 20,
                },
              ],
            },
          ],
        },
      ],
    };

    render(scene);

    makeSnapshot(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT).then((ss) => {
      expect(ss).toMatchImageSnapshot({
        failureThreshold: 0.002,
        failureThresholdType: "percent",
      });
      done();
    });
  });

  test("renderer should render static sprites", (done) => {
    const image = loadImage("./fixtures/sprite.png");

    const render = initRenderer({
      gl,
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT,
    });
    const scene = {
      type: "SPRITE",
      texture: image,
      children: [],
      x: 40,
      y: 40,
      z: 0,
      width: 40,
      height: 40,
    };

    render(scene);

    makeSnapshot(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT).then((ss) => {
      expect(ss).toMatchImageSnapshot();
      done();
    });
  });

  test("sprites should share textures when based on the same data", () => {
    const image = loadImage("./fixtures/sprite.png");

    const render = initRenderer({
      gl,
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT,
    });
    const scene = {
      children: [
        {
          type: "SPRITE",
          texture: image,
          children: [],
          x: 40,
          y: 40,
          z: 0,
          width: 40,
          height: 40,
        },
        {
          type: "SPRITE",
          texture: image,
          children: [],
          x: 40,
          y: 40,
          z: 0,
          width: 40,
          height: 40,
        },
      ],
    };

    const expected = gl.getTextureCount() + 1;

    render(scene);

    const actual = gl.getTextureCount();

    expect(actual).toEqual(expected);
  });
});

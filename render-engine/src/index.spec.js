const makeGL = require("gl");
const ndArray = require("ndarray");
const savePixels = require("save-pixels");
const { toMatchImageSnapshot } = require("jest-image-snapshot");

expect.extend({ toMatchImageSnapshot });

const SRE = require("./index");

const VIEWPORT_WIDTH = 128;
const VIEWPORT_HEIGHT = 128;

describe("render engine", () => {
  describe("render", () => {
    test("It should have a render function", () => {
      expect(typeof SRE.render).toBe("function");
    });

    test("It should be able to render rects", done => {
      const gl = makeGL(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
      const rect = SRE.Rect({ x: 32, y: 32, z: 0, width: 64 });
      SRE.init(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
      SRE.render(gl, rect);

      makeSnapshot(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT).then(ss => {
        expect(ss).toMatchImageSnapshot();
        gl.getExtension("STACKGL_destroy_context").destroy();
        done();
      });
    });
  });

  describe("Rect", () => {
    test("It should have a Rect function", () => {
      expect(typeof SRE.Rect).toBe("function");
    });

    test("The Rect function should build a rect js object", () => {
      const expected = {
        type: "RECTANGLE",
        position: { x: 0, y: 0, z: 0, width: 5 },
        children: []
      };

      const actual = SRE.Rect({ x: 0, y: 0, z: 0, width: 5 });

      expect(actual).toEqual(expected);
    });

    test("The Rect function should take children", () => {
      const expected = {
        type: "RECTANGLE",
        position: { x: 0, y: 0, z: 0, width: 5 },
        children: [
          {
            type: "RECTANGLE",
            position: { x: 0, y: 0, z: 0, width: 5 },
            children: []
          }
        ]
      };

      const actual = SRE.Rect({ x: 0, y: 0, z: 0, width: 5 }, [
        SRE.Rect({ x: 0, y: 0, z: 0, width: 5 })
      ]);

      expect(actual).toEqual(expected);
    });

    test("The node functions should be able to render custom logic nodes", () => {
      const expected = {
        type: "RECTANGLE",
        position: { x: 1, y: 1, z: 1, width: 5 },
        children: []
      };

      const customElement = props =>
        SRE.Rect({
          x: props.x / 2,
          y: props.y / 2,
          z: props.z / 2,
          width: props.width / 2
        });

      const actual = customElement({ x: 2, y: 2, z: 2, width: 10 });

      expect(actual).toEqual(expected);
    });

    test("Rect should take a props param that bundles all info about the rect", () => {
      const expected = {
        type: "RECTANGLE",
        position: { x: 2, y: 2, z: 0, width: 5 },
        children: []
      };

      const actual = SRE.Rect({ x: 2, y: 2, z: 0, width: 5 });

      expect(actual).toEqual(expected);
    });
  });

  describe("init", () => {
    test("init should set a black background", done => {
      const gl = makeGL(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

      SRE.init(gl);

      makeSnapshot(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT).then(ss => {
        expect(ss).toMatchImageSnapshot();
        gl.getExtension("STACKGL_destroy_context").destroy();
        done();
      });
    });

    test("It should take a viewport width and height", done => {
      const gl = makeGL(VIEWPORT_WIDTH * 2, VIEWPORT_HEIGHT * 2);
      const rect = SRE.Rect({ x: 192, y: 0, z: 0, width: 64 });
      SRE.init(gl, VIEWPORT_WIDTH * 2, VIEWPORT_HEIGHT * 2);
      SRE.render(gl, rect);

      makeSnapshot(gl, VIEWPORT_WIDTH * 2, VIEWPORT_HEIGHT * 2).then(ss => {
        expect(ss).toMatchImageSnapshot();
        gl.getExtension("STACKGL_destroy_context").destroy();
        done();
      });
    });
  });
});

const makeSnapshot = (gl, width, height) => {
  return new Promise((resolve, reject) => {
    const canvasPixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, canvasPixels);
    var nd = ndArray(canvasPixels, [width, height, 4]);

    const chunks = [];
    const reader = savePixels(nd, ".png");
    reader.on("data", chunk => {
      chunks.push(chunk);
    });

    reader.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
  });
};

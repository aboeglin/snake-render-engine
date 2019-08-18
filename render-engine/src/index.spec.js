const makeGL = require("gl");
const ndArray = require("ndarray");
const savePixels = require("save-pixels");
const { toMatchImageSnapshot } = require("jest-image-snapshot");
const { replaceRaf } = require("raf-stub");

expect.extend({ toMatchImageSnapshot });

replaceRaf([global]);

const SRE = require("./index");
const Rect = require("./Rect");

const VIEWPORT_WIDTH = 128;
const VIEWPORT_HEIGHT = 128;

const gl = makeGL(VIEWPORT_WIDTH, VIEWPORT_HEIGHT, {
  preserveDrawingBuffer: true
});

Array(100)
  .fill({})
  .forEach(_ =>
    makeGL(VIEWPORT_WIDTH, VIEWPORT_HEIGHT, {
      preserveDrawingBuffer: true
    })
  );

describe("render engine", () => {
  describe("render", () => {
    test("It should have a render function", () => {
      expect(typeof SRE.render).toBe("function");
    });

    test("It should be able to render rects", done => {
      const Scene = props =>
        Rect(
          {
            x: 32,
            y: 32,
            z: 0,
            width: 64
          },
          []
        );
      SRE.init(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, Scene);

      makeSnapshot(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT).then(ss => {
        expect(ss).toMatchImageSnapshot();
        // gl.getExtension("STACKGL_destroy_context").destroy();
        done();
      });
    });
  });

  describe("init", () => {
    test("init should set a black background", done => {
      const Scene = props =>
        Rect({ x: 192, y: 0, z: 0, width: 64, children: [] });

      SRE.init(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, Scene);

      makeSnapshot(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT).then(ss => {
        expect(ss).toMatchImageSnapshot();
        // gl.getExtension("STACKGL_destroy_context").destroy();
        done();
      });
    });

    test("It should take a viewport width and height", done => {
      const gl = makeGL(VIEWPORT_WIDTH * 2, VIEWPORT_HEIGHT * 2);

      const Scene = props =>
        Rect({ x: 192, y: 0, z: 0, width: 64, children: [] });
      SRE.init(gl, VIEWPORT_WIDTH * 2, VIEWPORT_HEIGHT * 2, Scene);

      makeSnapshot(gl, VIEWPORT_WIDTH * 2, VIEWPORT_HEIGHT * 2).then(ss => {
        expect(ss).toMatchImageSnapshot();
        // gl.getExtension("STACKGL_destroy_context").destroy();
        done();
      });
    });
  });

  describe("Scene", () => {
    test("init should take a scene and render a black background", done => {
      const Scene = props => {};
      SRE.init(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, Scene);

      makeSnapshot(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT).then(ss => {
        expect(ss).toMatchImageSnapshot();
        // gl.getExtension("STACKGL_destroy_context").destroy();
        done();
      });
    });

    test("It should render what is in the scene", done => {
      // const gl = makeGL(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

      const Scene = props =>
        Rect(
          {
            x: 32,
            y: 32,
            z: 0,
            width: 64
          },
          []
        );

      SRE.init(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, Scene);

      makeSnapshot(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT).then(ss => {
        expect(ss).toMatchImageSnapshot();
        // gl.getExtension("STACKGL_destroy_context").destroy();
        done();
      });
    });

    test("It should move object when position changes from one render to another", done => {
      let calls = -1;
      const Scene = props => {
        calls = calls + 1;
        console.log(calls);
        return Rect(
          {
            x: 32 + calls * 32,
            y: 32,
            z: 0,
            width: 64
          },
          []
        );
      };

      SRE.init(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, Scene);
      requestAnimationFrame.step();

      makeSnapshot(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT).then(ss => {
        expect(ss).toMatchImageSnapshot();
        // gl.getExtension("STACKGL_destroy_context").destroy();
        done();
      });
      // });
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

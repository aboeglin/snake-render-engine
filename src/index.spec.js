const makeGL = require("gl");
const { toMatchImageSnapshot } = require("jest-image-snapshot");
const { replaceRaf } = require("raf-stub");

const { makeSnapshot } = require("./test-utils");

expect.extend({ toMatchImageSnapshot });

replaceRaf([global]);

const SRE = require("./index");
const Rect = require("./Rect");

const VIEWPORT_WIDTH = 128;
const VIEWPORT_HEIGHT = 128;

let gl = null;
let gl256 = null;

describe("render engine", () => {
  beforeAll(() => {
    gl = makeGL(VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

    gl256 = makeGL(VIEWPORT_WIDTH * 2, VIEWPORT_HEIGHT * 2);
  });

  afterAll(() => {
    gl.getExtension("STACKGL_destroy_context").destroy();
    gl256.getExtension("STACKGL_destroy_context").destroy();
  });

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
      done();
    });
  });

  describe("init", () => {
    test("init should set a black background", done => {
      const Scene = props =>
        Rect({ x: 192, y: 0, z: 0, width: 64, children: [] });

      SRE.init(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, Scene);

      makeSnapshot(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT).then(ss => {
        expect(ss).toMatchImageSnapshot();
        done();
      });
    });

    test("init should take a viewport width and height", done => {
      // const gl = makeGL(VIEWPORT_WIDTH * 2, VIEWPORT_HEIGHT * 2);

      const Scene = props =>
        Rect({ x: 192, y: 0, z: 0, width: 64, children: [] });
      SRE.init(gl256, VIEWPORT_WIDTH * 2, VIEWPORT_HEIGHT * 2, Scene);

      makeSnapshot(gl256, VIEWPORT_WIDTH * 2, VIEWPORT_HEIGHT * 2).then(ss => {
        expect(ss).toMatchImageSnapshot();
        done();
      });
    });
  });

  test("init should take a scene and render a black background", done => {
    const Scene = props => {};
    SRE.init(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, Scene);

    makeSnapshot(gl, VIEWPORT_WIDTH, VIEWPORT_HEIGHT).then(ss => {
      expect(ss).toMatchImageSnapshot();
      done();
    });
  });

  test("It should render what is in the scene", done => {
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
      done();
    });
  });

  test("It should move object when position changes from one render to another", done => {
    let calls = -1;
    const Scene = props => {
      calls = calls + 1;
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
      done();
    });
  });
});

const makeGL = require("gl");
const ndArray = require("ndarray");
const savePixels = require("save-pixels");
const { toMatchImageSnapshot } = require("jest-image-snapshot");

expect.extend({ toMatchImageSnapshot });

const SRE = require("./index");

describe("render engine", () => {
  test("It should have a render function", () => {
    expect(typeof SRE.render).toBe("function");
  });

  test("It should have a rect function", done => {
    SRE.render(props => {
      expect(typeof SRE.rect).toBe("function");
      done();
    });
  });

  test("The rect function provided by render should build a rect", () => {
    const expected = {
      type: "RECTANGLE",
      position: { x: 0, y: 0, z: 0, width: 5 },
      children: []
    };

    const actual = SRE.render(props =>
      SRE.rect({ x: 0, y: 0, z: 0, width: 5 })
    );

    expect(actual).toEqual(expected);
  });

  test("The rect function should take children", () => {
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

    const actual = SRE.render(props =>
      SRE.rect({ x: 0, y: 0, z: 0, width: 5 }, [
        SRE.rect({ x: 0, y: 0, z: 0, width: 5 })
      ])
    );

    expect(actual).toEqual(expected);
  });

  test("The render function should be able to render custom logic nodes", () => {
    const expected = {
      type: "RECTANGLE",
      position: { x: 1, y: 1, z: 1, width: 5 },
      children: []
    };

    const customElement = props =>
      SRE.rect({
        x: props.x / 2,
        y: props.y / 2,
        z: props.z / 2,
        width: props.width / 2
      });

    const actual = SRE.render(props =>
      customElement({ x: 2, y: 2, z: 2, width: 10 })
    );

    expect(actual).toEqual(expected);
  });

  test("It should have a circle function", done => {
    SRE.render(props => {
      expect(typeof SRE.circle).toBe("function");
      done();
    });
  });

  test("rect should take a props param that bundles all info about the rect", () => {
    const expected = {
      type: "RECTANGLE",
      position: { x: 2, y: 2, z: 0, width: 5 },
      children: []
    };

    const actual = SRE.render(props =>
      SRE.rect({ x: 2, y: 2, z: 0, width: 5 })
    );

    expect(actual).toEqual(expected);
  });

  describe("init", () => {
    test("init should set a black background", done => {
      const gl = makeGL(128, 128);
      SRE.init(gl);

      makeSnapshot(gl).then(ss => {
        expect(ss).toMatchImageSnapshot();
        done();
      });
    });
  });
});

const makeSnapshot = gl => {
  return new Promise((resolve, reject) => {
    const canvasPixels = new Uint8Array(128 * 128 * 4);
    gl.readPixels(0, 0, 128, 128, gl.RGBA, gl.UNSIGNED_BYTE, canvasPixels);
    var nd = ndArray(canvasPixels, [128, 128, 4]);

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

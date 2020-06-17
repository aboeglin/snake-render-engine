const { curry, propOr, insert, append } = require("ramda");
const { mat4, glMatrix } = require("gl-matrix");

const {
  FRAGMENT_SHADER_COLOR,
  FRAGMENT_SHADER_TEXTURE,
  VERTEX_SHADER,
} = require("./shaders");

/**
 * Move this to shaders ? With sanity tests that check that shaders build properly ?
 */
const createColorProgram = (gl) => {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, VERTEX_SHADER);
  gl.compileShader(vs);

  const fsc = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fsc, FRAGMENT_SHADER_COLOR);
  gl.compileShader(fsc);

  program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fsc);
  gl.linkProgram(program);

  program.uColor = gl.getUniformLocation(program, "uColor");
  program.uMatrix = gl.getUniformLocation(program, "uMatrix");
  program.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");

  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
    console.log(gl.getShaderInfoLog(vs));

  if (!gl.getShaderParameter(fsc, gl.COMPILE_STATUS))
    console.log(gl.getShaderInfoLog(fsc));

  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    console.log(gl.getProgramInfoLog(program));

  return program;
};

const createTextureProgram = (gl) => {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, VERTEX_SHADER);
  gl.compileShader(vs);

  const fst = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fst, FRAGMENT_SHADER_TEXTURE);
  gl.compileShader(fst);

  program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fst);
  gl.linkProgram(program);

  program.uMatrix = gl.getUniformLocation(program, "uMatrix");
  program.uTexture = gl.getUniformLocation(program, "uTexture");
  program.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
  program.aTextureCoord = gl.getAttribLocation(program, "aTextureCoord");

  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
    console.log(gl.getShaderInfoLog(vs));

  if (!gl.getShaderParameter(fst, gl.COMPILE_STATUS))
    console.log(gl.getShaderInfoLog(fst));

  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    console.log(gl.getProgramInfoLog(program));

  return program;
};

const initRenderer = ({ gl, width, height }) => {
  if (gl === undefined) {
    throw new Error("You must provide a context !");
  }

  gl.viewport(0, 0, width, height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const programs = {
    color: createColorProgram(gl),
    texture: createTextureProgram(gl),
  };

  const projectionMatrix = makeProjectionMatrix(width, height);

  return renderer({ gl, programs, matrices: [projectionMatrix] });
};

const computeMatrixStack = (matrices) => [
  matrices.reduce((final, mat) => mat4.multiply([], final, mat), mat4.create()),
];

const renderer = curry(({ gl, programs, matrices }, root) => {
  let nextMatrices = matrices;

  if (root.type === "RECT") {
    nextMatrices = insert(
      1,
      mat4.fromTranslation([], [root.x, root.y, root.z]),
      nextMatrices
    );
    nextMatrices = computeMatrixStack(nextMatrices);
    renderRect({ gl, program: programs.color, matrix: nextMatrices[0] }, root);
  } else if (root.type === "TRANSFORM") {
    nextMatrices = handleTransformNode(nextMatrices, root);
  } else if (root.type === "SPRITE") {
    nextMatrices = insert(
      1,
      mat4.fromTranslation([], [root.x, root.y, root.z]),
      nextMatrices
    );
    nextMatrices = computeMatrixStack(nextMatrices);
    renderSprite(
      { gl, program: programs.texture, matrix: nextMatrices[0] },
      root
    );
  }

  propOr([], "children", root).forEach((node) =>
    renderer({ gl, programs, matrices: nextMatrices }, node)
  );
});

const textures = new WeakMap();

const renderSprite = ({ gl, program, matrix }, root) => {
  /**
   * Keep a cache of textures and only create it and use texImage2D when it's not cached.
   * Otherwise read from cache. All this logic should be in a separate function ( getTexture ? ).
   * The key of the cache could be the path to the asset.
   * And then further down we could just bind the texture retrieded from cache or created.
   */

  // Get the block in the if out in a function / module that handles closuring to access textures and remove global.
  if (!textures.get(root.texture.data)) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixels = new Uint8Array(root.texture.data);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      root.texture.width,
      root.texture.height,
      border,
      srcFormat,
      srcType,
      pixels
    );

    textures.set(root.texture.data, texture);
  }

  gl.useProgram(program);

  const textCoords = new Float32Array(getTextCoords());
  const tbuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, textCoords, gl.STATIC_DRAW);

  const vertices = new Float32Array(
    rectToVertexArr({
      width: 40,
      height: 40,
      z: 0,
    })
  );

  const vbuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(program.aVertexPosition);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
  gl.vertexAttribPointer(program.aVertexPosition, 3, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(program.aTextureCoord);
  gl.bindBuffer(gl.ARRAY_BUFFER, tbuffer);
  gl.vertexAttribPointer(program.aTextureCoord, 2, gl.FLOAT, false, 0, 0);

  gl.uniformMatrix4fv(program.uMatrix, false, matrix);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, textures.get(root.texture.data));
  gl.uniform1i(program.uTexture, 0);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
};

const handleTransformNode = curry((matrices, node) => {
  let result = matrices;
  if (node.translationX || node.translationX) {
    result = append(
      mat4.fromTranslation(
        [],
        [node.translationX || 0, node.translationY || 0, 0]
      ),
      result
    );
  }
  if (node.rotation) {
    result = append(
      mat4.fromRotation([], glMatrix.toRadian(node.rotation), [0, 0, 1]),
      result
    );
  }
  return result;
});

const makeProjectionMatrix = curry((viewportWidth, viewportHeight) => {
  const orthoMat = mat4.ortho([], 0, viewportWidth, 0, viewportHeight, 0, 1000);
  // We need the rotation in order to get the x axis horizontal
  const rotationMat = mat4.fromRotation([], Math.PI / 2, [0, 0, 1]);
  return mat4.multiply([], rotationMat, orthoMat);
});

const renderRect = curry(({ gl, program, matrix }, rect) => {
  const vertices = new Float32Array(rectToVertexArr(rect));

  const vbuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  gl.useProgram(program);

  gl.enableVertexAttribArray(program.aVertexPosition);

  // Set color
  gl.uniform4fv(program.uColor, [1.0, 1.0, 0.0, 1.0]);
  // Add fourth vertex value
  gl.vertexAttribPointer(program.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
  // Add fourth vertex value
  gl.uniformMatrix4fv(program.uMatrix, false, matrix);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
});

const rectToVertexArr = (rect) => [
  -rect.width / 2,
  -rect.height / 2,
  rect.z,

  -rect.width / 2,
  rect.height / 2,
  rect.z,

  rect.width / 2,
  rect.height / 2,
  rect.z,

  rect.width / 2,
  rect.height / 2,
  rect.z,

  rect.width / 2,
  -rect.height / 2,
  rect.z,

  -rect.width / 2,
  -rect.height / 2,
  rect.z,
];

/**
 * Will need to be adapted depending on offset and countX, countY
 */
const getTextCoords = () => [
  0.0,
  0.0,

  0.0,
  1.0,

  1.0,
  1.0,

  1.0,
  1.0,

  1.0,
  0.0,

  0.0,
  0.0,
];

module.exports = { initRenderer };

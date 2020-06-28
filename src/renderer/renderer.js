import { curry, propOr, insert, append } from "ramda";
import { mat4, glMatrix } from "gl-matrix";

import { createColorProgram, createTextureProgram } from "./programs";
import { makeTextureHandler } from "./textures";

export const initRenderer = ({ gl, width, height }) => {
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
  const getTexture = makeTextureHandler(gl);
  const projectionMatrix = makeProjectionMatrix(width, height);

  return render({ gl, programs, getTexture, matrices: [projectionMatrix] });
};

const computeMatrixStack = (matrices) => [
  matrices.reduce((final, mat) => mat4.multiply([], final, mat), mat4.create()),
];

// TODO: add transform relative or absolute ( currently it's all absolute )
const render = curry(({ gl, programs, getTexture, matrices }, root) => {
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
      { gl, program: programs.texture, matrix: nextMatrices[0], getTexture },
      root
    );
  }

  propOr([], "children", root).forEach((node) =>
    render({ gl, programs, getTexture, matrices: nextMatrices }, node)
  );
});

const renderSprite = ({ gl, program, getTexture, matrix }, root) => {
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
  gl.bindTexture(gl.TEXTURE_2D, getTexture(root.texture));
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
  // return mat4.multiply([], rotationMat, orthoMat);
  return orthoMat;
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
  // Triangle 1
  -rect.width / 2,
  -rect.height / 2,
  rect.z,

  -rect.width / 2,
  rect.height / 2,
  rect.z,

  rect.width / 2,
  rect.height / 2,
  rect.z,

  // Triangle 2
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
  // Triangle 1
  0.0,
  0.0,

  0.0,
  1.0,

  1.0,
  1.0,

  // Triangle 2
  1.0,
  1.0,

  1.0,
  0.0,

  0.0,
  0.0,
];

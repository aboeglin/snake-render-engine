const { curry } = require("ramda");

const { FRAGMENT_SHADER_COLOR, VERTEX_SHADER } = require("./shaders");

const createProgram = gl => {
  var vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, VERTEX_SHADER);
  gl.compileShader(vs);

  var fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, FRAGMENT_SHADER_COLOR);
  gl.compileShader(fs);

  program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
    console.log(gl.getShaderInfoLog(vs));

  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
    console.log(gl.getShaderInfoLog(fs));

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

  const program = createProgram(gl);

  return renderer({ gl, program, width, height });
};

const renderer = curry(({ gl, program, width, height }, root) => {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  renderRect({ gl, program, width, height }, root);
});

const renderRect = curry(({ gl, program, width, height }, rect) => {
  const vertices = new Float32Array(rectToVertexArr(width, height, rect));

  const vbuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  gl.useProgram(program);
  program.uColor = gl.getUniformLocation(program, "uColor");
  program.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
  gl.enableVertexAttribArray(program.aVertexPosition);

  // Set color
  gl.uniform4fv(program.uColor, [1.0, 1.0, 0.0, 1.0]);
  // Add fourth vertex value
  gl.vertexAttribPointer(program.aVertexPosition, 3, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
});

const rectToVertexArr = curry((viewportW, viewportH, rect) => [
  -(rect.y - viewportH / 2) / (viewportH / 2),
  (rect.x - viewportW / 2) / (viewportW / 2),
  rect.z,

  -(rect.y + rect.height - viewportH / 2) / (viewportH / 2),
  (rect.x - viewportW / 2) / (viewportW / 2),
  rect.z,

  -(rect.y + rect.height - viewportH / 2) / (viewportH / 2),
  (rect.x + rect.width - viewportW / 2) / (viewportW / 2),
  rect.z,

  -(rect.y + rect.height - viewportH / 2) / (viewportH / 2),
  (rect.x + rect.width - viewportW / 2) / (viewportW / 2),
  rect.z,

  -(rect.y - viewportH / 2) / (viewportH / 2),
  (rect.x + rect.width - viewportW / 2) / (viewportW / 2),
  rect.z,

  -(rect.y - viewportH / 2) / (viewportH / 2),
  (rect.x - viewportW / 2) / (viewportW / 2),
  rect.z
]);

module.exports = { initRenderer };

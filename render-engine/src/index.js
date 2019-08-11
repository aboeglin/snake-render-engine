const { curry } = require("ramda");

const Rect = curry((props, children = []) => {
  return {
    type: "RECTANGLE",
    position: {
      x: props.x,
      y: props.y,
      z: props.z,
      width: props.width
    },
    children: children
  };
});

const init = gl => {
  gl.viewport(0, 0, 128, 128);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
};

const FRAGMENT_SHADER = `
#ifdef GL_ES
precision highp float;
#endif

uniform vec4 uColor;

void main() {
gl_FragColor = uColor;
}
`;

const VERTEX_SHADER = `
attribute vec2 aVertexPosition;

void main() {
gl_Position = vec4(aVertexPosition, 0.0, 1.0);
}
`;

const render = (gl, scene) => {
  var vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, VERTEX_SHADER);
  gl.compileShader(vs);

  var fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, FRAGMENT_SHADER);
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

  const vertices = new Float32Array([
    scene.position.x,
    scene.position.y,

    scene.position.x,
    scene.position.y + scene.position.width,

    scene.position.x + scene.position.width,
    scene.position.y + scene.position.width,

    scene.position.x + scene.position.width,
    scene.position.y + scene.position.width,

    scene.position.x + scene.position.width,
    scene.position.y,

    scene.position.x,
    scene.position.y
  ]);

  // const aspect = 1;

  // var vertices = new Float32Array([
  //   -0.5,
  //   0.5 * aspect,
  //   0.5,
  //   0.5 * aspect,
  //   0.5,
  //   -0.5 * aspect, // Triangle 1
  //   -0.5,
  //   0.5 * aspect,
  //   0.5,
  //   -0.5 * aspect,
  //   -0.5,
  //   -0.5 * aspect // Triangle 2
  // ]);

  const vbuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  gl.useProgram(program);

  program.uColor = gl.getUniformLocation(program, "uColor");
  gl.uniform4fv(program.uColor, [1.0, 1.0, 0.0, 1.0]);

  program.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
  gl.enableVertexAttribArray(program.aVertexPosition);
  gl.vertexAttribPointer(program.aVertexPosition, 2, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
};

module.exports = {
  init,
  render,
  Rect
};

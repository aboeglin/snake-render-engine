const { pathOr } = require("ramda");

const Rect = props => ({
  type: "RECTANGLE",
  position: {
    x: props.x,
    y: props.y,
    z: props.z,
    width: props.width
  },
  children: props.children
});

let _viewportW, _viewportH;

const init = (gl, viewportW, viewportH, scene) => {
  _viewportW = viewportW;
  _viewportH = viewportH;
  gl.viewport(0, 0, viewportW, viewportH);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  const program = createProgram(gl);
  const loopHandler = start(gl, program, scene);

  // return {
  //   start: () => {
  //     calls loopHanlder.start.
  //   },
  //   pause: () => {
  //     calls loopHanlder.pause
  //   },
  //   stop: () => {}
  // };
};

const start = (gl, program, scene) => {
  // Handle timer, pass time to scene, etc
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  render(gl, program, scene());
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  render(gl, program, scene());
  // requestAnimationFrame(() => {
  //   start(gl, program, scene);
  // });
};

const createProgram = gl => {
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

  return program;
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
attribute vec3 aVertexPosition;

void main() {
  gl_Position = vec4(aVertexPosition, 1.0);
}
`;

const rectToVertexArr = rect => [
  -(rect.position.y - _viewportH / 2) / (_viewportH / 2),
  (rect.position.x - _viewportW / 2) / (_viewportW / 2),
  rect.position.z,

  -(rect.position.y + rect.position.width - _viewportH / 2) / (_viewportH / 2),
  (rect.position.x - _viewportW / 2) / (_viewportW / 2),
  rect.position.z,

  -(rect.position.y + rect.position.width - _viewportH / 2) / (_viewportH / 2),
  (rect.position.x + rect.position.width - _viewportW / 2) / (_viewportW / 2),
  rect.position.z,

  -(rect.position.y + rect.position.width - _viewportH / 2) / (_viewportH / 2),
  (rect.position.x + rect.position.width - _viewportW / 2) / (_viewportW / 2),
  rect.position.z,

  -(rect.position.y - _viewportH / 2) / (_viewportH / 2),
  (rect.position.x + rect.position.width - _viewportW / 2) / (_viewportW / 2),
  rect.position.z,

  -(rect.position.y - _viewportH / 2) / (_viewportH / 2),
  (rect.position.x - _viewportW / 2) / (_viewportW / 2),
  rect.position.z
];

const render = (gl, program, node) => {
  if (!node) {
    return;
  }
  const children = pathOr(false, ["props", "children"], node);

  const vertices = new Float32Array(rectToVertexArr(node));

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

  if (children) {
    children.forEach(node => {
      render(gl, node);
    });
  }

  requestAnimationFrame(() => render(gl, node));
};

module.exports = {
  init,
  render,
  Rect
};

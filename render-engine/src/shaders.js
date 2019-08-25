const FRAGMENT_SHADER_COLOR = `
#ifdef GL_ES
precision highp float;
#endif

uniform vec4 uColor;

void main() {
  gl_FragColor = uColor;
}
`;

const VERTEX_SHADER = `
attribute vec3 vertexPosition;
uniform mat4 matrix;

void main() {
  gl_Position = (matrix * vec4(vertexPosition, 1));
}
`;

module.exports = {
  FRAGMENT_SHADER_COLOR,
  VERTEX_SHADER
};

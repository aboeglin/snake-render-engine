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
attribute vec3 aVertexPosition;

void main() {
  gl_Position = vec4(aVertexPosition, 1.0);
}
`;

module.exports = {
  FRAGMENT_SHADER_COLOR,
  VERTEX_SHADER
};

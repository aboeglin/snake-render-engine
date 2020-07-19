export const VERTEX_SHADER = `
precision mediump float;
attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMatrix;

varying vec2 vTextureCoord;

void main() {
  gl_Position = (uMatrix * vec4(aVertexPosition, 1));
  vTextureCoord = aTextureCoord;
}
`;

export const FRAGMENT_SHADER_COLOR = `
#ifdef GL_ES
precision mediump float;
#endif

uniform vec4 uColor;

void main() {
  gl_FragColor = uColor;
}
`;

export const FRAGMENT_SHADER_TEXTURE = `
#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D uTexture;

varying vec2 vTextureCoord;

void main() {
  gl_FragColor = texture2D(uTexture, vTextureCoord);
  // gl_FragColor = vec4(1.0, 1.0, 0, 1.0);
}
`;

import {
  FRAGMENT_SHADER_COLOR,
  FRAGMENT_SHADER_TEXTURE,
  VERTEX_SHADER,
} from "./shaders";

export const createColorProgram = gl => {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, VERTEX_SHADER);
  gl.compileShader(vs);

  const fsc = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fsc, FRAGMENT_SHADER_COLOR);
  gl.compileShader(fsc);

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fsc);
  gl.linkProgram(program);

  program.uColor = gl.getUniformLocation(program, "uColor");
  program.uMatrix = gl.getUniformLocation(program, "uMatrix");
  program.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");

  // TODO: Add proper error handling
  // if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
  //   console.log(gl.getShaderInfoLog(vs));

  // if (!gl.getShaderParameter(fsc, gl.COMPILE_STATUS))
  //   console.log(gl.getShaderInfoLog(fsc));

  // if (!gl.getProgramParameter(program, gl.LINK_STATUS))
  //   console.log(gl.getProgramInfoLog(program));

  return program;
};

export const createTextureProgram = gl => {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, VERTEX_SHADER);
  gl.compileShader(vs);

  const fst = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fst, FRAGMENT_SHADER_TEXTURE);
  gl.compileShader(fst);

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fst);
  gl.linkProgram(program);

  program.uMatrix = gl.getUniformLocation(program, "uMatrix");
  program.uTexture = gl.getUniformLocation(program, "uTexture");
  program.aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
  program.aTextureCoord = gl.getAttribLocation(program, "aTextureCoord");

  // TODO: Add proper error handling
  // if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
  //   console.log(gl.getShaderInfoLog(vs));

  // if (!gl.getShaderParameter(fst, gl.COMPILE_STATUS))
  //   console.log(gl.getShaderInfoLog(fst));

  // if (!gl.getProgramParameter(program, gl.LINK_STATUS))
  //   console.log(gl.getProgramInfoLog(program));

  return program;
};

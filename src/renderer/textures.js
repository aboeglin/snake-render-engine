// TODO: Add unit tests for that feature.
const makeTextureHandler = (gl) => {
  const textures = new WeakMap();

  const getTexture = (texture) => {
    if (!textures.get(texture.data)) {
      const glTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, glTexture);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      const level = 0;
      const internalFormat = gl.RGBA;
      const border = 0;
      const srcFormat = gl.RGBA;
      const srcType = gl.UNSIGNED_BYTE;
      const pixels = new Uint8Array(texture.data);
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        texture.width,
        texture.height,
        border,
        srcFormat,
        srcType,
        pixels
      );

      textures.set(texture.data, glTexture);
    }

    return textures.get(texture.data);
  };

  return getTexture;
};

module.exports = {
  makeTextureHandler,
};

import ndArray from "ndarray";
import savePixels from "save-pixels";

export const makeSnapshot = (gl, width, height) => {
  return new Promise((resolve, reject) => {
    const canvasPixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, canvasPixels);

    // These two lines are needed in order to get the array of pixels back in the right order.
    const arr = rotatePixelArray(Array.from(canvasPixels), width, height);
    var nd = ndArray(Uint8Array.from(arr), [width, height, 4]).step(1, -1);

    const chunks = [];
    const reader = savePixels(nd, ".png");
    reader.on("data", (chunk) => {
      chunks.push(chunk);
    });

    reader.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
  });
};

const rotatePixelArray = (pixelArray, w, h) => {
  var rotatedArray = [];

  for (var x = 0; x < w; x++) {
    for (var y = 0; y < h; y++) {
      let index = (x + y * w) * 4;
      rotatedArray.push(pixelArray[index]);
      rotatedArray.push(pixelArray[index + 1]);
      rotatedArray.push(pixelArray[index + 2]);
      rotatedArray.push(pixelArray[index + 3]);
    }
  }

  return rotatedArray;
};

const NOT_STARTED = -1;

// TODO: Add pause, stop, getDeltaT
export const createClock = getTime => {
  let t0 = NOT_STARTED;

  return {
    getCurrentTime: () => {
      return getTime() - t0;
    },
    start: () => {
      t0 = getTime();
    }
  };
};

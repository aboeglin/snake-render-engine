const { createClock } = require("./clock");

describe("Clock", () => {
  test("It should export a create function", () => {
    expect(typeof createClock).toBe("function");
  });

  test("The create function should return an object with a start function", () => {
    const clock = createClock();
    expect(typeof clock.start).toBe("function");
  });

  test("The create function should return an object with a getCurrentTime function", () => {
    const clock = createClock();
    expect(typeof clock.getCurrentTime).toBe("function");
  });

  test("The create function should accept and use a getTime function", () => {
    const getTime = jest.fn();
    const clock = createClock(getTime);
    clock.start();
    expect(getTime).toHaveBeenCalled();
  });

  test("The getCurrentTime function should return the time since the call to start", () => {
    const expected = 1000;

    let i = -1;
    const getTime = () => {
      i = i + 1;

      return i === 0 ? 0 : expected;
    };

    const clock = createClock(getTime);
    clock.start();
    const actual = clock.getCurrentTime();
    expect(actual).toBe(expected);
  });
});

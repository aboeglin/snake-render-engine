const SnakeRenderEngine = require("./index");

describe("render engine", () => {
  test("It should have an init function", () => {
    expect(typeof SnakeRenderEngine.init).toBe("function");
  });

  test("It should take a reducer function, and return a dispatch function that should call the reducer when called", done => {
    const reducer = () => {
      expect("to have been called").toBe("to have been called");
      done();
    };

    const dispatch = SnakeRenderEngine.init(reducer);
    dispatch();
  });

  test("It should give the reducer the action object", done => {
    const expectedAction = {};
    const reducer = action => {
      expect(expectedAction).toBe(action);
      done();
    };
    const dispatch = SnakeRenderEngine.init(reducer);
    dispatch(expectedAction);
  });

  test("dispatch and reducer should be two different functions", () => {
    const reducer = () => {
      expect(expectedAction).toBe(action);
    };
    const dispatch = SnakeRenderEngine.init(reducer);
    expect(dispatch).not.toBe(reducer);
  });
});

const { handleEvent } = require("./events");

describe("events", () => {
  test("handleEvent should call the click handler of a Rect when clicked in", () => {
    const clickHandler = jest.fn();
    const root = {
      onClick: clickHandler,
      x: 50,
      y: 50,
      z: 0,
      type: "RECT",
      width: 100,
      height: 100,
      children: [],
    };

    const event = {
      type: "click",
      x: 100,
      y: 100,
    };

    handleEvent(event, root);

    expect(clickHandler).toHaveBeenCalled();
  });

  test("handleEvent should not call the click handler of a Rect when clicked outside", () => {
    const clickHandler = jest.fn();
    const root = {
      onClick: clickHandler,
      x: 50,
      y: 50,
      z: 0,
      type: "RECT",
      width: 100,
      height: 100,
      children: [],
    };

    const event = {
      type: "click",
      x: 160,
      y: 0,
    };

    handleEvent(event, root);

    expect(clickHandler).not.toHaveBeenCalled();
  });

  test("handleEvent should not call the click handler of a Rect when y axis is not in the bounds", () => {
    const clickHandler = jest.fn();
    const root = {
      onClick: clickHandler,
      x: 50,
      y: 50,
      z: 0,
      type: "RECT",
      width: 100,
      height: 100,
      children: [],
    };

    const event = {
      type: "click",
      x: 140,
      y: 0,
    };

    handleEvent(event, root);

    expect(clickHandler).not.toHaveBeenCalled();
  });

  test("handleEvent should call the event handler with the event object as parameter", () => {
    const clickHandler = jest.fn();
    const root = {
      onClick: clickHandler,
      x: 50,
      y: 50,
      z: 0,
      type: "RECT",
      width: 100,
      height: 100,
      children: [],
    };

    const event = {
      type: "click",
      x: 140,
      y: 140,
    };

    handleEvent(event, root);

    expect(clickHandler).toHaveBeenCalledWith(event);
  });

  test("handleEvent should call the event handler of a child in the tree that matches if the root node isn't matching", () => {
    const clickHandler = jest.fn();
    const root = {
      children: [
        {
          onClick: clickHandler,
          x: 50,
          y: 50,
          z: 0,
          type: "RECT",
          width: 100,
          height: 100,
          children: [],
        },
      ],
    };

    const event = {
      type: "click",
      x: 140,
      y: 140,
    };

    handleEvent(event, root);

    expect(clickHandler).toHaveBeenCalledWith(event);
  });
});

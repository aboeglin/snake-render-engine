import { handleEvent, fromDOMEvent } from "./events";

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
      x: 110,
      y: 100,
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
      x: 90,
      y: 110,
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
      x: 90,
      y: 90,
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
      x: 90,
      y: 90,
    };

    handleEvent(event, root);

    expect(clickHandler).toHaveBeenCalledWith(event);
  });

  test("handleEvent should not throw if the node does not have a onClick event", () => {
    const root = {
      children: [
        {
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
      x: 90,
      y: 90,
    };

    expect(() => {
      handleEvent(event, root);
    }).not.toThrow();
  });

  test("fromDOMEvent should build an event object with projected coordinates", () => {
    const domEvent = {
      type: "click",
      offsetX: 200,
      offsetY: 200,
    };

    const container = {
      clientHeight: 300,
    };

    const actual = fromDOMEvent(container, domEvent);
    const expected = {
      type: "click",
      x: 200,
      y: 100,
    };

    expect(actual).toEqual(expected);
  });
});

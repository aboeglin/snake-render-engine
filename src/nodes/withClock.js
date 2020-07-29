import { curry, once } from "ramda";

import { createElement } from "../create-element";
import { createClock } from "../clock";

let getClock = once((getTime) => createClock(getTime));

// TODO: implement context in order to be able to make it happen cleanly
const withClock = curry((getTime, Node) => {
  const clock = getClock(getTime);

  const Clock = (props, { dynamic }) => {
    dynamic(true);

    return createElement(Node, { ...props, time: clock.getCurrentTime() });
  };

  return Clock;
});

export default withClock;

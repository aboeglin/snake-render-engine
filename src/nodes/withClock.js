import { curry, once } from "ramda";

import { enhance } from "../core";
import { createClock } from "../clock";

let getClock = once(getTime => createClock(getTime));

const withClock = curry((getTime, key, Node) =>
  enhance(
    ({ dynamic }) => {
      dynamic(true);
      return getClock(getTime).getCurrentTime();
    },
    key,
    Node
  )
);

export default withClock;

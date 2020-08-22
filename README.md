![Main](https://github.com/aboeglin/snake-render-engine/workflows/Main/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/aboeglin/snake-render-engine/badge.svg?branch=master)](https://coveralls.io/github/aboeglin/snake-render-engine?branch=master)

# Snake Render Engine

Snake Render Engine is a 2D render engine which wraps [WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API) with a functional API, analogous to the well-known [React](https://reactjs.org/) UI library. It also supports [JSX syntax](https://reactjs.org/docs/introducing-jsx.html) and is Component based.

Here is a minimal example that highlights how to run it:

```js
// In order to define components we need to import SRE
import SRE, { initRenderer, initWithRenderer, Rect } from "snake-render-engine";

// Get the host canvas where the engine will run
const canvas = document.getElementById("canvas");
const height = canvas.height;
const width = canvas.width;

const gl = canvas.getContext("webgl");

const render = initRenderer({ gl, width, height });
const run = initWithRenderer(canvas, render);

// Define a Scene Node that renders a simple rect and logs click events
const Scene = () => (
  <Rect x={320} y={200} z={0} width={640} height={100} onClick={console.log} />
);

// Start it
run(<Scene />);
```

## Demos
Demos are available [here](https://aboeglin.github.io/snake-render-engine/)

## Getting started

### Installation

* `npm i nps -g` (Optional: if not wanted, replace `nps` with `npx nps` in the commands below instead.)
* `npm i`

### Running Locally

* `nps demo` - Serve demo locally to port 1234
* `nps test` - Run the tests

### Testing

* `nps test`

### Contributing

* Please file issues [here](https://github.com/aboeglin/snake-render-engine/issues)
* Pull Requests [welcome](https://github.com/aboeglin/snake-render-engine/pulls)

### Active Development

SRE is an actively developed work-in-progress tool. Please reach out on [Github](https://github.com/aboeglin/snake-render-engine) if you want to collaborate on this project!

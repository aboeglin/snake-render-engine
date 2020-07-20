![Main](https://github.com/aboeglin/snake-render-engine/workflows/Main/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/aboeglin/snake-render-engine/badge.svg?branch=master)](https://coveralls.io/github/aboeglin/snake-render-engine?branch=master)

# Snake Render Engine
Snake Render Engine is a 2D render engine based on webgl with a functional API analog to the one of the well known react UI library. It also supports jsx syntax and is component based.

## Gettings started
Here is a minimal example that highlights how to run it.

```javascript
// In order to define components we need to import SRE
import SRE, { initRenderer, initWithRenderer, Rect } from "sre";

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
Demos are available here : [demos](https://aboeglin.github.io/snake-render-engine/)

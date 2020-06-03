# Snake Render Engine

# Concepts
## Node
A Node is the blueprint that contains the rendering logic
of something to be displayed ( eg: Snake Node would render
the head, tail, and handle the position of its elements ).

## NodeElement
A NodeElement is an "instance" of a Node. The node has
been called with a set of props that will be resolved
by the traverse function.

## Resolver
When creating a NodeElement, the returned value is a
function, that when called will "resolve" the NodeElement
and return an object.


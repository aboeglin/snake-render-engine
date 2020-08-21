const { pipe } = require("ramda");

const NodeThatDoesSideEffects = incept(
  ({ mounted, state = "not mounted", setState }, props) => {
    mounted(() => setState("mounted"));

    return { ...props, mountingText: state };
  }
)(Node);

const Node = (props) => <Child>{props.mountingText}</Child>;

const Child = () => {};

const App = () => <NodeThatDoesSideEffects />;

// GLOBAL STATE ONLY

const getUserName = (state) => state.user.name;

// For async actions we return a Future that contains the new state
// The engine would take care of forking it and assigning the new state on resolution.
const AuthenticateUser = (state, event, credentials) =>
  pipe(
    request,
    map((user) => ({
      ...state,
      user,
    }))
  )(credentials);

const IncrementQuantity = (state, event) => ({
  ...state,
  cart: {
    ...state.cart,
    quantity: state.cart.quantity + 1,
  },
});

const getCartItems = (state) => state.cart.items;

const CartView = state => pipe(
  getUserName,
  name => (
    <div>
      <h2>Cart of {name}</h2>
      <div><CartItems /></div>
    </div>
  )
)(state)

const CartItems = (state) =>
  pipe(
    getCartItems,
    map((i) => <CartItem item={i} />)
  )(state);

const CartItem = (state, { item }) => (
  <div>
    <h3>{item.name}</h3>
    <p>
      {item.quantity} <span onClick={IncrementQuantity}>+</span> <span>-</span>
    </p>
  </div>
);

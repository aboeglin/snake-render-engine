const init = reducer => {
  const dispatch = action => reducer(action);

  return dispatch;
};

module.exports = {
  init
};

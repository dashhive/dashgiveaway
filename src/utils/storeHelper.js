const buildState = (actions, state, action) => {
  return actions[action.type] ? actions[action.type](state, action.payload) : state
}

export const build = (
  actions,
  initialState,
  useHydrate = true,
  alwaysRunAfter = false,
) => (oldState = initialState, action) => {
  let state = oldState

  if (useHydrate && !state.hydrated) {
    state = { ...initialState, ...state, hydrated: true }
  }

  const builtState = buildState(actions, state, action)

  return alwaysRunAfter ? alwaysRunAfter(builtState, action.payload || {}) : builtState
}

export const buildSingleValue = (actions, initialState) => (
  state = initialState,
  action,
) => buildState(actions, state, action)

export default build

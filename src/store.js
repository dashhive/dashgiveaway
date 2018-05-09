import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import { composeWithDevTools } from 'redux-devtools-extension'
import reducer from 'store/CombineReducer'

export const makeStore = () =>
  createStore(reducer, composeWithDevTools(applyMiddleware(thunk)))

export default makeStore()

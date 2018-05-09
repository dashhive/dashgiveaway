import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import './normalize.css'
import './index.css'
import store from './store'
import App from './App'
import registerServiceWorker from './registerServiceWorker'

const root = (
  <Provider store={store}>
    <App />
  </Provider>
)

ReactDOM.render(root, document.getElementById('root'))
registerServiceWorker()

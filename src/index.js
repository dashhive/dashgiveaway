import React from 'react'
import ReactDOM from 'react-dom'
import './normalize.css'
import './index.css'
import App from './App'
import registerServiceWorker from './registerServiceWorker'
import DashToUSDProvider from './store/dash-to-usd/context'

const root = (
  <DashToUSDProvider>
    <App />
  </DashToUSDProvider>
)

ReactDOM.render(root, document.getElementById('root'))
registerServiceWorker()

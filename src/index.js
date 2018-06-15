import React from 'react'
import ReactDOM from 'react-dom'
import './normalize.css'
import './index.css'
import App from './App'
import registerServiceWorker from './registerServiceWorker'
import DashToUSDProvider from './store/dash-to-usd/context'
import BrowserRouter from 'react-router-dom/es/BrowserRouter'

const root = (
  <DashToUSDProvider>
    <BrowserRouter history={window.browserHistory}>
      <App/>
    </BrowserRouter>
  </DashToUSDProvider>
)

ReactDOM.render(root, document.getElementById('root'))
registerServiceWorker()

import React, { Component } from 'react'
import Header from 'components/Header'
import s from './App.css'

class App extends Component {
  render() {
    return (
      <div className={s.root}>
        <Header />
      </div>
    )
  }
}

export default App

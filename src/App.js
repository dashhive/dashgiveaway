import React, { Component } from 'react'
import Header from 'components/Header'
import Giveaway from 'components/Giveaway'
import s from './App.css'

class App extends Component {
  render() {
    return (
      <div className={s.root}>
        <Header />
        <Giveaway />
      </div>
    )
  }
}

export default App

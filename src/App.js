import React, { Component } from 'react'
import Header from 'components/Header'
import Giveaway from 'components/Giveaway'
import Footer from 'components/Footer'
import s from './App.css'

class App extends Component {
  render() {
    return (
      <div className={s.root}>
        <Header />
        <Giveaway />
        <Footer />
      </div>
    )
  }
}

export default App

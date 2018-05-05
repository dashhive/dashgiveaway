import React, { Component } from 'react'
import Header from 'components/Header'
import Giveaway from 'components/Giveaway'
import Footer from 'components/Footer'

import s from './App.css'

import 'dashdrop'

class App extends Component {
  render() {
    return (
      <div className={`${s.root} dd-screen-only`}>
        <Header />
        <Giveaway />
        <Footer />
      </div>
    )
  }
}

export default App

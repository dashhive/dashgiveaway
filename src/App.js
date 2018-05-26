import React, { Component } from 'react'
import Header from 'components/organisms/header/Header'
import Giveaway from 'components/organisms/giveaway/Giveaway'
import Footer from 'components/organisms/footer/Footer'

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

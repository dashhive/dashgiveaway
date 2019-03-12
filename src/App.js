import React, { Component } from 'react'
import Header from 'components/organisms/header/Header'
import Giveaway from 'components/organisms/giveaway/Giveaway'
import Footer from 'components/organisms/footer/Footer'

import s from './App.css'

import 'dashdrop'
import Route from 'react-router-dom/es/Route'
import Generate from './components/organisms/generate/Generate'

class App extends Component {
  render() {
    return (
      <div className={`${s.root} dd-screen-only`}>
        <Header/>
        <Route path='/' exact component={Giveaway}/>
        <Route path='/spread' component={Generate}/>
        <Footer/>
      </div>
    )
  }
}

export default App

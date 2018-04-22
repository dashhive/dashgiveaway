import React from 'react'
import { getDashCurrency } from 'api/currency'
import s from './Header.css'
class Header extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      currency: '',
    }
  }

  componentDidMount() {
    getDashCurrency()
      .then(res => this.setState({ currency: res.data.dash_usd.toFixed(2) }))
      .catch(err => this.setState({ currency: err }))
  }
  render() {
    return (
      <header className={s.root}>
        <div className={s.container}>
          <div className="logo">
            <img src="/img/logo.png" alt="" />
          </div>
          <h2>1 DASH = {this.state.currency} USD</h2>
        </div>
      </header>
    )
  }
}

export default Header

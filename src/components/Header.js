import React from 'react'
import Button from 'atoms/Button'
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
          <div className={s.buttons}>
            <Button primary href="https://github.com/dashhive/dashdrop" target="_blank">
              View Code
            </Button>
            <Button
              primary
              href="https://github.com/dashhive/dashdrop.html/archive/v1.0.0.zip"
              download
            >
              Download
            </Button>
          </div>
        </div>
      </header>
    )
  }
}

export default Header

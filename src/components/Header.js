import React from 'react'
import { connect } from 'react-redux'
import { dashToUSDSelector, getDashToUSD } from 'store/dashToUSD'
import Button from 'atoms/Button'
import s from './Header.css'
class Header extends React.Component {
  componentDidMount() {
    this.props.getDashToUSD()
  }

  render() {
    return (
      <header className={s.root}>
        <div className={s.container}>
          <div className={s.logo}>
            <img src="/img/logo.png" alt="" />
          </div>
          <h2>1 DASH = {this.props.currency} USD</h2>
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
          <h2 className={s.title}>
            <strong>Tools for Paper Wallet Giveaways</strong>
          </h2>
          <h3>
            DashDrop was developed by <a href="https://github.com/dashhive">DashHive</a>{' '}
            as a tool to help community members initiate, track, and reclaim paper wallets
            at giveaways, conferences, and merchant gift card events. Proposal{' '}
            <a href="https://www.dashcentral.org/p/dash-hive" target="_dashhive">
              #dash-hive
            </a>
          </h3>
        </div>
      </header>
    )
  }
}

const mapState = state => ({
  currency: dashToUSDSelector(state),
})

export default connect(mapState, { getDashToUSD })(Header)

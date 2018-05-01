import React from 'react'
import Button from 'atoms/Button'
import Generate from './Generate'
import s from './Giveaway.css'

class Giveaway extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      url: 'https://insight.dash.org/api',
    }
  }

  handleChange(url) {
    this.setState({ ...this.state, url })
  }

  render() {
    return (
      <div className={s.root}>
        <div className={s.actions}>
          <div className={s.action}>
            <h2>Disburse Funds</h2>
            <p>
              Choose a Funding Source and destination addreses. Generate and print secure
              wallets or import CSV from paper.dash.org
            </p>
            <div className={s.icons}>
              <div className={s.icon}>
                <img src="/img/icon-generate.svg" alt="" />
                <span>Generate Paper Wallets</span>
              </div>
              <div className={s.icon}>
                <img src="/img/icon-import-csv.svg" alt="" />
                <span>Import Paper CSV</span>
              </div>
            </div>
            <Button primary>Spread Dash →</Button>
          </div>
          <div className={s.action}>
            <h2>Review Giveaway</h2>
            <p>
              See the impact your giveaway has had. Reclaim unused wallets for another
              round.
            </p>
            <div className={s.icons}>
              <div className={s.icon}>
                <img src="/img/icon-measure.svg" alt="" />
                <span>Measure Outreach</span>
              </div>
              <div className={s.icon}>
                <img src="/img/icon-reclaim.svg" alt="" />
                <span>Recycle Unused Wallets</span>
              </div>
            </div>
            <Button primary>Check Status →</Button>
          </div>
        </div>
        <div className={s.url}>
          <h2>Insight API URL</h2>
          <label>
            url
            <input
              type="url"
              className={s.input}
              placeholder="ex: https://api.example.com/insight-api-dash"
              value={this.state.url}
              onChange={e => this.handleChange(e.target.value)}
            />
            <img src="/IMG/icon-green-check.svg" alt="check" />
          </label>
          <p>
            Want to run a private instance of this app? Install{' '}
            <a href="https://github.com/dashhive/dashd-installer.sh" target="_blank">
              dashd
            </a>, the{' '}
            <a
              href="https://github.com/dashhive/dash-insight-installer.sh"
              target="_blank"
            >
              Dash Insight API
            </a>, and host{' '}
            <a href="https://github.com/dashhive/dashdrop.html" target="_blank">
              DashDrop
            </a>.
          </p>
        </div>
        <Generate />
      </div>
    )
  }
}

export default Giveaway

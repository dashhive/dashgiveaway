import React from 'react'
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
        <h1>Giveaway</h1>
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
      </div>
    )
  }
}

export default Giveaway

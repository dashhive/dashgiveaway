import React from 'react'
import { connect } from 'react-redux'
import { dashToUSDSelector } from 'store/dashToUSD'
import s from './InputPair.css'

class Input extends React.Component {
  state = {
    dash: this.props.dash || 0,
    usd: (this.props.dash * this.props.dashToUSD).toFixed(4) || 0,
  }
  handleChange(input, value) {
    if (input === 'dash') {
      this.setState({ dash: value })
      this.setState({ usd: (value * this.props.dashToUSD).toFixed(4) })
    } else {
      this.setState({ usd: value })
      this.setState({ dash: (value / this.props.dashToUSD).toFixed(4) })
    }
  }
  render() {
    return (
      <div className={s.root}>
        <label className={s.label}>
          {this.props.label}
          <div>
            <div className={s.left}>
              <input
                type={this.props.type || 'text'}
                className={s.input}
                placeholder={this.props.placeholder}
                value={this.state.dash}
                onChange={e => this.handleChange('dash', e.target.value)}
              />
              <div className={s.unit}>DASH</div>
            </div>
            <div className={s.right}>
              <input
                type={this.props.type || 'text'}
                className={s.input}
                placeholder={this.props.placeholderTwo}
                value={this.state.usd}
                onChange={e => this.handleChange('usd', e.target.value)}
              />
              <div className={s.unit}>USD</div>
            </div>
          </div>
        </label>
      </div>
    )
  }
}

export default connect(state => ({ dashToUSD: dashToUSDSelector(state) }))(Input)

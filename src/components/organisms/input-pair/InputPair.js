import React from 'react'
import PropTypes from 'prop-types'
import s from './InputPair.css'
import { withDashToUSD } from '../../../store/dash-to-usd/context'

class Input extends React.PureComponent {
  static propTypes = {
    dash: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]).isRequired,
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    placeholderTwo: PropTypes.string,
    dashToUSD: PropTypes.string,
  }

  getDashFromUSD(usd) {
    return usd ? (usd / this.props.dashToUSD).toFixed(4) : 0
  }

  getUSDFromDash(dash) {
    return dash ? (dash * this.props.dashToUSD).toFixed(4) : 0
  }

  handleChange = (input, value) => {
    console.log(value)
    const updates = input === 'dash'
      ? { dash: value, usd: this.getUSDFromDash(value), updatingUSD: false }
      : { usd: value, dash: this.getDashFromUSD(value), updatingUSD: true }
    this.props.onChange(updates)
  }

  render() {
    const {
      dash,
      usd,
      type,
      label,
      placeholder,
      placeholderTwo,
      updatingUSD,
      disabled,
    } = this.props
    console.log(this.props)

    const dashValue = !updatingUSD ? dash : this.getDashFromUSD(usd)
    const usdValue = updatingUSD ? usd : this.getUSDFromDash(dash)
    console.log(updatingUSD, dashValue, usdValue)
    return (
      <div className={s.root}>
        <label className={s.label}>
          {label}
          <div>
            <div className={s.left}>
              <input
                type={type || 'text'}
                className={s.input}
                placeholder={placeholder}
                value={dashValue}
                onChange={e => this.handleChange('dash', e.target.value)}
                disabled={disabled}
              />
              <div className={s.unit}>DASH</div>
            </div>
            <div className={s.right}>
              <input
                type={type || 'text'}
                className={s.input}
                placeholder={placeholderTwo}
                value={usdValue}
                onChange={e => this.handleChange('usd', e.target.value)}
                disabled={disabled}
              />
              <div className={s.unit}>USD</div>
            </div>
          </div>
        </label>
      </div>
    )
  }
}

export default withDashToUSD(Input)

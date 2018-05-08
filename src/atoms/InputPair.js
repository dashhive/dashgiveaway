import React from 'react'

import s from './InputPair.css'

class Input extends React.Component {
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
                value={this.props.value}
                onChange={this.props.onChange}
              />
              <div className={s.unit}>{this.props.unit}</div>
            </div>
            <div className={s.right}>
              <input
                type={this.props.type || 'text'}
                className={s.input}
                placeholder={this.props.placeholderTwo}
                value={this.props.valueTwo}
                onChange={this.props.onChangeTwo}
              />
              <div className={s.unit}>{this.props.unitTwo}</div>
            </div>
          </div>
        </label>
      </div>
    )
  }
}

export default Input

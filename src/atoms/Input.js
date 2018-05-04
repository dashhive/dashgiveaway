import React from 'react'

import s from './Input.css'

class Input extends React.Component {
  render() {
    return (
      <div className={s.root}>
        <label className={s.label}>
          {this.props.label}
          <input
            type={this.props.type}
            className={s.input}
            placeholder={this.props.placeholder}
            value={this.props.value}
            onChange={this.props.onChange}
          />
        </label>
      </div>
    )
  }
}

export default Input

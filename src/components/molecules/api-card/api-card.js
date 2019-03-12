import React from 'react'
import Card from '../card/card'
import style from './api-card.css'

export default class APICard extends React.Component {
  state = {
    url: '',
  }

  static getDerivedStateFromProps({ url }) {
    return {
      url,
    }
  }

  handleChange = val => {
    this.setState({
      url: val,
    })
  }

  render() {
    const { title, children, className, ...props } = this.props
    const classes = className ? `${className} ${style.card__url}` : style.card__url
    return (
      <Card className={classes} title={title} {...props}>
        <label className={style.card__url__label}>
          url
          <input
            type="url"
            className={style.card__url__input}
            value={this.state.url}
            onChange={e => this.handleChange(e.target.value)}
          />
          <img
            className={style.card__url__img}
            src="/img/icon-green-check.svg"
            alt="check"
          />
        </label>
        {children}
      </Card>
    )
  }
}

import React from 'react'
import style from './card.css'

export default function({ title, children, className, ...props }) {
  const classes = className ? `${className} ${style.card}` : style.action
  return (
    <div className={classes} {...props}>
      {title && <h2 className={style.card__h2}>{title}</h2>}
      {children}
    </div>
  )
}

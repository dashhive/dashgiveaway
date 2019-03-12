import React from 'react'
import style from './mini-banner.css'

export default function MiniBanner({ src, alt, title }) {
  return (
    <div className={style.icon}>
      <img className={style.icon__img} src={src} alt={alt} />
      <span>{title}</span>
    </div>
  )
}

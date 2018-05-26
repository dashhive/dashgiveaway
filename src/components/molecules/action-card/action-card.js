import React from 'react'
import Card from '../card/card'
import MiniBanner from '../mini-banner/mini-banner'
import style from './action-card.css'
import Button from '../../atoms/button/Button'

export default function({ title, description, banners, buttonText }) {
  return (
    <Card title={title} className={style.card__action}>
      <p className={style.card__action__p}>{description}</p>
      <div className={style.icons}>
        {banners.map(({ src, alt, title }) => (
          <MiniBanner src={`/img/${src}`} alt={alt} title={title} />
        ))}
      </div>
      <Button primary>{buttonText}</Button>
    </Card>
  )
}

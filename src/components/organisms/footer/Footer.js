import React from 'react'
import Button from '../../atoms/button/Button'
import s from './Footer.css'

const Footer = props => (
  <footer className={s.root}>
    <p>Copyright 2018</p>
    <div>
      <Button primary>Clear All Application Data</Button>
    </div>
  </footer>
)

export default Footer

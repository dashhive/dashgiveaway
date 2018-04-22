import React from 'react'
import DownloadIcon from 'icons/download'
import s from './Button.css'

const Button = props => {
  const types = ['primary', 'medium', 'loading', 'disabled', 'fullWidth', 'download']
    .filter(x => props[x])
    .map(x => s[x])
  types.unshift(s.root)

  if (props.className) types.push(props.className)

  const handlers = Object.keys(props).reduce((acc, key) => {
    if (/^on[A-Z]/.test(key)) acc[key] = props[key]
    return acc
  }, {})

  if (props.href)
    return (
      <a className={types.join(' ')} href={props.href} target={props.target}>
        {props.download ? <DownloadIcon /> : ''}
        {props.loading ? 'loading' : props.children}
      </a>
    )

  return (
    <button
      className={types.join(' ')}
      {...handlers}
      disabled={props.disabled || props.loading}
    >
      {props.loading ? 'loading' : props.children}
    </button>
  )
}

export default Button

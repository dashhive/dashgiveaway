export const setItem = (key, value) => {
  return localStorage.setItem(
    `v1::${process.env.NODE_ENV}::${document.domain}::${key}`,
    value,
  )
}

export const getItem = key => {
  return localStorage.getItem(`v1::${process.env.NODE_ENV}::${document.domain}::${key}`)
}

export const removeItem = key => {
  return localStorage.removeItem(
    `v1::${process.env.NODE_ENV}::${document.domain}::${key}`,
  )
}

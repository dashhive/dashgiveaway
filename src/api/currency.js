import fetch from 'isomorphic-fetch'

export const getDashCurrency = () => {
  return fetch('https://insight.dash.org/api/currency').then(j => j.json())
}

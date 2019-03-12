import performRequest from './perform-request'

export const getDashCurrency = () => performRequest('https://insight.dash.org/api/currency')

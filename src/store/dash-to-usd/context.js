import React from 'react'
import { getDashCurrency } from '../../api/currency'

export const dashToUSDContext = React.createContext()

export function withDashToUSD(Component) {
  return props => (
    <dashToUSDContext.Consumer>
      {dashToUSD => (
        <Component dashToUSD={dashToUSD} {...props}/>
      )}
    </dashToUSDContext.Consumer>
  )
}

export default class DashToUSDProvider extends React.Component {
  state = {
    dashToUSD: null,
  }

  async getDashToUSD() {
    try {
      const responseJSON = await getDashCurrency()
      return responseJSON.dash_usd.toFixed(2)
    } catch (e) {
      console.error(e)
      return e || 'Unknown API error'
    }
  }

  async componentDidMount() {
    const dashToUSD = await this.getDashToUSD()
    this.setState({
      dashToUSD,
    })
  }

  render() {
    return (
      <dashToUSDContext.Provider value={this.state.dashToUSD}>
        {this.props.children}
      </dashToUSDContext.Provider>
    )
  }
}
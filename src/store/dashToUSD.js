import storeHelper from 'utils/storeHelper'
import { getDashCurrency } from 'api/currency'

const initialState = {
  value: 0,
  loading: false,
  success: false,
  error: false,
}

const dashToUSDFail = (state, payload) => ({
  ...state,
  loading: false,
  success: false,
  error: payload,
})

const dashToUSDSuccess = (state, payload) => ({
  ...state,
  loading: false,
  success: true,
  error: false,
  value: payload,
})

const dashToUSD = (state, payload) => ({
  ...state,
  loading: true,
  error: false,
  success: false,
})

const reducers = {
  DASH_TO_USD_FAIL: dashToUSDFail,
  DASH_TO_USD_SUCCESS: dashToUSDSuccess,
  DASH_TO_USD: dashToUSD,
}

const dashToUSDFailAction = error => ({
  type: 'DASH_TO_USD_FAIL',
  payload: error,
})

const dashToUSDSuccessAction = usd => ({
  type: 'DASH_TO_USD_SUCCESS',
  payload: usd,
})

const dashToUSDAction = () => ({
  type: 'DASH_TO_USD',
})

export const getDashToUSD = () => dispatch => {
  dispatch(dashToUSDAction())

  return getDashCurrency()
    .then(res => dispatch(dashToUSDSuccessAction(res.data.dash_usd.toFixed(2))))
    .catch(e => dispatch(dashToUSDFailAction(e || 'Unknown API error')))
}

export const dashToUSDSelector = state => state.dashToUSD.value

export default storeHelper(reducers, initialState)

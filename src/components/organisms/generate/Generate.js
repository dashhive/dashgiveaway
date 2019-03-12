import React, { Fragment } from 'react'
import Bitcore from 'bitcore-lib-dash'
import { Portal } from 'react-portal'
import { QRCode } from 'react-qr-svg'
import Button from '../../atoms/button/Button'
import Input from '../../atoms/input/Input'
import InputPair from '../input-pair/InputPair'
import Card from '../../molecules/card/card'
import style from './Generate.css'

export const MAX_INSPECTION_BATCH = 10

class Generate extends React.Component {
  state = {
    csv: null,
    walletQuantity: 100,
    transactionTotal: 0,
    fundingTotal: 0,
    sourcePublicKey: this.getStoredWallet('source').publicKey,
    noFunds: false,
    amountDash: 0.01,
    amountUSD: 4.41,
    feeDash: 0.00001,
    feeUSD: 0,
    minTransactionFee: 1000, // 0 seems to give the "insufficient priority" error
    transactionFee: 1000, // 0 seems to give the "insufficient priority" error
    // serialize: { disableDustOutputs: true, disableSmallFees: true },
    // dashMultiple: 1000000,
    SATOSHIS_PER_DASH: 100000000,
    outputsPerTransaction: 1000, // theroetically 1900 (100kb transaction),
    // reclaimDirty: true,
    UTXO_BATCH_MAX: 40, //100
    updatingFeeUSD: false,
    updateAmountUSD: false,
    wallets: [],
  }

  componentDidUpdate() {
    this.persistWallets()
  }

  createStoredWallet(name) {
    const key = new Bitcore.PrivateKey()
    const address = {
      publicKey: key.toAddress().toString(),
      privateKey: key.toWIF(),
      amount: 0,
    }
    window.localStorage.setItem(name, JSON.stringify(address))
    return address
  }

  getWalletPublicKey = wallet => wallet.publicKey

  async performInspection(addresses, baseURL) {
    if (!addresses) {
      return Promise.reject('No addresses provided')
    }

    try {
      const fetchOptions = {
        mode: 'cors',
        method: 'POST',
        body: JSON.stringify({
          addrs: addresses.join(','),
        }),
      }
      const walletJSON = await window.fetch(`${baseURL}/addrs/utxo`, fetchOptions)
      return walletJSON.json()
    } catch (e) {
      return Promise.reject(`An error occurred while trying to inspect wallets ${addresses.join(',')}`)
    }
  }

  async inspectWallets(wallets) {
    const transactions = !Array.isArray(wallets) ? [[wallets.publicKey]] : wallets
      .reduce((prev, wallet, i) => {
        const index = i / MAX_INSPECTION_BATCH
        if (!prev[index]) {
          prev[index] = [wallet.publicKey]
        } else {
          prev[index].push(wallet.publicKey)
        }
        return prev
      }, [])

    return transactions.reduce(async (prev, wallets) => {
      await prev
      const resultsJSON = await this.performInspection(wallets)
      const results = resultsJSON.json()
      return [
        ...prev,
        results,
      ]
    }, [])
  }

  getStoredWallet(name) {
    let address = JSON.parse(window.localStorage.getItem(name) || null)

    if (address && address.privateKey) {
      try {
        new Bitcore.PrivateKey(address.privateKey)
        return address
      } catch (e) {
        return this.createStoredWallet(name)
      }
    } else {
      return this.createStoredWallet(name)
    }
  }

  getWallets() {
    return JSON.parse(window.localStorage.getItem('wallets')) || {}
  }

  generateWallets() {
    console.log('generateWallets:')

    const walletQuantity = parseInt(this.state.walletQuantity) || 1
    const wallets = new Array(walletQuantity).fill(null).map(() => {
      const bitKey = new Bitcore.PrivateKey()
      return {
        privateKey: bitKey.toWIF(),
        publicKey: bitKey.toAddress().toString(),
        amount: 0,
        created: Date.now(),
      }
    })
    console.log(wallets)

    this.setState({ wallets, csv: this.getWalletCSV(wallets) })
  }

  getWalletCSV(wallets = this.state.wallets) {
    return wallets
      .map(({ publicKey, privateKey, amount }, i) => `${i + 1},${publicKey},${privateKey},${amount}`)
      .join('\n')
  }

  // estimateFee(wallets = this.state.wallets) {
  //   const transaction = new bitcore.Transaction()
  //
  //   wallets.forEach(({publicKey}) => {
  //     transaction.to(new Bitcore.Address(publicKey), this.state.walletQuantity)
  //   })
  //   transaction.change(new bitcore.PrivateKey().toAddress())
  //   const fundingWallet = this.state.fundingUtxos || [
  //     // some made-up address with infinite money
  //     {
  //       address: 'XwZ3CBB97JnyYi17tQdzFDhZJYCenwtMU8',
  //       txid: 'af37fad079c34a8ac62a32496485f2f8815ddd8fd1d5ffec84f820a91d82a7fc',
  //       vout: 2,
  //       scriptPubKey: '76a914e4e0cc1758622358f04c7d4d6894201c7ca3a44788ac',
  //       amount: 8601,
  //       satoshis: 860100000000,
  //       height: 791049,
  //       confirmations: 6,
  //     },
  //   ]
  //   opts.utxos.forEach(utxo => {
  //     transaction.from(utxo)
  //   })
  //
  //   return transaction.getFee() / this.state.SATOSHIS_PER_DASH
  // }

  getTransactionTotal({
                        walletQuantity,
                        outputsPerTransaction,
                        feeDash,
                        amountDash,
                      } = this.state) {
    const transactionCount = Math.ceil(walletQuantity / outputsPerTransaction)
    const transactionTotal = transactionCount * feeDash
    const dashTotal = amountDash * walletQuantity
    return transactionTotal + dashTotal
  }

  downloadCsv(csv) {
    const hiddenElement = document.createElement('a')
    hiddenElement.href = 'data:text/csv;base64,' + btoa(csv)
    hiddenElement.target = '_blank'
    hiddenElement.download = 'dash-paper-wallets.csv'
    hiddenElement.click()
  }

  _parseFileCsv(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.addEventListener('error', reject)
      reader.addEventListener('load', e => resolve(e.target.result))
      reader.readAsText(file)
    })
  }

  importFileCsv(file) {
    this._parseFileCsv(file)
      .then(csv => {
        this.setState({ csv })
      })
  }

  pasteCsv() {
    this.setState({ csv: ' ' })
  }

  handleChange(input, value) {
    this.setState({ [input]: value })
  }

  handleAmountChange = value => {
    console.log(value)
    this.setState({
      amountDash: value.dash,
      amountUSD: value.usd,
      updatingAmountUSD: value.updatingUSD,
    })
  }

  handleTransactionChange = value => {
    this.setState({
      feeDash: value.dash,
      feeUSD: value.usd,
      updatingFeeUSD: value.updatingUSD,
    })
  }

  // disburse({ dsts, amount, src, utxos, fee }) {
  //   const transaction = new Bitcore.Transaction()
  //   transaction.change(new Bitcore.PrivateKey(src).toAddress())
  //
  //   dsts.forEach(publicKey => transaction.to(new Bitcore.Address(publicKey), amount))
  //   utxos.forEach(utxo => transaction.from(utxo))
  //
  //   if ('number' === typeof fee && !isNaN(fee)) {
  //     transaction.fee(fee)
  //   }
  //   return transaction
  //     .sign(new Bitcore.PrivateKey(src))
  //     .serialize({ disableDustOutputs: true, disableSmallFees: true })
  // }

  // /*getPrivateKeyFromPublic = key => new bitcore.PrivateKey(key).toAddress().toString()
  //
  // getKeyPairFromKey(key, obj = {}) {
  //   if (34 === key.length) {
  //     obj.publicKey = key
  //   } else if (52 === key.length || 51 === key.length) {
  //     obj.privateKey = key
  //     obj.publicKey = DashDrop._privateToPublic(key)
  //   } else {
  //     return null
  //   }
  //
  //   return obj
  // }*/

  // async commitDisbursement(data) {
  //   const { wallets, outputsPerTransaction } = this.state
  //   const results = {
  //     error: false,
  //     results: [],
  //   }
  //   // The logic here is built such that multiple funding private keys could be used in the future
  //   const fundingKeypair = this.getKeyPairFromKey(data.fundingKey)
  //   if (!data.fundingKey || !fundingKeypair.privateKey) {
  //     throw new Error(
  //       'Please choose a Private Key with sufficient funds as a funding source.',
  //     )
  //   }
  //
  //   const transactions = new Array(wallets.length / outputsPerTransaction)
  //     .fill(undefined)
  //     .map((value, i) => wallets.slice(i * outputsPerTransaction), (i + 1) * outputsPerTransaction)
  //
  //   for (const i in transactions) {
  //     results.results[i] = await this.sendDisbursement(transactions[i])
  //   }
  //
  //   return results
  // }

  // async sendDisbursement(wallets) {
  //   if (!wallets || !wallets.length) {
  //     return Promise.reject('No wallets provided')
  //   }
  //
  //   const transactions = this.disburse({
  //     utxos: data.fundingUtxos,
  //     src: data.fundingKey,
  //     dsts: wallets.map(({ publicKey }) => publicKey).filter(Boolean),
  //     amount: config.walletAmount,
  //     fee: config.transactionFee || undefined,
  //   })
  //   console.log('transaction: ', transactions)
  //
  //   const url = `${config.insightBaseUrl}/tx/send`
  //   const headers = {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ rawtx: transactions }),
  //   }
  //
  //   try {
  //     const response = await window.fetch(url, headers)
  //     const results = await response.json()
  //     console.log('results: ', results)
  //
  //     this.setState(prevState = ({
  //       wallets: prevState.wallets.map(wallet => ({
  //         ...wallet,
  //         updated: Date.now(),
  //       })),
  //     }))
  //
  //     return results
  //   } catch (e) {
  //     console.error('Disburse Commit Transaction Error:', err)
  //     throw err
  //   }
  // }

  persistWallets() {
    const savedWallets = JSON.parse(window.localStorage.getItem('wallets')) || {}

    const wallets = this.state.wallets.reduce((prev, wallet) => {
      return Object.assign(prev, {
        [wallet.publicKey]: {
          saved: Date.now(),
          ...wallet,
        },
      })
    }, {})
    const newWallets = Object.assign({}, savedWallets, wallets)
    window.localStorage.setItem('wallets', JSON.stringify(newWallets))


    const savedTransactions = JSON.parse(window.localStorage.getItem('transactions')) || []

    const transactions = [
      Object.keys(wallets),
      ...savedTransactions.slice(9),
    ]
    window.localStorage.setItem('transactions', JSON.stringify(transactions))

    return newWallets
  }

  render() {
    const { noFunds, sourcePublicKey, walletQuantity, csv, amountDash, amountUSD, updatingAmountUSD, feeDash, feeUSD, updatingFeeUSD } = this.state
    console.info(sourcePublicKey)
    const transactionTotal = this.getTransactionTotal()
    console.log(this.state)
    return (
      <Card className={style.root} title="Import existing wallets or generate new ones">
        <div className={style.wrapper}>
          <div className={style.existing}>
            <h4>Import Existing</h4>
            <p>Upload or paste CSV file to import an existing batch of wallets</p>
            <div className={style.dropzone} style={{ display: 'none' }}>
              <img src="/img/icon-upload-arrow.svg" alt='upload'/>
            </div>
            <div className={style.importButtons}>
              <Button primary onClick={() => this.pasteCsv()}>
                Paste CSV
              </Button>
              <Button primary>Upload CSV</Button>
            </div>
            <input
              type="file"
              className={style.file}
              onChange={e => this.importFileCsv(e.target.files[0])}
              accept="text/*"
            />
          </div>

          <div className={style.or}>OR</div>

          <div className={style.new}>
            <h4>Generate New</h4>
            <p>Input how many new, empty wallets you'd like to generate.</p>
            <Input
              label="Number of wallets"
              type="number"
              placeholder="ex: 10"
              value={walletQuantity}
              onChange={e => this.handleChange('walletQuantity', e.target.value)}
            />

            <Button primary type="button" onClick={() => this.generateWallets()}>
              Generate
            </Button>
          </div>
        </div>
        {csv && (
          <Fragment>
            <div className={style.textarea}>
              <textarea
                value={csv}
                onChange={e => this.handleChange('csv', e.target.value)}
              />
            </div>
            <div className={style.save}>
              <Portal>
                <div className="dd-print-only">{csv}</div>
              </Portal>
              <div>
                <span className={style.warning}>Save CSV file before proceeding</span>
                <p>
                  If you lose this file, all the money you put into these wallets will be
                  lost!
                </p>
              </div>
              <div className={style.saveActions}>
                <div>
                  <Button primary onClick={() => window.print()}>
                    Print
                  </Button>
                </div>
                <div>
                  <Button primary onClick={() => this.downloadCsv(csv)}>
                    Download&nbsp;.csv
                  </Button>
                </div>
              </div>
            </div>
            <div className={style.inputsRow}>
              <InputPair
                label="Amount per Wallet"
                dash={amountDash}
                usd={amountUSD}
                updatingUSD={updatingAmountUSD}
                onChange={this.handleAmountChange}
              />
              <InputPair
                label="Per Transaction Fee"
                dash={feeDash}
                usd={feeUSD}
                updatingUSD={updatingFeeUSD}
                onChange={this.handleTransactionChange}
              />
              <InputPair
                label="Total"
                dash={transactionTotal.toFixed(5)}
                disabled={true}
              />
            </div>
            <div className={style.key_outer_container}>
              <div className={style.qr__container}>
                <QRCode
                  style={{ width: 256 }}
                  bgColor="#CCFFFF"
                  value={`dash:${sourcePublicKey}?amount=${transactionTotal}`}
                />
              </div>
              <div className={noFunds ? style.key__container__error : style.key__container}>
                <label>Or input existing Private Key:</label>
                {noFunds && (
                  <span>
                    Supply a funding source with sufficient Dash
                  </span>
                )}
                <input type="text"
                       placeholder="ex: Xyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"
                       className={style.key__input}
                       value={sourcePublicKey}
                />
                <div className={style.balance__container}>
                  <label>Current Balance:</label>
                  <span className={style.balance__amount}>0.0000 Dash</span>
                  <span className={style.balance__amount}>0.00 USD</span>
                  <button className={style.key__button}>Recheck Balance</button>
                </div>
              </div>
            </div>
          </Fragment>
        )}
      </Card>
    )
  }
}

export default Generate

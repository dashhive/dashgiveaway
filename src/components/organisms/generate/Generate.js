import React, { Fragment } from 'react'
import Bitcore from 'bitcore-lib-dash'
import { Portal } from 'react-portal'
import { QRCode } from 'react-qr-svg'
import Button from '../../atoms/button/Button'
import Input from '../../atoms/input/Input'
import InputPair from '../input-pair/InputPair'
import Card from '../../molecules/card/card'
import s from './Generate.css'

class Generate extends React.Component {
  state = {
    csv: null,
    walletQuantity: 100,
    transactionTotal: 0,
    fundingTotal: 0,
    fundingKeyPublic: 0,
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
  }

  componentDidUpdate() {
    this.persistWallets()
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

  // _updateFundingQr(fundingKeyPublic) {
  //   console.log('fundingTotal:', this.state.fundingTotal)
  //   var qrPublic = new QRCode({
  //     element: document.querySelector('.js-funding-qr-public'),
  //     value:
  //       'dash:' +
  //       fundingKeyPublic +
  //       '?amount=' +
  //       (window.DashDrop.create().toDash(this.state.transactionTotal) || 0),
  //     size: 256,
  //     background: '#CCFFFF',
  //   })
  // }

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
    console.log(savedWallets)

    const wallets = this.state.wallets.reduce((prev, wallet) => {
      return Object.assign(prev, {
        [wallet.publicKey]: {
          saved: Date.now(),
          ...wallet,
        },
      })
    })
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
    const transactionTotal = this.getTransactionTotal()
    console.log(this.state)
    return (
      <Card className={s.root} title="Import existing wallets or generate new ones">
        <div className={s.wrapper}>
          <div className={s.existing}>
            <h4>Import Existing</h4>
            <p>Upload or paste CSV file to import an existing batch of wallets</p>
            <div className={s.dropzone} style={{ display: 'none' }}>
              <img src="/img/icon-upload-arrow.svg" alt='upload'/>
            </div>
            <div className={s.importButtons}>
              <Button primary onClick={() => this.pasteCsv()}>
                Paste CSV
              </Button>
              <Button primary>Upload CSV</Button>
            </div>
            <input
              type="file"
              className={s.file}
              onChange={e => this.importFileCsv(e.target.files[0])}
              accept="text/*"
            />
          </div>

          <div className={s.or}>OR</div>

          <div className={s.new}>
            <h4>Generate New</h4>
            <p>Input how many new, empty wallets you'd like to generate.</p>
            <Input
              label="Number of wallets"
              type="number"
              placeholder="ex: 10"
              value={this.state.walletQuantity}
              onChange={e => this.handleChange('walletQuantity', e.target.value)}
            />

            <Button primary type="button" onClick={() => this.generateWallets()}>
              Generate
            </Button>
          </div>
        </div>
        {this.state.csv && (
          <Fragment>
            <div className={s.textarea}>
              <textarea
                value={this.state.csv}
                onChange={e => this.handleChange('csv', e.target.value)}
              />
            </div>
            <div className={s.save}>
              <Portal>
                <div className="dd-print-only">{this.state.csv}</div>
              </Portal>
              <div>
                <span className={s.warning}>Save CSV file before proceeding</span>
                <p>
                  If you lose this file, all the money you put into these wallets will be
                  lost!
                </p>
              </div>
              <div className={s.saveActions}>
                <div>
                  <Button primary onClick={() => window.print()}>
                    Print
                  </Button>
                </div>
                <div>
                  <Button primary onClick={() => this.downloadCsv(this.state.csv)}>
                    Download&nbsp;.csv
                  </Button>
                </div>
              </div>
            </div>
            <div className={s.inputsRow}>
              <InputPair
                label="Amount per Wallet"
                dash={this.state.amountDash}
                usd={this.state.amountUSD}
                updatingUSD={this.state.updatingAmountUSD}
                onChange={this.handleAmountChange}
              />
              <InputPair
                label="Per Transaction Fee"
                dash={this.state.feeDash}
                usd={this.state.feeUSD}
                updatingUSD={this.state.updatingFeeUSD}
                onChange={this.handleTransactionChange}
              />
              <InputPair
                label="Total"
                dash={transactionTotal.toFixed(5)}
                disabled={true}
              />
            </div>
            <QRCode
              style={{ width: 256 }}
              bgColor="#CCFFFF"
              value={`dash:${
                this.state.fundingKeyPublic
                }?amount=${window.DashDrop.create().toDash(transactionTotal) ||
              0}`}
            />
          </Fragment>
        )}
      </Card>
    )
  }
}

export default Generate

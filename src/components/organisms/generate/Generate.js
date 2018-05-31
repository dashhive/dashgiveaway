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
    amountDash: '0.01',
    amountUSD: '4.41',
    feeDash: '0.0004',
    feeUSD: '0.17',
    totalDash: '1.0004',
    totalUSD: '441.50',
    minTransactionFee: 1000, // 0 seems to give the "insufficient priority" error
    transactionFee: 1000, // 0 seems to give the "insufficient priority" error
    serialize: { disableDustOutputs: true, disableSmallFees: true },
    dashMultiple: 1000000,
    SATOSHIS_PER_DASH: 100000000,
    outputsPerTransaction: 1000, // theroetically 1900 (100kb transaction),
    reclaimDirty: true,
    UTXO_BATCH_MAX: 40, //100
    updatingUSD: false,
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.data !== this.state.data) {
      this.setState({
        transactionFee: this.estimateFee(this.state.data),
        fundingKeyPublic: this.state.data.fundingKeyPublic,
      })
    }
  }

  getWallets() {
    const wallets = []

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (!/^dash:/.test(key)) {
        continue
      }

      const item = localStorage.getItem(key)
      const dashKey = key.replace(/^dash:/, '')
      let keypair

      try {
        keypair = JSON.parse(item)
        if (!isNaN(keypair)) {
          keypair = { amount: keypair }
        }
      } catch (e) {
        keypair = { amount: parseInt(item, 10) || 0 }
      }

      if (!keypair || !keypair.publicKey) {
        keypair = window.DashDrop.create()._keyToKeypair(dashKey, keypair)
      }

      if (!keypair) {
        console.warn('Not a valid cached key:', dashKey, item)
        continue
        //return;
      }

      wallets.push(keypair)
    }

    return wallets
  }

  generateWallets() {
    console.log('generateWallets:')
    const { walletQuantity } = this.state
    const data = {
      keypairs: this.getWallets()
        .filter(({ privateKey, amount }) => privateKey && !amount),
    }

    //data.privateKeys
    for (let i = data.keypairs.length; i < walletQuantity; i++) {
      const bitKey = new Bitcore.PrivateKey()
      data.keypairs.push({
        privateKey: bitKey.toWIF(),
        publicKey: bitKey.toAddress().toString(),
        amount: 0,
      })
    }
    data.keypairs = data.keypairs.slice(0, walletQuantity)
    const csv = window.DashDrop.create()._toCsv(data.keypairs)
    // data.csv = DashDom._toCsv(csv)

    this.setState({ data, csv })
    // view.csv.show()
  }

  estimateFee(data) {
    // create new private key
    const bitkey = new Bitcore.PrivateKey()
    const txOpts = {
      // converts to wallet format
      src: bitkey.toWIF(),
      // distribute to all provided keys
      dsts: data.keypairs.map(kp => kp.publicKey),
      amount: this.state.walletQuantity,
      utxos: data.fundingUtxos || [
        // some made-up address with infinite money
        {
          address: 'XwZ3CBB97JnyYi17tQdzFDhZJYCenwtMU8',
          txid: 'af37fad079c34a8ac62a32496485f2f8815ddd8fd1d5ffec84f820a91d82a7fc',
          vout: 2,
          scriptPubKey: '76a914e4e0cc1758622358f04c7d4d6894201c7ca3a44788ac',
          amount: 8601,
          satoshis: 860100000000,
          height: 791049,
          confirmations: 6,
        },
      ],
    }
    return window.DashDrop.create().estimateFee(txOpts) / this.state.SATOSHIS_PER_DASH
  }

  getTransactionTotal() {
    const {
      walletQuantity,
      outputsPerTransaction,
      transactionFee,
      amountDash,
    } = this.state
    const transactionCount = Math.ceil(walletQuantity / outputsPerTransaction)
    const transactionTotal = transactionCount * transactionFee
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

  handleDashChange = value => {
    this.setState({
      amountDash: value.dash,
      amountUSD: value.usd,
      updatingUSD: value.updatingUSD,
    })
  }

  handleTransactionChange = value => {
    this.setState({
      transactionFee: value.dash,
    })
  }

  persistWallets() {

  }

  render() {
    const transactionTotal = this.getTransactionTotal()
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
                updatingUSD={this.state.updatingUSD}
                onChange={this.handleDashChange}
              />
              <InputPair
                label="Per Transaction Fee"
                dash={this.state.transactionFee.toFixed(4)}
                onChange={this.handleTransactionChange}
              />
              <InputPair
                label="Total"
                dash={transactionTotal.toFixed(4)}
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

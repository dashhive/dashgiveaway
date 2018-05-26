import React from 'react'
import bitcore from 'bitcore-lib-dash'
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
    minTransactionFee: 1000, // 1000 // 0 seems to give the "insufficient priority" error
    transactionFee: 1000, // 1000 // 0 seems to give the "insufficient priority" error
    walletAmount: 1000000,
    serialize: { disableDustOutputs: true, disableSmallFees: true },
    dashMultiple: 1000000,
    SATOSHIS_PER_DASH: 100000000,
    outputsPerTransaction: 1000, // theroetically 1900 (100kb transaction),
    reclaimDirty: true,
    UTXO_BATCH_MAX: 40, //100
    transactionCount: 0,
  }

  generateWallets() {
    console.log('generateWallets:')
    let data = []
    data.keypairs = this._getWallets().filter(function(keypair) {
      if (keypair.privateKey && !keypair.amount) {
        return true
      }
    })
    const walletQuantity = parseInt(this.state.walletQuantity, 10)
    var i
    var bitkey

    //data.privateKeys
    for (i = data.keypairs.length; i < walletQuantity; i += 1) {
      bitkey = new bitcore.PrivateKey()
      data.keypairs.push({
        privateKey: bitkey.toWIF(),
        publicKey: bitkey.toAddress().toString(),
        amount: 0,
      })
    }
    data.keypairs = data.keypairs.slice(0, walletQuantity)
    var csv = window.DashDrop.create()._toCsv(data.keypairs)
    console.log(csv)
    this.setState({ csv })
    // data.csv = DashDom._toCsv(csv)

    const transactionFee = this.estimateFee(data)
    this.setState({ transactionFee })
    console.log(transactionFee)
    this.updateTransactionTotal(data)
    // view.csv.show()
  }

  estimateFee(data) {
    var bitkey = new bitcore.PrivateKey()
    var txOpts = {
      src: bitkey.toWIF(),
      dsts: data.keypairs.map(function(kp) {
        return kp.publicKey
      }),
      amount: this.state.walletQuantity,
      // some made-up address with infinite money
      utxos: data.fundingUtxos || [
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
    return window.DashDrop.create().estimateFee(txOpts)
  }

  updateTransactionTotal(data) {
    console.log('update transaction total', this.state.walletQuantity)
    // TODO you can only have one transaction per UTXO
    const transactionCount = Math.ceil(
      this.state.walletQuantity / this.state.outputsPerTransaction,
    )
    this.setState({ transactionCount })
    const estimatedTransactionFee = this.estimateFee(data)
    this.setState({ estimatedTransactionFee })
    const transactionTotal =
      this.state.transactionCount * this.state.transactionFee +
      this.state.walletAmount * this.state.walletQuantity

    this.setState({ transactionTotal })
    // $('input.js-transaction-fee-dash').val(DashDrop.toDash(config.transactionFee))
    // $('span.js-transaction-fee-dash').text(DashDrop.toDash(config.transactionFee))
    // $('input.js-transaction-fee-usd').val(DashDrop.toUsd(config.transactionFee))
    // $('span.js-transaction-fee-usd').text(DashDrop.toUsd(config.transactionFee))
    // $('.js-transaction-count').val(config.transactionCount)
    // $('.js-transaction-count').text(config.transactionCount)
    // $('input.js-transaction-total').val(DashDrop.toDash(config.transactionTotal))
    // $('span.js-transaction-total').text(DashDrop.toDash(config.transactionTotal))
    // $('input.js-transaction-total-usd').val(DashDrop.toUsd(config.transactionTotal))
    // $('span.js-transaction-total-usd').text(DashDrop.toUsd(config.transactionTotal))
    // if (data.fundingKey && config.transactionTotal <= data.fundingTotal) {
    //   $('.js-transaction-commit-error').addClass('hidden')
    //   $('button.js-transaction-commit').prop('disabled', false)
    // } else {
    //   $('.js-transaction-commit-error').removeClass('hidden')
    //   $('button.js-transaction-commit').prop('disabled', true)
    // }
    // DashDom._updateFundingQr(data.fundingKeyPublic)
    this.setState({ fundingKeyPublic: data.fundingKeyPublic })
  }

  _getWallets() {
    var i
    var len = localStorage.length
    var key
    var wallets = []
    var dashkey
    var keypair

    for (i = 0; i < len; i += 1) {
      key = localStorage.key(i)
      if (!/^dash:/.test(key)) {
        continue
        //return;
      }

      try {
        keypair = JSON.parse(localStorage.getItem(key))
        if (!isNaN(keypair)) {
          keypair = { amount: keypair }
        }
      } catch (e) {
        keypair = { amount: parseInt(localStorage.getItem(key), 10) || 0 }
      }

      dashkey = key.replace(/^dash:/, '')

      if (!keypair || !keypair.publicKey) {
        keypair = window.DashDrop.create()._keyToKeypair(dashkey, keypair)
      }

      if (!keypair) {
        console.warn('Not a valid cached key:', dashkey, localStorage.getItem(key))
        continue
        //return;
      }

      wallets.push(keypair)
    }

    return wallets
  }

  downloadCsv(csv) {
    const hiddenElement = document.createElement('a')
    hiddenElement.href = 'data:text/csv;base64,' + btoa(csv)
    hiddenElement.target = '_blank'
    hiddenElement.download = 'dash-paper-wallets.csv'
    hiddenElement.click()
  }

  _parseFileCsv(file, cb) {
    const reader = new FileReader()
    reader.addEventListener('error', () => {
      window.alert('Error parsing CSV')
    })
    reader.addEventListener('load', ev => {
      const csv = ev.target.result
      // $('.js-paper-wallet-keys').val(data.csv);
      console.log('data.csv:')
      console.log(csv)
      // DashDom._updateWalletCsv($('.js-paper-wallet-keys'));
      // console.log('data.keypairs:')
      // console.log(data.keypairs)
      cb(csv)
    })
    reader.readAsText(file)
  }

  importFileCsv(file) {
    console.log(file)
    this._parseFileCsv(file, csv => {
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

  render() {
    return (
      <Card className={s.root} title="Import existing wallets or generate new ones">
        <div className={s.wrapper}>
          <div className={s.existing}>
            <h4>Import Existing</h4>
            <p>Upload or paste CSV file to import an existing batch of wallets</p>
            <div className={s.dropzone} style={{ display: 'none' }}>
              <img src="/img/icon-upload-arrow.svg"/>
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
        <div className={s.textarea}>
          {this.state.csv && (
            <textarea
              value={this.state.csv}
              onChange={e => this.handleChange('csv', e.target.value)}
            />
          )}
        </div>
        {this.state.csv && (
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
        )}
        {this.state.csv && (
          <div className={s.inputsRow}>
            <InputPair label="Amount per Wallet" dash={this.state.amountDash}/>
            <InputPair
              label="Per Transaction Fee"
              dash={this.state.transactionFee / this.state.SATOSHIS_PER_DASH}
            />
            <InputPair
              label="Total"
              dash={this.state.transactionTotal / this.state.SATOSHIS_PER_DASH}
            />
          </div>
        )}
        {this.state.csv && (
          <QRCode
            style={{ width: 256 }}
            bgColor="#CCFFFF"
            value={`dash:${
              this.state.fundingKeyPublic
              }?amount=${window.DashDrop.create().toDash(this.state.transactionTotal) ||
            0}`}
          />
        )}
      </Card>
    )
  }
}

export default Generate

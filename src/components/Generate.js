import React from 'react'
import Button from 'atoms/Button'
import bitcore from 'bitcore-lib-dash'
import s from './Generate.css'

class Generate extends React.Component {
  state = {
    csv: null,
  }
  generateWallets() {
    console.log('generateWallets:')
    let data = []
    data.keypairs = this._getWallets().filter(function(keypair) {
      if (keypair.privateKey && !keypair.amount) {
        return true
      }
    })
    const walletQuantity = 100
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

    // config.transactionFee = DashDom.estimateFee(config, data)
    // DashDom.updateTransactionTotal()
    // view.csv.show()
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

  render() {
    return (
      <div className={s.root}>
        <h3>Import existing wallets or generate new ones</h3>
        <div className={s.wrapper}>
          <div className={s.existing}>
            <h4>Import Existing</h4>
            <p>Upload or paste CSV file to import an existing batch of wallets</p>
            <div className={s.dropzone} style={{ display: 'none' }}>
              <img src="/img/icon-upload-arrow.svg" />
            </div>
            <div className={s.importButtons}>
              <Button primary>Paste CSV</Button>
              <Button primary>Upload CSV</Button>
              <input type="file" className={s.file} accept="text/*" />
            </div>
          </div>

          <div className={s.or}>OR</div>

          <div className={s.new}>
            <h4>Generate New</h4>
            <p>Input how many new, empty wallets you'd like to generate.</p>
            <label className={s.round}>
              {' '}
              Number of wallets
              <input type="number" placeholder="ex: 10" />
            </label>
            <Button primary type="button" onClick={() => this.generateWallets()}>
              Generate
            </Button>
          </div>
        </div>
        <div className={s.textarea}>
          {this.state.csv && <textarea>{this.state.csv}</textarea>}
        </div>
      </div>
    )
  }
}

export default Generate

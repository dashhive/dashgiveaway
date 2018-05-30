;(() => {
  const bitcore = require('bitcore-lib-dash')
  const SATOSHIS_PER_DASH = 100000000

  function create() {
    const DashDrop = {}
    let config
    let data
    let store

    DashDrop.init = (_config, _data, _localStorage) => {
      config = _config
      data = _data
      store = _localStorage || localStorage
    }

    // The native unit is the (dash) satoshi
    // 10000 dash satoshi is 0.0001 dash
    DashDrop.toUsd = s =>
      (parseFloat(DashDrop.toDash(s), 10) * config.conversions.dash_usd)
        .toFixed(3)
        .replace(/.$/, '')
    DashDrop.fromUsd = dollar =>
      DashDrop.fromDash((parseFloat(dollar, 10) / config.conversions.dash_usd).toFixed(8))
    DashDrop.fromDash = d =>
      parseInt((parseFloat(d, 10) * SATOSHIS_PER_DASH).toFixed(0), 10)
    DashDrop.toDash = DashDrop.fromSatoshi = (
      s, // technically toFixed(8), but practically only 4 digits matter (cents, dust)
    ) => parseFloat((parseFloat(s, 10) / SATOSHIS_PER_DASH).toFixed(4), 10)

    DashDrop._getSourceAddress = () =>
      DashDrop._getOrCreateAddress('source-address', 'sourceAddress')
    DashDrop._getReclaimAddress = () =>
      DashDrop._getOrCreateAddress('reclaim-address', 'reclaimAddress')
    DashDrop._getOrCreateAddress = (name, key) => {
      let bitkey
      data[key] = JSON.parse(store.getItem(name) || null)

      if (data[key] && data[key].privateKey) {
        bitkey = new bitcore.PrivateKey(data[key].privateKey)
      } else {
        data[key] = null
      }

      if (!data[key]) {
        bitkey = new bitcore.PrivateKey()
        data[key] = {
          publicKey: bitkey.toAddress().toString(),
          privateKey: bitkey.toWIF(),
          amount: 0,
        }
        store.setItem(name, JSON.stringify(data[key]))
      }

      console.log(`data.${key}`)
      console.log(data[key])
      return data[key]
    }
    DashDrop._privateToPublic = sk => new bitcore.PrivateKey(sk).toAddress().toString()
    DashDrop._keypairToPublicKey = (
      { publicKey }, //new Bitcore.PrivateKey(sk).toAddress().toString();
    ) => publicKey
    // opts = { utxo, src, dsts, amount, fee }
    DashDrop.estimateFee = opts => {
      const tx = new bitcore.Transaction()

      opts.dsts.forEach(publicKey => {
        tx.to(new bitcore.Address(publicKey), opts.amount)
      })
      tx.change(opts.change || new bitcore.PrivateKey(opts.src).toAddress())
      opts.utxos.forEach(utxo => {
        tx.from(utxo)
      })

      return tx.getFee()
    }
    DashDrop.disburse = opts => {
      const tx = new bitcore.Transaction()

      opts.dsts.forEach(publicKey => {
        tx.to(new bitcore.Address(publicKey), opts.amount)
      })
      tx.change(new bitcore.PrivateKey(opts.src).toAddress())
      opts.utxos.forEach(utxo => {
        tx.from(utxo)
      })
      if ('number' === typeof opts.fee && !isNaN(opts.fee)) {
        tx.fee(opts.fee)
      }
      return tx
        .sign(new bitcore.PrivateKey(opts.src))
        .serialize({ disableDustOutputs: true, disableSmallFees: true })
    }

    DashDrop.createTx = opts => {
      const tx = new bitcore.Transaction()
      let addr
      //var sum = 0;
      //var total;

      opts.utxos.forEach(utxo => {
        //sum += utxo.satoshis;
        tx.from(utxo)
      })
      //total = sum;

      if ('number' === typeof opts.fee && !isNaN(opts.fee)) {
        console.log('1 opts.fee:', opts.fee)
        if (opts.utxos.length > 1) {
          // I'm not actually sure what the fee schedule is, but this worked for me
          opts.fee = Math.max(
            opts.fee,
            config.minTransactionFee * 2 /*opts.utxos.length*/,
          )
          console.log('2 opts.fee:', opts.fee, config.minTransactionFee * 2)
        }
        //sum -= (opts.fee);
        console.log('3 opts.fee:', opts.fee)
        tx.fee(opts.fee)
      }

      addr = DashDrop._keyToKeypair(opts.dst).publicKey
      if (!addr) {
        window.alert('invalid key format')
        throw new Error('unexpected key format')
      }

      //tx.to(addr);
      tx.change(addr)

      opts.srcs.forEach(sk => {
        tx.sign(new bitcore.PrivateKey(sk))
      })

      return tx
    }
    DashDrop.estimateReclaimFee = (opts, cb) => {
      const utxos = opts.utxos.slice()
      let fee = 0
      const len = utxos.length
      let total = 0
      opts.dst = opts.dst || new bitcore.PrivateKey().toAddress().toString()

      function next() {
        if (!utxos.length) {
          if (cb) {
            cb(null, fee)
          }
          return fee
        }
        opts.utxos = utxos.splice(0, config.UTXO_BATCH_MAX)
        fee += DashDrop.createTx(opts).getFee()
        total += opts.utxos.length
        if (opts.progress) {
          return Promise.resolve(opts.progress({ length: len, total })).then(next)
        } else {
          return next()
        }
      }

      if (opts.progress) {
        return Promise.resolve(opts.progress({ length: len, total })).then(next)
      } else {
        return next()
      }
    }
    // opts = { utxos, srcs, dst, fee }
    DashDrop.reclaimTx = opts => {
      const tx = DashDrop.createTx(opts)

      return tx.serialize({ disableDustOutputs: true, disableSmallFees: true })
    }

    DashDrop._keyToKeypair = (key, obj) => {
      obj = obj || {}
      if (34 === key.length) {
        obj.publicKey = key
      } else if (52 === key.length || 51 === key.length) {
        obj.privateKey = key
        obj.publicKey = DashDrop._privateToPublic(key)
      } else {
        return null
      }

      return obj
    }
    DashDrop._toCsv = keypairs => {
      let csv = '' //'# = ' + keypairs.length;
      csv += keypairs
        .map(
          ({ publicKey, privateKey, amount }, i) =>
            `${i + 1},${JSON.stringify(publicKey)},${JSON.stringify(privateKey) ||
              ''},${amount || 0}`,
        )
        .join('\n')
      return csv
    }
    DashDrop._updateWalletCsv = csv => {
      const publicKeysMap = {}
      const keypairs = csv
        .split(/[,\n\r\s]+/gm)
        .map(key => {
          let kp
          key = key.replace(/["']/g, '')
          kp = DashDrop._keyToKeypair(key)
          if (!kp) {
            return null
          }
          if (publicKeysMap[kp.publicKey]) {
            if (!publicKeysMap[kp.publicKey].privateKey) {
              publicKeysMap[kp.publicKey].privateKey = kp.privateKey
            }
            return null
          }

          publicKeysMap[kp.publicKey] = kp
          return kp
        })
        .filter(Boolean)
      console.log('keypairs', keypairs)

      keypairs.forEach(({ publicKey }) => {
        const val = store.getItem(`dash:${publicKey}`)
        if (val) {
          publicKeysMap[publicKey].amount = val.amount || Number(val) || 0
        }
      })
      //data.csv = DashDrop._toCsv(keypairs); // DashDom._toCsv(keypairs);

      config.walletQuantity = keypairs.length
      return keypairs
    }
    DashDrop._updateReclaimKey = ({ publicKey, privateKey }) => {
      const addr = publicKey
      data.reclaimKey = privateKey || publicKey

      const url = config.insightBaseUrl + '/addrs/:addrs/utxo'.replace(':addrs', addr)
      return window.fetch(url, { mode: 'cors' }).then(resp =>
        resp.json().then(arr => {
          let cont
          data.reclaimTotal = 0
          data.reclaimUtxos = arr
          arr.forEach(({ confirmations, satoshis }) => {
            if (confirmations >= 6) {
              data.reclaimTotal += satoshis
            } else {
              if (false === cont) {
                return
              }
              if (true !== cont) {
                cont = window.confirm(
                  'Funding source has not had 6 confirmations yet. Continue?',
                )
              }
              if (true === cont) {
                data.reclaimTotal += satoshis
              }
            }
          })

          return data.reclaimTotal
        }),
      )
    }
    DashDrop._updateFundingKey = keypair => {
      const addr = keypair.publicKey
      data.fundingKey = keypair.privateKey || keypair.publicKey
      data.fundingKeyPublic = keypair.publicKey
      data.fundingKeyPair = keypair

      const url = config.insightBaseUrl + '/addrs/:addrs/utxo'.replace(':addrs', addr)
      return window.fetch(url, { mode: 'cors' }).then(resp =>
        resp.json().then(arr => {
          let cont
          data.fundingTotal = 0
          data.fundingUtxos = arr
          arr.forEach(({ confirmations, satoshis }) => {
            if (confirmations >= 6) {
              data.fundingTotal += satoshis
            } else {
              if (false === cont) {
                return
              }
              if (true !== cont) {
                cont = window.confirm(
                  'Funding source has not had 6 confirmations yet. Continue?',
                )
              }
              if (true === cont) {
                data.fundingTotal += satoshis
              }
            }
          })

          const txOpts = {
            src: data.fundingKey,
            dsts: data.keypairs.map(({ publicKey }) => publicKey),
            amount: config.walletAmount,
            utxos: data.fundingUtxos,
          }
          config.transactionFee = DashDrop.estimateFee(txOpts)

          return config.transactionFee
        }),
      )
    }
    DashDrop.inspectWallets = opts => {
      const addrs = opts.wallets.map(DashDrop._keypairToPublicKey)
      const total = addrs.length
      let count = 0
      const addrses = []
      const MAX_BATCH_SIZE = 10
      let set

      while (addrs.length) {
        set = addrs.splice(0, MAX_BATCH_SIZE)
        count += set.length
        addrses.push(set)
      }

      function nextBatch(addrs) {
        if (!addrs) {
          return
        }

        // https://api.dashdrop.coolaj86.com/insight-api-dash/addrs/XbxDxU8ry96ZpXm4wDiFdpRNGiWuXfemNK,Xr7x52ykWX7FmCcuy32zC2F69817vuwywU/utxo
        const url =
          config.insightBaseUrl + '/addrs/:addrs/utxo'.replace(':addrs', addrs.join(','))
        let utxos

        return window
          .fetch(url, { mode: 'cors' })
          .then(
            resp =>
              resp.json().then(_utxos => {
                utxos = _utxos
                console.log('utxos resp.json():', url)
                console.log(utxos)
              }),
            err => {
              console.error('UTXO Error:')
              console.error(err)
              return null
            },
          )
          .then(() => {
            // https://api.dashdrop.coolaj86.com/insight-api-dash/addrs/XbxDxU8ry96ZpXm4wDiFdpRNGiWuXfemNK,Xr7x52ykWX7FmCcuy32zC2F69817vuwywU/txs
            const url =
              config.insightBaseUrl +
              '/addrs/:addrs/txs'.replace(':addrs', addrs.join(','))
            let results

            return window
              .fetch(url, { mode: 'cors' })
              .then(
                resp =>
                  resp.json().then(_results => {
                    results = _results
                    console.log('txs resp.json():', url)
                    console.log(results)
                  }),
                err => {
                  console.error('Transaction Error:')
                  console.error(err)
                },
              )
              .then(() => {
                if ('function' === typeof opts.progress) {
                  if (!results) {
                    results = {}
                  }
                  results.utxos = utxos
                  opts.progress({ data: results, count, total })
                }

                return nextBatch(addrses.shift())
              })
          })
      }

      return nextBatch(addrses.shift())
    }

    DashDrop.commitDisburse = () => {
      // The logic here is built such that multiple funding private keys could be used in the future
      const fundingKeypair = DashDrop._keyToKeypair(data.fundingKey)
      if (!data.fundingKey || !fundingKeypair.privateKey) {
        window.alert(
          'Please choose a Private Key with sufficient funds as a funding source.',
        )
        return
      }

      const keypairs = data.keypairs.slice(0)
      const keysets = []
      while (keypairs.length) {
        keysets.push(keypairs.splice(0, config.outputsPerTransaction))
      }
      if (keysets.length > 1) {
        window.alert(
          `Only the first ${
            config.outputsPerTransaction
          } wallets will be filled (1000 outputs per UTXO per private key).`,
        )
        keysets.length = 1
      }

      function nextTx(x) {
        const keyset = keysets.shift()
        if (!keyset) {
          return Promise.resolve(x)
        }

        const rawTx = DashDrop.disburse({
          utxos: data.fundingUtxos,
          src: data.fundingKey,
          dsts: keyset.map(({ publicKey }) => publicKey).filter(Boolean),
          amount: config.walletAmount,
          fee: config.transactionFee || undefined,
        })
        console.log('transaction:')
        console.log(rawTx)

        const restTx = {
          url: `${config.insightBaseUrl}/tx/send`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawtx: rawTx }),
        }

        keyset.forEach(({ publicKey, privateKey, amount }) => {
          localStorage.setItem(
            `dash:${publicKey}`,
            JSON.stringify({
              privateKey: privateKey,
              publicKey: publicKey,
              amount: (amount || 0) + config.walletAmount,
              commited: false,
            }),
          )
        })

        return window
          .fetch(restTx.url, restTx)
          .then((
            resp, // 258: txn-mempool-conflict. Code:-26
          ) =>
            resp.json().then(result => {
              console.log('result:')
              console.log(result)
              keyset.forEach(({ publicKey, privateKey, amount }) => {
                localStorage.setItem(
                  `dash:${publicKey}`,
                  JSON.stringify({
                    privateKey: privateKey,
                    publicKey: publicKey,
                    amount: (amount || 0) + config.walletAmount,
                    commited: true,
                  }),
                )
              })

              return result
            }),
          )
          .then(
            y => y,
            err => {
              console.error('Disburse Commit Transaction Error:')
              console.error(err)
              window.alert('An error occured. Transaction may have not committed.')
            },
          )
          .then(y => nextTx(y || x))
      }

      return nextTx()
    }

    return DashDrop
  }

  window.DashDrop = { create }
})()

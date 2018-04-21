var DEBUG_DASH_AIRDROP = {};

$(function () {
  'use strict';

  var bitcore = require('bitcore-lib-dash');

  var exampleCsv = [
    '# = 4'
  , '"XjSBXfiAUdrGDJ8TYzSBc2Z5tjexAZao4Q", "7reAg9R74ujxxSj34jpbRpPhfsPt9ytAh3acMehhs1CmfoGFHbh"'
  , '"XunE8skypFR3MHAbu2S3vBZWrWStzQE9f7", "7s8YEQ8LPcCBcWajnwoRYqxCXo5W4AwFrftxQfzoomFGvqYTf8Z"'
  , '"XyGDB8JJhR2s7smACWdWDEV1Lgkg2YeZvH", "7rC9qypu87UCbaDDmAeGGK3JS1TYjLNtT97Nse1E1m7CQaMQSPY"'
  , '"Xsnn4AkwnRDPK3i4CC4MpnhGWcvBKM6bVG", "7qjqyQC7NYWbmRbCq1QfCa3PHZzECjos97WpX3KwWRBc2rxxjcQ"'
  ].join('\n');
  var exampleCsv2 = [
    '1,"XjSBXfiAUdrGDJ8TYzSBc2Z5tjexAZao4Q","7reAg9R74ujxxSj34jpbRpPhfsPt9ytAh3acMehhs1CmfoGFHbh"'
  , '2,"XunE8skypFR3MHAbu2S3vBZWrWStzQE9f7","7s8YEQ8LPcCBcWajnwoRYqxCXo5W4AwFrftxQfzoomFGvqYTf8Z"'
  , '3,"XyGDB8JJhR2s7smACWdWDEV1Lgkg2YeZvH","7rC9qypu87UCbaDDmAeGGK3JS1TYjLNtT97Nse1E1m7CQaMQSPY"'
  , '4,"Xsnn4AkwnRDPK3i4CC4MpnhGWcvBKM6bVG","7qjqyQC7NYWbmRbCq1QfCa3PHZzECjos97WpX3KwWRBc2rxxjcQ"'
  ];

  var config = {
    insightBaseUrl: 'https://insight.dash.org/api'
  // insightBaseUrl: 'https://api.dashdrop.coolaj86.com/insight-api-dash'
  , walletQuantity: 100
  , minTransactionFee: 1000 // 1000 // 0 seems to give the "insufficient priority" error
  , transactionFee: 1000 // 1000 // 0 seems to give the "insufficient priority" error
  , walletAmount: 1000000
  //, walletAmount: 10000
  , serialize: { disableDustOutputs: true, disableSmallFees: true }
    // mdash per dash = 1000
    // udash per dash = 1000000
    // satoshis per dash = 100000000
  , dashMultiple: 1000000
    // 0.00000001
  , SATOSHIS_PER_DASH: 100000000
  , outputsPerTransaction: 1000 // theroetically 1900 (100kb transaction)
  //, reclaimDirty: false
  , reclaimDirty: true
  , UTXO_BATCH_MAX: 40 //100
  };

  var data = {
    keypairs: []
  , fundingUtxos: []
  , reclaimUtxos: []
  };
  var DashDrop = window.DashDrop.create();

  var DashDom = {};
  DashDom.views = {};
  DashDom._hasBalance = function (pk) {
    try {
      return JSON.parse(localStorage.getItem('dash:' + (pk.publicKey || pk.privateKey))).amount;
    } catch(e) {
      return parseInt(localStorage.getItem('dash:' + (pk.publicKey || pk.privateKey)), 10);
    }
  };


  //
  // Insight Base URL
  //
  DashDom.updateInsightBase = function () {
    config.insightBaseUrl = $('.js-insight-base').val().replace(/\/+$/, '');
    //$('.js-insight-base').text(config.insightBaseUrl);
  };

  //
  // Generate Wallets
  //
  DashDom._getWallets = function () {
    var i;
    var len = localStorage.length;
    var key;
    var wallets = [];
    var dashkey;
    var keypair;

    for (i = 0; i < len; i += 1) {
      key = localStorage.key(i);
      if (!/^dash:/.test(key)) {
        continue;
        //return;
      }

      try {
        keypair = JSON.parse(localStorage.getItem(key));
        if (!isNaN(keypair)) {
          keypair = { amount: keypair };
        }
      } catch(e) {
        keypair = { amount: parseInt(localStorage.getItem(key), 10) || 0 };
      }

      dashkey = key.replace(/^dash:/, '');

      if (!keypair || !keypair.publicKey) {
        keypair = DashDrop._keyToKeypair(dashkey, keypair);
      }

      if (!keypair) {
        console.warn("Not a valid cached key:", dashkey, localStorage.getItem(key));
        continue;
        //return;
      }

      wallets.push(keypair);
    }

    return wallets;
  };
  DashDom._toCsv = function (csv) {
    console.log('toCsv:', csv);
    $('.js-paper-wallet-keys').val(csv);
    $('.js-paper-wallet-keys').text(csv);
    return csv;
  };
  DashDom.generateWallets = function () {
    console.log("generateWallets:");
    data.keypairs = DashDom._getWallets().filter(function (keypair) {
      if (keypair.privateKey && !keypair.amount) { return true; }
    });
    config.walletQuantity = $('.js-paper-wallet-quantity').val();
    var i;
    var bitkey;

    //data.privateKeys
    for (i = data.keypairs.length; i < config.walletQuantity; i += 1) {
      bitkey = new bitcore.PrivateKey();
      data.keypairs.push({
        privateKey: bitkey.toWIF()
      , publicKey: bitkey.toAddress().toString()
      , amount: 0
      });
    }
    data.keypairs = data.keypairs.slice(0, config.walletQuantity);
    var csv = DashDrop._toCsv(data.keypairs);
    data.csv = DashDom._toCsv(csv);

    config.transactionFee = DashDom.estimateFee(config, data);
    DashDom.updateTransactionTotal();
    view.csv.show();
  };
  DashDom._debounceWq = null;
  DashDom.updateWalletQuantity = function () {
    DashDom._debounceWq = setTimeout(function () {
      var quantity = parseInt($('.js-paper-wallet-quantity').val(), 10);
      if (quantity > config.outputsPerTransaction) {
        window.alert("Only " + config.outputsPerTransaction + " wallets can be generated at a time");
        quantity = config.outputsPerTransaction;
        $('.js-paper-wallet-quantity').val(quantity);
      }
      if (config.walletQuantity && config.walletQuantity === quantity) {
        return true;
      }
      config.walletQuantity = quantity;

      $('.js-paper-wallet-quantity').text(quantity);

      clearTimeout(DashDom._debounceWq);
        //DashDom.updateTransactionTotal();
        DashDom.generateWallets();
    }, 300);
    return true;
  };
  DashDom.updateWalletCsv = function () {
    var $el = $(this);
    clearTimeout(DashDom.__walletCsv);
    DashDom.__walletCsv = setTimeout(function () {
      DashDom._updateWalletCsv($el);
    }, 750);
  };
  DashDom._updateWalletCsv = function ($el) {
    console.log('keyup on csv');
    var walletCsv = $el.val().trim();
    if (data._walletCsv && data._walletCsv === walletCsv) {
      return true;
    }
    data._walletCsv = walletCsv;
    console.log('walletCsv:', data._walletCsv);

    data.keypairs = DashDrop._updateWalletCsv(walletCsv);
    var csv = DashDrop._toCsv(data.keypairs);
    DashDom._toCsv(csv);
    console.log('updateWalletCsv, inspectWallets');
    DashDom.inspectWallets(data.keypairs);

    $('.js-paper-wallet-quantity').val(data.keypairs.length);
    $('.js-paper-wallet-quantity').text(data.keypairs.length);
  };


  //
  // Load Private Wallet
  //
  DashDom.updateTransactionTotal = function () {
    console.log('update transaction total', config.walletQuantity);
    // TODO you can only have one transaction per UTXO
    config.transactionCount = Math.ceil(config.walletQuantity / config.outputsPerTransaction);
    config.estimatedTransactionFee = DashDom.estimateFee(config, data);
    config.transactionTotal = (config.transactionCount * config.transactionFee)
      + (config.walletAmount * config.walletQuantity);
    $('input.js-transaction-fee-dash').val(DashDrop.toDash(config.transactionFee));
    $('span.js-transaction-fee-dash').text(DashDrop.toDash(config.transactionFee));
    $('input.js-transaction-fee-usd').val(DashDrop.toUsd(config.transactionFee));
    $('span.js-transaction-fee-usd').text(DashDrop.toUsd(config.transactionFee));
    $('.js-transaction-count').val(config.transactionCount);
    $('.js-transaction-count').text(config.transactionCount);
    $('input.js-transaction-total').val(DashDrop.toDash(config.transactionTotal));
    $('span.js-transaction-total').text(DashDrop.toDash(config.transactionTotal));
    $('input.js-transaction-total-usd').val(DashDrop.toUsd(config.transactionTotal));
    $('span.js-transaction-total-usd').text(DashDrop.toUsd(config.transactionTotal));
    if (data.fundingKey && config.transactionTotal <= data.fundingTotal) {
      $('.js-transaction-commit-error').addClass('hidden');
      $('button.js-transaction-commit').prop('disabled', false);
    } else {
      $('.js-transaction-commit-error').removeClass('hidden');
      $('button.js-transaction-commit').prop('disabled', true);
    }
    DashDom._updateFundingQr(data.fundingKeyPublic);
  };
  DashDom.updateReclaimKey = function (ev) {
    var $el = $(this);
    DashDom._updateReclaimKey($el, ev);
  };
  DashDom._updateReclaimKey = function ($el) {
    $('.js-reclaim-commit').prop('disabled', true);
    console.log('$el', $el);
    console.log('$el.val()', $el.val());
    var pubkey = $el.val();
    var keypair = data.reclaimKeypair;
    if (data.reclaimKeypair.publicKey !== pubkey) {
      keypair = DashDrop._keyToKeypair(pubkey);
    }
    var qrPrivate = new QRious({
      element: document.querySelector('.js-reclaim-qr-private')
    , value: keypair && keypair.privateKey || ''
    , size: 256
    , background: keypair && keypair.privateKey && '#FFCCCC' || '#000000'
    });
    if (!keypair) { return; }
    data.reclaimKeypair = keypair;

    $('.js-reclaim-key-private').val(data.reclaimKeypair.privateKey || '');
    $('.js-reclaim-key-public').val(data.reclaimKeypair.publicKey);

    DashDrop._updateReclaimKey(keypair).then(function () {
      $('input.js-reclaim-key-amount-dash').val(DashDrop.toDash(data.reclaimTotal));
      $('span.js-reclaim-key-amount-dash').text(DashDrop.toDash(data.reclaimTotal));
      $('input.js-reclaim-key-amount-usd').val(DashDrop.toUsd(data.reclaimTotal));
      $('span.js-reclaim-key-amount-usd').text(DashDrop.toUsd(data.reclaimTotal));

      if (keypair.publicKey && data.transactionFee) {
        $('.js-reclaim-commit').prop('disabled', false);
      }
      //DashDom.updateWalletAmount();
    });
  };
  DashDom.updateFundingKey = function (ev) {
    var $el = $(this);
    DashDom._updateFundingKey($el, ev);
  };
  DashDom._updateFundingKey = function ($el) {
    $('.js-reclaim-commit').prop('disabled', true);
    console.log('$el', $el);
    console.log('$el.val()', $el.val());
    var keypair = DashDrop._keyToKeypair($el.val());
    var qrPrivate;
    if (keypair.privateKey) {
      qrPrivate = new QRious({
        element: document.querySelector('.js-funding-qr-private')
      , value: keypair.privateKey
      });
    }
    $('.js-funding-key-public').val(data.fundingKeypair.publicKey);

    DashDrop._updateFundingKey(keypair).then(function () {
      DashDom._updateFundingQr(data.fundingKeyPublic);
      // whatever
      $('.js-transaction-fee-dash').val(DashDrop.toDash(config.transactionFee));
      $('.js-transaction-fee-dash').text(DashDrop.toDash(config.transactionFee));
      $('.js-transaction-fee-usd').val(DashDrop.toUsd(config.transactionFee));
      $('.js-transaction-fee-usd').text(DashDrop.toUsd(config.transactionFee));

      $('.js-funding-amount').val(DashDrop.toDash(data.fundingTotal));
      $('.js-funding-amount').text(DashDrop.toDash(data.fundingTotal));
      $('.js-funding-amount-usd').val(DashDrop.toUsd(data.fundingTotal));
      $('.js-funding-amount-usd').text(DashDrop.toUsd(data.fundingTotal));

      if (keypair.privateKey && data.reclaimUtxos.length) {
        $('.js-reclaim-commit').prop('disabled', false);
      }
      DashDom.updateWalletAmount();
    });
  };
  DashDom._updateFundingQr = function (fundingKeyPublic) {
console.log('fundingTotal:', data.fundingTotal);
    var qrPublic = new QRious({
      element: document.querySelector('.js-funding-qr-public')
    , value: 'dash:' + fundingKeyPublic + '?amount=' + (DashDrop.toDash(config.transactionTotal) || 0)
    , size: 256
    , background: '#CCFFFF'
    });
  };
  DashDom.estimateFee = function () {
    var bitkey = new bitcore.PrivateKey();
    var txOpts = {
      src: bitkey.toWIF()
    , dsts: data.keypairs.map(function (kp) { return kp.publicKey })
    , amount: config.walletAmount
      // some made-up address with infinite money
    , utxos: data.fundingUtxos || [{"address":"XwZ3CBB97JnyYi17tQdzFDhZJYCenwtMU8","txid":"af37fad079c34a8ac62a32496485f2f8815ddd8fd1d5ffec84f820a91d82a7fc","vout":2,"scriptPubKey":"76a914e4e0cc1758622358f04c7d4d6894201c7ca3a44788ac","amount":8601,"satoshis":860100000000,"height":791049,"confirmations":6}]
    };
    return DashDrop.estimateFee(txOpts);
  };
  DashDom.updateWalletAmountDash = function (ev) {
    config._walletAmount = DashDrop.fromDash($('input.js-paper-wallet-amount').val());
    $('input.js-paper-wallet-amount-usd').val(DashDrop.toUsd(config._walletAmount));
    $('span.js-paper-wallet-amount-usd').text(DashDrop.toUsd(config._walletAmount));
    $('span.js-paper-wallet-amount').text(DashDrop.toDash(config._walletAmount));
    DashDom.updateWalletAmount(ev);
  };
  DashDom.updateWalletAmountUsd = function (ev) {
    config._walletAmount = DashDrop.fromUsd($('input.js-paper-wallet-amount-usd').val());
    $('input.js-paper-wallet-amount').val(DashDrop.toDash(config._walletAmount));
    $('span.js-paper-wallet-amount').text(DashDrop.toDash(config._walletAmount));
    $('span.js-paper-wallet-amount-usd').text(DashDrop.toUsd(config._walletAmount));
    DashDom.updateWalletAmount(ev);
  };
  DashDom.updateWalletAmount = function () {

    if (!config.walletAmount && !config._walletAmount) {
      config.walletAmount = Math.floor(
        (data.fundingTotal - (config.transactionCount * config.transactionFee)) / config.walletQuantity
      );
    }

    if (!config._walletAmount || (config.walletAmount && config.walletAmount === config._walletAmount)) {
      return true;
    }

    config.walletAmount = config._walletAmount;
    DashDom.updateTransactionTotal();
  };
  DashDom.commitDisburse = function () {
    return DashDrop.commitDisburse().then(function (result) {
      $('.js-transaction-commit-complete').removeClass('hidden');
      $('.js-transaction-id').text(result.txid);

      // Don't allow changing of keys
      $('button.js-paper-wallet-generate').prop('disabled', true);
      $('textarea.js-paper-wallet-keys').prop('disabled', true);
      $('input.js-paper-wallet-quantity').prop('disabled', true);
      $('body').off('keyup', '.js-paper-wallet-keys', DashDom.updateWalletCsv);
      $('body').off('click', '.js-paper-wallet-generate', DashDom.generateWallets);
      $('body').off('keyup', '.js-paper-wallet-quantity', DashDom.updateWalletQuantity);
      // Don't allow anything else
      $('input.js-transaction-fee-dash').prop('disabled', true);
      $('input.js-transaction-fee-usd').prop('disabled', true);
      $('input.js-funding-key').prop('disabled', true);
      $('input.js-paper-wallet-amount').prop('disabled', true);
    });
  };
  DashDom._createMap = function (addr) {
    return { change: 0, value: 0, in: 0, out: 0, satoshis: 0, utxos: [], txs: [], addr: addr };
  };
  DashDom.inspectWallets = function (wallets) {
    var resultsMap = {};
    var valIn = 0;
    var valOut = 0
    var mostRecent = 0;
    var leastRecent = Date.now() + (60 * 60 * 24 * 1000 * 3650);
    var publicKeysMap = {};
    var count = 0;

    $('.js-paper-wallet-total').text(wallets.length);

    if (!wallets.length) {
      return Promise.resolve();
    }

    wallets.forEach(function (w) {
      publicKeysMap[w.publicKey] = w;
    });

    $('.js-paper-wallet-load').removeClass('hidden');
    $('.js-paper-wallet-load .progress-bar').css({ width: '2%' });
    $('.js-paper-wallet-load .progress-bar').text('2%');
    return DashDrop.inspectWallets({
      wallets: wallets
    , progress: function (progress) {
        // If there are both unspent transactions and spent transactions,
        // then we should probably not reclaim this address

        count += 10;
        var percent = (count / wallets.length) * 100;
        if (progress.data.utxos) {
          progress.data.utxos.forEach(function (utxo) {
            function insert(map) {
              if (!publicKeysMap[utxo.address]) {
                console.warn('utxo not found:');
                console.warn(utxo);
                return;
              }
              if (!map[utxo.address]) {
                map[utxo.address] = DashDom._createMap(utxo.address);
              }

              map[utxo.address].utxos.push(utxo);
              map[utxo.address].satoshis += utxo.satoshis;
            }

            insert(resultsMap);
            /*
            if (utxo.confirmations >= 6) {
              ledger += utxo.address + ' ' + utxo.satoshis + ' (' + utxo.confirmations + '+ confirmations)' + '\n';
            } else {
              ledger += utxo.address + ' ' + utxo.satoshis + ' (~' + utxo.confirmations + ' confirmations)' + '\n';
            }

            if (utxo.confirmations >= 6 && utxo.satoshis) {
              if (!data.claimableMap[utxo.address + utxo.txid]) {
                data.claimableMap[utxo.address + utxo.txid] = true;
                data.claimable.push(utxo);
              }
            }
            */
          });
        }
        if (progress.data.items) {
          progress.data.items = progress.data.items.sort(function (a, b) {
            // earliest first
            return a.time - b.time;
          });
          //console.log('progress.data.items:');
          //console.log(progress.data.items);
          progress.data.items.forEach(eachTx);

          function eachTx(tx) {
            var addr;
            // each vin is actually a utxo
            tx.vin.forEach(function (vin) {
              addr = vin.addr;
              var val = Math.round((parseFloat(vin.value, 10) || 0) * config.SATOSHIS_PER_DASH);
              if (!publicKeysMap[vin.addr]) { return; }

              if (!resultsMap[vin.addr]) {
                resultsMap[vin.addr] = DashDom._createMap(vin.addr.address);
              }
              if (!resultsMap[vin.addr].loaded) {
                resultsMap[vin.addr].loaded = true;
                // only do this on the first (oldest) transaction
                resultsMap[vin.addr].in += val;
                valIn += val;
              }
            });
            if (!publicKeysMap[addr]) { return; }

            // NOTE: in our use case for this app
            // the very first transaction in values will be what was put in
            // any later transactions will be full values of the change
            resultsMap[addr].txs.push(tx);
            resultsMap[addr].time = Math.min(tx.time * 1000, resultsMap[addr].time || Infinity);
            mostRecent = Math.max(resultsMap[addr].time, mostRecent);
            leastRecent = Math.min(resultsMap[addr].time, leastRecent)
            /*
            tx.vout.forEach(function (vout) {
              var val = Math.round((parseFloat(vout.value, 10) || 0) * config.SATOSHIS_PER_DASH);
              vout.scriptPubKey.addresses.forEach(function (_addr) {
                if (_addr === addr) {
                  // self used as change address, not actually spent
                  // this will be represented as utxo
                  //resultsMap[addr].value == val;
                  return;
                }
                resultsMap[addr].out += val;
                valOut += val;
              });
            });
            */
          }
        }


        var showPercent = Math.max(5, (percent * 0.93)); // always at least 5, never 100
        $('.js-paper-wallet-load .progress-bar').css({ width: showPercent + '%' });
        $('.js-paper-wallet-load .progress-bar').text(showPercent.toFixed(2) + '%');
      }
    }).then(function () {
      $('.js-paper-wallet-load .progress-bar').css({ width: '96%' });
      $('.js-paper-wallet-load .progress-bar').text('96%');
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          resolve();
        }, 50);
      });
    }).then(function () {
      var satoshis = 0;
      var fullMap = {};
      var dirtyMap = {};
      var emptyMap = {};
      var otherMap = {};
      var newMap = {};

      console.log('resultsMap:');
      console.log(resultsMap);
      Object.keys(resultsMap).forEach(function (addr) {
        var txs = resultsMap[addr];
          // don't double count those that have had transactions and uxtos
        if (!txs.txs.length) {
          // basically we could use valIn here instead
          satoshis += txs.satoshis;
        }

        // commenting out multiple utxos for test data
        // TODO uncomment
        if ((txs.txs.length && txs.utxos.length)/* || txs.utxos.length > 1*/) {
          dirtyMap[addr] = txs;
        } else if (/*1 === */txs.utxos.length) {
          fullMap[addr] = txs;
        } else if (txs.time) {
          emptyMap[addr] = txs;
        } else {
          otherMap[addr] = txs;
        }
      });
      console.log('post results map');

      wallets.forEach(function (w) {
        if (resultsMap[w.publicKey]) {
          w.amount = resultsMap[w.publicKey].satoshis;
        }
        if (!resultsMap[w.publicKey]) {
          newMap[w.publicKey] = DashDom._createMap(w.publicKey);
        }
      });
      console.log('pre csv');
      var csv = DashDrop._toCsv(wallets);
      data.csv = DashDom._toCsv(csv);
      console.log('post csv');

      // TODO need to check which were loaded, unloaded
      var allCount = wallets.length;
      var fullCount = Object.keys(fullMap).length;
      var dirtyCount = Object.keys(dirtyMap).length;
      var emptyCount = Object.keys(emptyMap).length;
      var usedCount = emptyCount + dirtyCount;
      var loadedCount = fullCount + emptyCount + dirtyCount;
      var otherCount = Object.keys(otherMap).length;
      var newCount = Object.keys(newMap).length;
      // otherCount and newCount should be the same... right?
      console.log('allCount', allCount);
      console.log('fullCount', fullCount);
      console.log('dirtyCount', dirtyCount);
      console.log('emptyCount', emptyCount);
      console.log('loadedCount', loadedCount);
      console.log('otherCount', otherCount);
      console.log('newCount', newCount);
      console.log('valIn', valIn);
      console.log('valOut', valOut);
      console.log('satoshis', satoshis);
      console.log('mostRecent', new Date(mostRecent).toISOString());
      console.log('leastRecent', new Date(leastRecent).toISOString());

      var percent = Math.round((usedCount / (loadedCount || 1)) * 100);

      $('.js-paper-wallet-percent').text(percent);
      $('.js-paper-wallet-used').text(usedCount);
      $('.js-paper-wallet-loaded').text(loadedCount);
      $('.js-paper-wallet-balance-dash').val(DashDrop.toDash(satoshis));
      $('.js-paper-wallet-balance-dash').text(DashDrop.toDash(satoshis));
      $('.js-paper-wallet-balance-usd').val(DashDrop.toUsd(satoshis));
      $('.js-paper-wallet-balance-usd').text(DashDrop.toUsd(satoshis));
      // it's gone out if it's been used as an input
      $('.js-paper-wallet-balance-out-dash').text(DashDrop.toDash(valIn));
      $('.js-paper-wallet-balance-out-usd').text(DashDrop.toUsd(valIn));
      //$('.js-paper-wallet-balance-out').text((valOut / config.SATOSHIS_PER_DASH).toFixed(8));
      $('.js-paper-wallet-balance-in-dash').text(DashDrop.toDash(valIn + satoshis));
      $('.js-paper-wallet-balance-in-usd').text(DashDrop.toUsd(valIn + satoshis));
      $('.js-paper-wallet-most-recent').text(new Date(mostRecent).toLocaleString());
      $('.js-paper-wallet-least-recent').text(new Date(leastRecent).toLocaleString());
      //$('.js-paper-wallet-least-recent').text(new Date(leastRecent).toLocaleDateString());

      console.log('post ui update');

      data.reclaimUtxos = [];
      Object.keys(fullMap).forEach(function (key) {
        fullMap[key].utxos.forEach(function (utxo) {
          data.reclaimUtxos.push(utxo);
        });
      });
      if (config.reclaimDirty) {
        Object.keys(dirtyMap).forEach(function (key) {
          dirtyMap[key].utxos.forEach(function (utxo) {
            data.reclaimUtxos.push(utxo);
          });
        });
      }
      console.log('post array');
      data.reclaimKeypairs = wallets.slice(0);

      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          resolve();
        }, 50);
      });
    }).then(function () {
      // This is where all the time gets spent
      console.log('pre estimate');
      return DashDrop.estimateReclaimFee({
        utxos: data.reclaimUtxos
      , srcs: data.reclaimKeypairs.map(function (kp) { return kp.privateKey; }).filter(Boolean)
      , dst: null // data.fundingKey
      //, fee: null // config.transactionFee
      , progress: function (ev) {
          var showPercent = 96 + ((ev.total / ev.length) * 4);
          console.log('progress estimate', showPercent, ev);
          $('.js-paper-wallet-load .progress-bar').css({ width: showPercent + '%' });
          $('.js-paper-wallet-load .progress-bar').text(showPercent.toFixed(2) + '%');
          return new Promise(function (resolve, reject) {
            setTimeout(function () {
              resolve();
            }, 50);
          });
        }
      }, function (err, fee) {
        data.transactionFee = fee;
        console.log('post estimate');
        console.log('data.transactionFee:', data.transactionFee);
        $('span.js-transaction-fee-dash').text(DashDrop.toDash(data.transactionFee));
        $('input.js-transaction-fee-dash').val(DashDrop.toDash(data.transactionFee));
        $('span.js-transaction-fee-usd').text(DashDrop.toUsd(data.transactionFee));
        $('input.js-transaction-fee-usd').val(DashDrop.toUsd(data.transactionFee));
        $('.js-paper-wallet-load .progress-bar').css({ width: '100%' });
        $('.js-paper-wallet-load .progress-bar').text('100%');
        $('.js-reclaim-view').removeClass('hidden');
        if (data.reclaimKeypair.publicKey && data.transactionFee) {
          $('.js-reclaim-commit').prop('disabled', false);
        } else {
          $('.js-reclaim-commit').prop('disabled', true);
        }
      });
    });
  };
  DashDom.commitReclaim = function () {
    console.log('commit reclaim');
    var reclaimUtxos = data.reclaimUtxos.slice();
    var txResults = [];

    function nextBatch() {
      var utxos = reclaimUtxos.splice(0, config.UTXO_BATCH_MAX);
      if (!utxos.length) { return txResults; }
      var txObj = {
        utxos: utxos
      , srcs: data.reclaimKeypairs.map(function (kp) { return kp.privateKey; }).filter(Boolean)
      , dst: data.reclaimKeypair.publicKey // data.reclaimKey
      };
      if (config.transactionFee) {
        txObj.fee = config.transactionFee;
      }
      var rawTx = DashDrop.reclaimTx(txObj);
      var restTx = {
        url: config.insightBaseUrl + '/tx/send'
      , method: 'POST'
      , headers: { 'Content-Type': 'application/json' }
      , body: JSON.stringify({ rawtx: rawTx })
      };

      return window.fetch(restTx.url, restTx).then(function (resp) {
        return resp.json().then(function (result) {
          txResults.push(result);
          return nextBatch();
        });
      });
    };

    return nextBatch().then(function () {
      console.log("Transaction Batch", txResults);
      $('.js-transaction-ids').text(txResults.map(function (tx) { return tx.txid; }).join('\n'));
      $('.js-reclaim-commit-complete').removeClass('hidden');
    });
  };
  DashDom.print = function () {
    window.print();
  };
  DashDom.downloadCsv = function () {
    var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/csv;base64,' + btoa(data.csv);
    hiddenElement.target = '_blank';
    hiddenElement.download = 'dash-paper-wallets.csv';
    hiddenElement.click();
  };
  DashDom.importCsv = function () {
    $('.js-csv-import-file').click();
  };
  DashDom.uploadCsv = function () {
    $('.js-csv-upload-file').click();
  };
  DashDom._parseFileCsv = function (file, cb) {
    var reader = new FileReader();
    reader.addEventListener('error', function () {
      window.alert("Error parsing CSV");
    });
    reader.addEventListener('load', function (ev) {
      data.csv = ev.target.result;
      $('.js-paper-wallet-keys').val(data.csv);
      console.log('data.csv:');
      console.log(data.csv);
      DashDom._updateWalletCsv($('.js-paper-wallet-keys'));
      console.log('data.keypairs:');
      console.log(data.keypairs);
      cb();
    });
    reader.readAsText(file);
  };
  DashDom.importFileCsv = function () {
    var file = $('.js-csv-import-file')[0].files[0];
    DashDom._parseFileCsv(file, function () {
      DashDom.initCsv();
    });
  };
  DashDom.parseFileCsv = function () {
    var file = $('.js-csv-upload-file')[0].files[0];
    DashDom._parseFileCsv(file, function () {
      view.csv.show();
    });
  };
  DashDom.showExampleCsv = function () {
    view.csv.show();
    $('.js-paper-wallet-keys').attr('placeholder', exampleCsv);
  };
  DashDom.showCsv = function () {
    view.csv.show();
    $('.js-paper-wallet-keys').removeAttr('placeholder');
  };
  DashDom.updateFeeScheduleDash = function () {
    var $el = $(this);
    config._fee = DashDrop.fromDash($el.val());
    DashDom.updateFeeSchedule();
  };
  DashDom.updateFeeScheduleUsd = function () {
    var $el = $(this);
    config._fee = DashDrop.fromUsd($el.val());
    DashDom.updateFeeSchedule();
  };
  DashDom.updateFeeSchedule = function () {
    // XXX xfer
    if (config._fee && !isNaN(config._fee)) {
      config.transactionFee = config._fee;
      DashDom.updateTransactionTotal();
    }
    return true;
  };
  DashDom.initReclaim = function () {
    var wallets = DashDom._getWallets().filter(DashDom._hasBalance);
    //return DashDom.inspectWallets(wallets);
    return DashDom.inspectWallets(wallets);
  };
  DashDom.initCsv = function () {
    var wallets = data.keypairs; //DashDom._getWallets();
    //return DashDom.inspectWallets(wallets);
    return DashDom.inspectWallets(wallets);
  };


  //
  // Reclaim Wallets
  //
  DashDom.views.generate = function () {
    DashDom.generateWallets();
    view.csv.hide();
    data.fundingKeypair = DashDrop._getSourceAddress();
    data.fundingKey = data.fundingKeypair.privateKey;
    $('.js-funding-key').val(data.fundingKeypair.privateKey);
    $('.js-funding-key').trigger('keyup');
    //DashDom._updateFundingKey($('.js-funding-key'));

    $('.js-flow').addClass('hidden');
    $('.js-flow-generate').removeClass('hidden');
    setTimeout(function () {
      $('.js-flow-generate').addClass('in');
    });
  };
  DashDom.views.reclaim = function () {
    data.reclaimKeypair = DashDrop._getReclaimAddress();

    $('.js-reclaim-key').val(data.reclaimKeypair.publicKey);
    $('.js-reclaim-key').trigger('keyup');

    $('.js-flow').addClass('hidden');
    $('.js-flow-reclaim').removeClass('hidden');
    setTimeout(function () {
      $('.js-flow-reclaim').addClass('in');
    });
    DashDom.initReclaim();
  };

  var view = {};
  view.csv = {
    toggle: function () {
      console.log('click, csv toggle');
      if ($('.js-csv-view').hasClass('hidden')) {
        $('.js-csv-view').removeClass('hidden');
      } else {
        $('.js-csv-view').addClass('hidden');
      }
    }
  , show: function () {
      $('.js-csv-view').removeClass('hidden');
    }
  , hide: function () {
      $('.js-csv-view').addClass('hidden');
    }
  };



  // Switch views
  $('body').on('click', 'button.js-flow-generate', DashDom.views.generate);
  $('body').on('click', 'button.js-flow-reclaim', DashDom.views.reclaim);

  // Wallet Generation Related
  $('body').on('keyup', '.js-paper-wallet-keys', DashDom.updateWalletCsv);
  $('body').on('click', '.js-paper-wallet-generate', DashDom.generateWallets);
  $('body').on('keyup', '.js-paper-wallet-quantity', DashDom.updateWalletQuantity);

  // Save related
  $('body').on('click', '.js-csv-hide', view.csv.hide);
  $('body').on('click', '.js-csv-show', DashDom.showCsv);
  $('body').on('click', '.js-csv-download', DashDom.downloadCsv);
  $('body').on('click', '.js-csv-import', DashDom.importCsv);
  $('body').on('change', '.js-csv-import-file', DashDom.importFileCsv);
  $('body').on('click', '.js-csv-upload', DashDom.uploadCsv);
  $('body').on('change', '.js-csv-upload-file', DashDom.parseFileCsv);
  $('body').on('click', '.js-csv-example', DashDom.showExampleCsv);
  $('body').on('click', '.js-paper-wallet-print', DashDom.print);

  // Transaction Related
  $('body').on('change', '.js-insight-base', DashDom.updateInsightBase);
  $('body').on('keyup', '.js-reclaim-key', DashDom.updateReclaimKey);
  $('body').on('click', '.js-reclaim-key-check', function () {
    $('.js-reclaim-key-amount-dash').val('---');
    $('.js-reclaim-key-amount-dash').text('---');
    $('.js-reclaim-key-amount-usd').val('---');
    $('.js-reclaim-key-amount-usd').text('---');
    $('.js-reclaim-key').trigger('keyup');
  });
  $('body').on('keyup', '.js-funding-key', DashDom.updateFundingKey);
  $('body').on('click', '.js-funding-key-check', function () {
    $('.js-funding-amount').val('---');
    $('.js-funding-amount').text('---');
    $('.js-funding-amount-usd').val('---');
    $('.js-funding-amount-usd').text('---');
    $('.js-funding-key').trigger('keyup');
  });
  $('body').on('click', '.js-transaction-commit', DashDom.commitDisburse);
  $('body').on('keyup', '.js-paper-wallet-amount', DashDom.updateWalletAmountDash);
  $('body').on('keyup', '.js-paper-wallet-amount-usd', DashDom.updateWalletAmountUsd);
  $('body').on('keyup', '.js-transaction-fee-dash', DashDom.updateFeeScheduleDash);
  $('body').on('keyup', '.js-transaction-fee-usd', DashDom.updateFeeScheduleUsd);

  // Reclaim Related
  $('body').on('click', '.js-reclaim-commit', DashDom.commitReclaim);


  //
  // Initial Values
  //
  $('.js-insight-base').val(config.insightBaseUrl);
  $('.js-insight-base').text(config.insightBaseUrl);
  $('.js-paper-wallet-cache').prop('checked', 'checked');
  $('.js-paper-wallet-cache').removeProp('checked');
  $('.js-paper-wallet-quantity').val(config.walletQuantity);
  $('.js-paper-wallet-quantity').text(config.walletQuantity);

  function delimitNumbers(str) {
    return (str + "").replace(/\b(\d+)((\.\d+)*)\b/g, function(a, b, c) {
      return (b.charAt(0) > 0 && !(c || ".").lastIndexOf(".") ? b.replace(/(\d)(?=(\d{3})+$)/g, "$1,") : b) + c;
    });
  }

  function init() {
    return window.fetch(config.insightBaseUrl + "/currency", { mode: 'cors' }).then(function (resp) {
      return resp.json().then(function (resp) {
        config.conversions = resp.data;
        DashDrop.init(config, data);
        $('.js-currency-dash-usd').text('$' + delimitNumbers(parseFloat(resp.data.dash_usd, 10).toFixed(2)));
        $('.js-currency-btc-usd').text('$' + delimitNumbers(parseFloat(resp.data.btc_usd, 10).toFixed(2)));
        $('.js-currency-btc-dash').text(delimitNumbers(parseFloat(resp.data.btc_dash, 10).toFixed(8)));
        console.log('resp.data.dash_usd', resp.data.dash_usd);
        console.log('resp.data.btc_dash', resp.data.btc_dash);
        console.log('resp.data.btc_usd', resp.data.btc_usd);

        $('input.js-paper-wallet-amount').val(DashDrop.toDash(config.walletAmount));
        $('span.js-paper-wallet-amount').text(DashDrop.toDash(config.walletAmount));
        $('input.js-paper-wallet-amount-usd').val(DashDrop.toUsd(config.walletAmount));
        $('span.js-paper-wallet-amount-usd').text(DashDrop.toUsd(config.walletAmount));
        $('input.js-transaction-fee-dash').val(DashDrop.toDash(config.transactionFee));
        $('span.js-transaction-fee-dash').text(DashDrop.toDash(config.transactionFee));
        $('input.js-transaction-fee-usd').val(DashDrop.toUsd(config.transactionFee));
        $('span.js-transaction-fee-usd').text(DashDrop.toUsd(config.transactionFee));
        $('[name=js-fee-schedule]').val(DashDrop.toDash(config.transactionFee));
        $('[name=js-fee-schedule-usd]').val(DashDrop.toUsd(config.transactionFee));

        DashDom.updateTransactionTotal();

        return resp.data.dash_usd;
      });
    });
  }

  $('body').on('click', '.js-destroy-all', function () {
    if (window.confirm("Delete ALL data leaving NO BACKUPS?")) {
      if (window.confirm("Any MONEY that has not been reclaimed or printed will be lost, FOREVER! Continue?")) {
        DashDom.downloadCsv();
        window.localStorage.clear();
        window.location.reload();
      }
    }
  });

  init();


  DEBUG_DASH_AIRDROP.config = config;
  DEBUG_DASH_AIRDROP.data = data;
  window.dashDrop = DashDrop;
});

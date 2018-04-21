'use strict';

var PromiseA = require('bluebird');
var requestAsync = PromiseA.promisify(require('request'));
var bitcore = require('bitcore-lib-dash');
//var privateKey = new bitcore.PrivateKey();
var wif = require('./config.js').wif;

var privateKey = new bitcore.PrivateKey(wif);

var address = privateKey.toAddress();
var addr = address.toString();

console.log(privateKey.toWIF());
// console.log(privateKey.toJSON()); // bn
// console.log(privateKey.toString()); // hex
console.log(address.toJSON()); // raw hex
console.log(address.toString()); // encoded (starts with X)

function genKeyPair() {
  var privateKey = new bitcore.PrivateKey();
  var priv = privateKey.toWIF();
  var addr = privateKey.toAddress().toString();
  console.log(addr + ':' + priv);
  return privateKey;
}

var addresses = [];
var i = 0;
var count = 2;
for (i = 0; i < count; i += 1) {
  addresses.push(genKeyPair());
}

/*
http://104.236.12.147:3001/insight-api-dash/addr/Xb3b7YK8QdAxSjTZcxs4Ej1yXozgtaPVav
{"addrStr":"Xb3b7YK8QdAxSjTZcxs4Ej1yXozgtaPVav","balance":0.0001,"balanceSat":10000,"totalReceived":0.0001,"totalReceivedSat":10000,"totalSent":0,"totalSentSat":0,"unconfirmedBalance":0,"unconfirmedBalanceSat":0,"unconfirmedTxApperances":0,"txApperances":1,"transactions":["45aa039b07135f4c0273367f7031ab4c0c78ad290309dec4e91f0f3e8b7fed85"]}
/*
var wif = 'Kxr9tQED9H44gCmp6HAdmemAzU3n84H3dGkuWTKvE23JgHMW8gct';
var address = new bitcore.PrivateKey(wif).toAddress();
*/

var baseUrl = 'http://104.236.12.147:3001';
requestAsync({ url: baseUrl + '/insight-api-dash/addr/:addr/utxo'.replace(':addr', addr), json: true }).then(function (resp) {
  console.log(typeof resp.body, resp.body);
  var satoshio =  1000 * 1000 * 100;
  var giveaway = 0.0001 * satoshio; // 8¢
  //var giveaway = 0.001 * satoshio; // 8¢
  var sum = 0;
  var tx = new bitcore.Transaction();
  var inputs = [];
  console.log('Instant Send Fee (per input):', 0.001 * satoshio);
  // NOTE: In dash the fee is 0.001 per input according to
  // https://github.com/dashevo/insight-api-dash#instantsend-transactions
  //var perKbFee = Math.round(0.00001 * satoshio);
  //var instant = 1; // 1 = off, 10 = on
  var bytes;
  var fee;
  var firstTime = true;
  var total;

  addresses.forEach(function (privateKey) {
    tx.to(privateKey.toAddress(), giveaway);
  });
  tx.change(genKeyPair().toAddress());
  // TODO sort for efficiency (try to not make change)
  // the smallest amount that is greater than the sum + fee
  // or the most change used without incurring a greater fee
  resp.body.forEach(function (utxo) {
    var fee1;
    var ft;
    if (utxo.confirmations < 6) {
      return false;
    }
    if (firstTime) {
      ft = true;
      firstTime = false;
      inputs.push(utxo);
      tx.from(utxo);
    }
    bytes = (148 * (inputs.length || 1)) + (34 * count) + 10;
    //fee1 = instant * bytes * perKbFee;
    fee1 = tx.getFee();
    console.log('fee1', fee1);
    if (sum >= (giveaway * count) + fee1) {
      console.log(inputs.length + ' input(s) will cover it');
      return true;
    }
    fee = fee1;
    if (!ft) {
      inputs.push(utxo);
      tx.from(utxo);
    }
    sum += utxo.satoshis; // Math.round(utxo.amount * satoshio);
  });
  total = (giveaway * count) + fee;
  if (sum < total) {
    throw new Error("not enough money!");
  }
  console.log('sources total:', sum);
  console.log('to be spent:', total);
  console.log('change:', sum - total);
  console.log('transaction:');
  var rawTx = tx.sign(privateKey).serialize();
  console.log(rawTx);

  var restTx = {
    url: baseUrl + '/insight-api-dash/tx/send'
  , method: 'POST'
  , json: {
      rawtx: rawTx
    }
  };
  console.log(restTx);
  return requestAsync(restTx).then(function (resp) { console.log(resp.body); });
});

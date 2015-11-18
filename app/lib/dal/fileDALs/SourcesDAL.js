/**
 * Created by cgeek on 22/08/15.
 */

var Q = require('q');
var AbstractLoki = require('./AbstractLoki');

module.exports = SourcesDAL;

function SourcesDAL(loki) {

  "use strict";

  let collection = loki.getCollection('sources') || loki.addCollection('sources', { indices: ['pubkey', 'type', 'number', 'fingerprint', 'amount', 'block_hash'] });

  AbstractLoki.call(this, collection);

  this.idKeys = ['pubkey', 'type', 'number', 'fingerprint', 'amount'];
  this.propsToSave = [
    'pubkey',
    'type',
    'number',
    'time',
    'fingerprint',
    'amount',
    'block_hash',
    'consumed'
  ];

  this.init = () => null;

  this.getAvailableForPubkey = (pubkey) => this.lokiFind({
    pubkey: pubkey
  },{
    consumed: false
  });

  this.getUDSources = (pubkey) => this.lokiFind({
    $and: [{
      pubkey: pubkey
    },{
      type: 'D'
    }]
  });

  this.getSource = (pubkey, type, number) => this.lokiFindOne({
    $and: [
      { pubkey: pubkey },
      { type: type },
      { number: number }
    ]
  }, null, this.IMMUTABLE_FIELDS);

  this.isAvailableSource = (pubkey, type, number, fingerprint, amount) => {
    let src = this.lokiExisting({
      pubkey: pubkey,
      type: type,
      number: number,
      fingerprint: fingerprint,
      amount: amount
    });
    return Q(src ? !src.consumed : false);
  };

  this.consumeSource = (pubkey, type, number, fingerprint, amount) => {
    let src = this.lokiExisting({
      pubkey: pubkey,
      type: type,
      number: number,
      fingerprint: fingerprint,
      amount: amount
    });
    src.consumed = true;
    return this.lokiSave(src);
  };

  this.addSource = (state, pubkey, type, number, fingerprint, amount, block_hash, time) => this.lokiSave({
    pubkey: pubkey,
    type: type,
    number: number,
    fingerprint: fingerprint,
    amount: amount,
    time: time,
    block_hash: block_hash,
    consumed: false
  });

  this.unConsumeSource = (type, pubkey, number, fingerprint, amount, time, block_hash) => {
    let src = this.lokiExisting({
      pubkey: pubkey,
      type: type,
      number: number,
      fingerprint: fingerprint,
      amount: amount
    });
    if (src) {
      src.consumed = false;
      collection.update(src);
    } else {
      this.lokiSave({
        pubkey: pubkey,
        type: type,
        number: number,
        fingerprint: fingerprint,
        amount: amount,
        time: time,
        block_hash: block_hash,
        consumed: false
      });
    }
  };

  this.removeAllSourcesOfBlock = (number) => this.lokiRemoveWhere({
    number: number
  });
}
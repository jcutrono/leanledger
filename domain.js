'use strict';

var Currency = {
	USD: 0,
	EUR: 1,
	JPY: 2,
	GBP: 3
}

module.exports.Block = class Block {
    constructor(index, previousHash, timestamp, data, hash) {
        this.index = index;
        this.previousHash = previousHash.toString();        
        this.data = data;
        this.hash = hash.toString();
    }
}

module.exports.Transaction = class Transaction {
	constructor(accountTo, accountFrom, amount, timeStamp, currency) {
		this.accountTo = accountTo;
		this.accountFrom = accountFrom;
		this.amount = amount;	
		this.timeStamp = timeStamp;
		this.currency = currency || Currency.USD;
	}
}
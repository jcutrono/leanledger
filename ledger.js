'use strict';
var CryptoJS = require("crypto-js");
var Domain = require("./domain.js");

module.exports.Ledger = class Ledger {
    constructor() {
        this.chain = [this.getGenesisBlock()]
    }

    getGenesisBlock() {
        var t = new Domain.Transaction(0, 0, 0);
        return this.generateBlock({ index: -1, hash: "0" }, t)
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(blockData) {
        var newBlock = this.generateNextBlock(blockData);
        
        if (this.isValidNewBlock(newBlock, this.getLatestBlock())) {
            this.chain.push(newBlock);
        }

        return newBlock;
    }

    generateNextBlock(blockData) {
        var previousBlock = this.getLatestBlock();
        return this.generateBlock(previousBlock, blockData);
    }

    generateBlock(previousBlock, blockData) {
        var nextIndex = previousBlock.index + 1;
        var nextTimestamp = new Date().getTime() / 1000;
        var transaction = new Domain.Transaction(blockData.accountTo, blockData.accountFrom, blockData.amount, nextTimestamp)
        var nextHash = this.calculateHash(nextIndex, previousBlock.hash, nextTimestamp, transaction);
        return new Domain.Block(nextIndex, previousBlock.hash, transaction, nextHash);
    }

    calculateHashForBlock(block) {
        return this.calculateHash(block.index, block.previousHash, block.timestamp, block.data);
    }

    calculateHash(index, previousHash, timestamp, data) {
        return CryptoJS.SHA256(index + previousHash + timestamp + data).toString();
    }

    isValidNewBlock(newBlock, previousBlock) {
        if (previousBlock.index + 1 !== newBlock.index) {
            console.log('invalid index');
            return false;
        } else if (previousBlock.hash !== newBlock.previousHash) {
            console.log('invalid previoushash');
            return false;
        } else if (this.calculateHashForBlock(newBlock) !== newBlock.hash) {
            console.log(typeof(newBlock.hash) + ' ' + typeof calculateHashForBlock(newBlock));
            console.log('invalid hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash);
            return false;
        }
        return true;
    }

    isValidChain(blockchainToValidate) {
        if (JSON.stringify(blockchainToValidate[0]) !== JSON.stringify(this.getGenesisBlock())) {
            return false;
        }
        
        var tempBlocks = [blockchainToValidate[0]];
        for (var i = 1; i < blockchainToValidate.length; i++) {
            if (isValidNewBlock(blockchainToValidate[i], tempBlocks[i - 1])) {
                tempBlocks.push(blockchainToValidate[i]);
            } else {
                return false;
            }
        }
        return true;
    }

    transactions() {
        return this.chain.map(x => {
            return {
                accountTo: x.data.accountTo,
                accountFrom: x.data.accountFrom,
                amount: x.data.amount,
                currency: x.data.currency
            };
        });
    }
}
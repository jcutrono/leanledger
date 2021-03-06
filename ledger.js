'use strict';
var CryptoJS = require("crypto-js");
var Domain = require("./domain.js");
var DB = require("./database.js");

module.exports.Ledger = class Ledger {
    constructor() {
        this.chain = [this.getGenesisBlock()]
        this.db = new DB.DB();
    }

    getGenesisBlock() {
        var t = {
            accountTo: 0,
            accountFrom: 0,
            amount: 0,
            timeStamp: "1519600528.245"
        };
        return this.generateBlock({ index: -1, hash: "0" }, t)
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(blockData) {
        var self = this;
        return new Promise(function(resolve, reject){
            blockData.timeStamp = new Date().getTime() / 1000;
            var newBlock = self.generateNextBlock(blockData);

            if (self.isValidNewBlock(newBlock, self.getLatestBlock())) {
                self.chain.push(newBlock);
                
                var collection = self.db.getCollection('blocks').then(function(collection){
                    collection.insert(self.chain);
                    resolve(newBlock);
                });
            } else {
                resolve(null);
            }
        });        
    }

    generateNextBlock(blockData) {
        var previousBlock = this.getLatestBlock();
        return this.generateBlock(previousBlock, blockData);
    }

    generateBlock(previousBlock, blockData) {
        var nextIndex = previousBlock.index + 1;        
        var transaction = new Domain.Transaction(blockData.accountTo, blockData.accountFrom, blockData.amount, blockData.timeStamp)
        var nextHash = this.calculateHash(nextIndex, previousBlock.hash, transaction);
        return new Domain.Block(nextIndex, previousBlock.hash, transaction, nextHash);
    }

    calculateHashForBlock(block) {
        return this.calculateHash(block.index, block.previousHash, block.data);
    }

    calculateHash(index, previousHash, data) {        
        return CryptoJS.SHA256(index + previousHash + data).toString();
    }

    isValidNewBlock(newBlock, previousBlock) {
        if (previousBlock.index + 1 !== newBlock.index) {
            console.log('invalid index');
            return false;
        } else if (previousBlock.hash !== newBlock.previousHash) {
            console.log('invalid previoushash');
            return false;
        } else if (this.calculateHashForBlock(newBlock) !== newBlock.hash) {
            console.log('invalid hash: ' + this.calculateHashForBlock(newBlock) + ' ' + newBlock.hash);
            return false;
        }
        return true;
    }

    isValidChain(blockchainToValidate) {
        if (JSON.stringify(blockchainToValidate[0]) !== JSON.stringify(this.getGenesisBlock())) {
            console.log("Invalid getGenesisBlock: " + JSON.stringify(blockchainToValidate[0]) + "----" + JSON.stringify(this.getGenesisBlock()))
            return false;
        }

        var tempBlocks = [blockchainToValidate[0]];
        for (var i = 1; i < blockchainToValidate.length; i++) {
            if (this.isValidNewBlock(blockchainToValidate[i], tempBlocks[i - 1])) {
                tempBlocks.push(blockchainToValidate[i]);
            } else {
                return false;
            }
        }
        return true;
    }

    transactions() {
        console.log(JSON.stringify(this.chain));

        return this.chain.map(x => {
            return {
                index: x.index,
                accountTo: x.data.accountTo,
                accountFrom: x.data.accountFrom,
                amount: x.data.amount,
                timeStamp: x.data.timeStamp,
                currency: x.data.currency
            };
        });
    }
}
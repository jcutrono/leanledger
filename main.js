'use strict';
var express = require("express");
var bodyParser = require('body-parser');
var HttpStatus = require('http-status-codes');
var Domain = require("./domain.js");
var Ledger = require("./ledger.js");

var http_port = process.env.HTTP_PORT || 3001;

var ledger = new Ledger.Ledger();

var initHttpServer = () => {
    var app = express();
    app.use(bodyParser.json());

    app.get('/blocks', (req, res) => res.send(JSON.stringify(ledger.transactions())));

    app.post('/blocks', (req, res) => {
        // where req.body is a new Transaction
        var newBlock = ledger.addBlock(req.body);
        if (newBlock) {
            // we could send a socket message here with the latest block
            // or utilize webhooks to broadcast over http 
            // broadcast(responseLatestMsg());

            res
                .status(HttpStatus.ACCEPTED)
                .send('New block added: ' + JSON.stringify(newBlock));
        }
        else{
            res
                .status(HttpStatus.NOT_ACCEPTABLE)
                .send('Not valid');
        }
    });

    app.post('/validate', (req, res) => {
        // where req.body is [blocks]
        if (ledger.isValidChain(req.body)) {
            var payment = Math.random();
            // ledger.addBlock()
            res
                .status(HttpStatus.OK)
                .send('Thanks! Here is some coin: ' + payment);
        } else {
            res
                .status(HttpStatus.NOT_ACCEPTABLE)
                .send('Not the same');
        }
    });

    app.listen(http_port, () => console.log('Listening http on port: ' + http_port));
};

initHttpServer();
var MongoClient = require('mongodb').MongoClient;
var mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/leanledger'

module.exports.DB = class DB {
	constructor() {
        this.initialized = false;
        this.db = null;
    }

    getConnection(){
    	return new Promise(function(resolve,reject){
    		// Initialize connection once
	    	if(!this.initialized){
				MongoClient.connect(mongoUrl, function(err, database) {
				    if(err) reject(err);
				    this.db = database.db('leanledger');
				    this.initialized = true;
				    resolve();
				});
			}
			resolve();
		});
    }

    getCollection(collectionName){
    	this.getConnection().then(function(){
    		return this.db.collection(collectionName);
    	});
    }
}
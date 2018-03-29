var MongoClient = require('mongodb').MongoClient;
var mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/leanledger'

module.exports.DB = class DB {
	constructor() {
        this.db = null;
    }

    getConnection(){
    	var self = this;
    	return new Promise(function(resolve,reject){	    	
			MongoClient.connect(mongoUrl, function(err, database) {
			    if(err) {
			    	reject(err);
			    }

			    resolve(database.db('leanledger'));
			});			
		});
    }

    getCollection(collectionName){
    	var self = this;
    	return new Promise(function(resolve,reject) {
	    	self.getConnection().then(function(db) {
	    		self.db = db;
	    		resolve(self.db.collection(collectionName));
	    	});
    	});
    }
}
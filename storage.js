var mongo = require('mongoskin');

module.exports = function(settings){
    var connection = mongo.db(settings.db.host + ":" + settings.db.port + "/" + settings.db.db);
    //connection.collection("data").ensureIndex([["username", 1], ["key", 1]], true, function(){});

    function Storage(){
    };

    Storage.prototype.get = function(username, key, cb){
	// note username is not used
	connection.collection("data").findOne({"_id": key}, function(err, obj){
	    if (err){
		cb(err, undefined);
	    } else{
		cb(undefined, obj);
	    }
	});
    };

    Storage.prototype.put = function(username, key, value, cb){
	// note username is not used
	connection.collection("data").update({"_id": key}, 
					     {"_id": key, value: value},
					     {upsert: true},
					     function(err){
						 cb(err);
					     });
    };

    Storage.prototype.purge = function(username, key, cb){
	// note username is not used
	connection.collection("data").remove({"_id": key}, function(err){
	    cb(err);
	});
    };
    return Storage;
};
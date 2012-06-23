var mongo = require('mongoskin');
var crypto = require('crypto');

module.exports = function(settings){
    var connection = mongo.db(settings.db.host + ":" + settings.db.port + "/" + settings.db.db);
    //connection.collection("users").ensureIndex([["username", 1]], true, function(){});

    function Auth(){
    };

    Auth.prototype.checkAuth =  function(username, password, cb)
    {
	crypto.pbkdf2(password, username, 10000, 1024, function(err, key) {
	    if (err){
		console.error(err);
		cb(false);
		return;
	    }
	    connection.collection("users").findOne({"_id": {"username": username}, "password": key}, function(err, obj){
	    if (err){
		console.error(err);
		cb(false);
		return;
	    }
		// console.dir(obj);
		if (!obj)
		{
		    listKey = crypto.randomBytes(40).toString("hex");
		    salt = crypto.randomBytes(40).toString("hex");
		    connection.collection("users").insert({"_id": {"username": username},
							   "password": key, 
							   "listKey": listKey,
							   "salt": salt});
		    cb(false);
		    return;
		}
		cb(true, {listKey: obj.listKey, salt: obj.salt});
	    });
	});
    };

    return Auth;
}

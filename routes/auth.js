var mongo = require('mongoskin');
var crypto = require('crypto');
var util = require('util');
var fs = require('fs');
var nodemailer = require('nodemailer');

module.exports = function(settings){
    var connection = mongo.db(settings.db.host + ":" + settings.db.port + "/" + settings.db.db);
    var transport = nodemailer.createTransport("SMTP", settings.smtp);
    //connection.collection("users").ensureIndex([["username", 1]], true, function(){});

    function Auth(){
    };

    Auth.prototype.signup = function(req, res){
	req.assert("semail", "Invalid email").notEmpty().isEmail();
	req.assert("spassword", "Password is too short").notEmpty().len(10);
	req.assert("spassword2", "Passwords do not match").equals(req.param("spassword"));

	var validationErrors = req.validationErrors(true);
	if (validationErrors){
	    res.json(200, {"errors": validationErrors});
	    return;
	}
	var email = req.param("semail");
	var text = util.format(fs.readFileSync("views/mail_activation.txt", "utf8"), "blah");
	console.log(text);
	var mailOptions = {
	    from: "14cube notifications <notification@14cube.com>",
	    to: email,
	    subject: "14cube account activation",
	    text: text
	};
	//transport.sendMail(mailOptions, function(err, response){
	//    console.dir(err);
	//    console.log(response);
	//});
	res.json(200, {"result": "ok"});
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

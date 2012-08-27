var crypto = require('crypto');

module.exports = function(settings, storage){
    function SignUp(){
    };
    SignUp.prototype.signup = function(req, res){
	console.log("aaa");
	res.json(200, {"blah": "minor"});
    };
    return SignUp;
};
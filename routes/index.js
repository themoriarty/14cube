var crypto = require('crypto');

module.exports = function(settings, storage){
    function Routes(){
    };

    var Auth = require("./auth")(settings);
    var auth = new Auth();
    Routes.prototype.signup = auth.signup;
    Routes.prototype.index = function(req, res){
	if (!req.session || !req.session.username){
	    res.render("login", {title: "Login", token: req.session._csrf});
	} else{
	    res.render("welcome", {name: req.session.username, 
				   error: undefined, 
				   args: req.session["args"]});
	}
    };

    Routes.prototype.login = function(req, res){
	req.session._csrf = undefined;
	username = req.param("username")
	password = req.param("password")
	auth.checkAuth(username, password, function(ok, result){
	    if (ok){
		req.session["username"] = username;
		req.session["args"] = result;
		req.session.save();
		res.redirect("/");
	    } else{
		res.redirect("/authFailed");
	    }
	});
    };
    Routes.prototype.logout = function(req, res){
	req.session.destroy();
	res.send(200);
    };

    Routes.prototype.authFailed = function(req, res){
	res.render("authFailed", {title: "Authentification failed"});
    };

    Routes.prototype.get = function(req, res){
	if (!req.session || !req.session.username){
	    return res.send(403);
	}
	storage.get(req.session.username, req.param("key"), function(err, result){
	    if (err){
		console.error(err);
		res.send(503);
	    } else{
		res.json(200, result);
	    }
	});
    }
    Routes.prototype.put = function(req, res){
	if (!req.session || !req.session.username){
	    return res.send(403);
	}
	req.session._csrf = undefined;
	storage.put(req.session.username, req.param("key"), req.param("value"), function(err){
	    if (err){
		console.error(err);
		res.send(503);
	    } else{
		res.json(200, {error: ""});
	    }
	});
    }
    Routes.prototype.purge = function(req, res){
	if (!req.session || !req.session.username){
	    return res.send(403);
	}
	req.session._csrf = undefined;
	storage.purge(req.session.username, req.param("key"), function(err){
	    if (err){
		console.error(err);
		res.send(503);
	    } else{
		res.json(200, {error: ""});
	    }
	});
    }
    Routes.prototype.rnd = function(req, res){
	res.json(200, {iv: crypto.randomBytes(parseInt(req.param("bytes"), 10)).toString("hex"), token: req.session._csrf});
    }
    Routes.prototype.nrnd = function(req, res){
	var n = parseInt(req.param("bytes"), 10);
	var b = crypto.randomBytes(n);
	var ret = new Array();
	for (var i = 0; i < b.length; ++i){
	    ret.push(b[i]);
	}
	res.json(200, ret);
    }
    return Routes;
}
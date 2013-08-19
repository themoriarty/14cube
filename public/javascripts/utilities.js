function isOffline(){
    try{
	if (g_isOffline){
	    return true;
	}
    } catch (e){
    }
    return false;
}

function randomString(len, cb){
    if (isOffline()){
	return reportOffline();
    }
    $.get("/rnd", {bytes: len}, function(data){
	cb(data.iv, data.token);
    });
}
function get(ckey, key, cb){
    function onData(data){
	if (data && data.value){
	    obj = JSON.parse(data.value);
	    iv = CryptoJS.enc.Hex.parse(obj.iv);
	    try{
		value = CryptoJS.AES.decrypt(obj.value, ckey, {iv: iv}).toString(CryptoJS.enc.Utf8);
	    } catch(e){
		cb('Incorrect storage password', undefined);
		return;
	    }
	    cb(undefined, JSON.parse(value));
	    return;
	}
	cb(undefined, undefined);
    }

    if (isOffline()){
	onData(g_data[key]);
    } else{
	$.get("/get", {key: key}, onData, "json");
    }
}
function put(ckey, key, value, cb){
    if (isOffline()){
	return reportOffline();
    }

    randomString(20, function(ivStr, token){
	iv = CryptoJS.enc.Hex.parse(ivStr);
	encodedValue = CryptoJS.AES.encrypt(JSON.stringify(value), ckey, {iv: iv}).toString();
	$.post("/put", {key: key, 
			value: JSON.stringify({iv: ivStr, value: encodedValue}), 
			"_csrf": token}, function(data){
			    cb(false);
			}, "json");
    }, "json");
    return;
}
function getToken(cb){
    if (isOffline()){
	return reportOffline();
    }

    $.get("/rnd", {bytes: 0}, function(data){
	cb(data.token);
    });
}

function purge(ckey, key, cb){
    if (isOffline()){
	return reportOffline();
    }

    $.get("/rnd", {bytes: 0}, function(data){
	console.log(key);
	$.post("/purge", {key: key,
			  "_csrf": data.token}, function(d){
			      cb(false);
			  }, "json");
    });
}

function generatePassword(len, useSpecials, cb){
    var symbols = "";
    if (useSpecials){
	for (var c = 33; c <= 126; ++c){
	    symbols += String.fromCharCode(c);
	}
    } else
    {
	for (var c = "a".charCodeAt(0); c <= "z".charCodeAt(0); ++c){
	    symbols += String.fromCharCode(c);
	}
	symbols += symbols.toUpperCase();
	for (var c = "0".charCodeAt(0); c <= "9".charCodeAt(0); ++c){
	    symbols += String.fromCharCode(c);
	}
    }
    $.get("/nrnd", {bytes: len}, function(rndValues){
	var ret = new String();
	for (var i = 0; i < len; ++i){
	    ret += symbols[rndValues[i] % symbols.length];
	}
	cb(ret);
    }, "json");
}

function sanitizeUrl(t){
    if (!t)
    {
	return undefined;
    }
    // TODO proper schema validation
    if (t.indexOf("http://") == -1 && 
	t.indexOf("https://") == -1 &&
	t.indexOf("ftp://") == -1){
	t = "http://" + t;
    }
    return $("<div>").text(t).text();
}

function reportError(msg){    
    $("#content").html($("<h4>").addClass("userError").text(msg));
    $("<a>").attr("href", "/").text("Home").appendTo($("#content"));
    return false;
}

function reportUserError(msg){
    $("#controls .userError").text(msg);
    return false;
}

function reportOffline(){
    var errText = "Can't do that in offline mode";
    reportError(errText);
    return errText;
}
function randomString(len, cb){
    $.get("/rnd", {bytes: len}, function(data){
	cb(data.iv, data.token);
    });
}
function get(ckey, key, cb){
    $.get("/get", {key: key}, function(data){
	if (data && data.value){
	    obj = JSON.parse(data.value);
	    iv = CryptoJS.enc.Hex.parse(obj.iv);
	    value = CryptoJS.AES.decrypt(obj.value, ckey, {iv: iv}).toString(CryptoJS.enc.Utf8);
	    cb(undefined, JSON.parse(value));
	    return;
	}
	cb(undefined, undefined);
    }, "json");
}
function put(ckey, key, value, cb){
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

function generatePassword(len, useSpecials, cb){
    var symbols = "";
    if (useSpecials){
	for (var c = 33; c <= 126; ++c){
	    symbols += String.fromCharCode(c);
	}
    } else
    {
	for (var c = String.charCodeAt('a'); c <= String.charCodeAt('z'); ++c){
	    symbols += String.fromCharCode(c);
	}
	symbols += String.toUpperCase(symbols);
	for (var c = String.charCodeAt('0'); c <= String.charCodeAt('9'); ++c){
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

function reportError(msg){
    console.log(msg);
}
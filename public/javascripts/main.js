function MainController(ckey){
    this._ckey = ckey;
}
MainController.prototype.lock = function(){console.log("lock")};
MainController.prototype.unlock = function(){console.log("unlock")};

MainController.prototype.deleteObject = function(key){
    var self = this;
    self.lock();
    delete self.urls[key];
    put(self._ckey, listKey, self.urls, function(err){
	self.unlock();
	if (err){
	    return reportError(err);
	}
	self.refreshUrlList();
    });
};
MainController.prototype.newObject = function(obj, onSuccess){
    var self = this;
    self.lock();
    randomString(40, function(rnd){
	self.urls[obj.url] = rnd;
	put(self._ckey, listKey, self.urls, function(err){
	    if (err){
		self.unlock();
		return reportError(err);
	    }
	    put(self._ckey, self.urls[obj.url], obj, function(err){
		if (err){
		    self.unlock();
		    return reportError(err);
		}
		self.unlock();
		onSuccess();
		self.refreshUrlList();
	    });
	});
    });
};
MainController.prototype.createControls = function(){
    var self = this;
    $("#templates > .newRecord").clone().appendTo("#controls");
    $("#controls .add").click(function(){
	reportUserError("");
	var obj = {url: sanitizeUrl($("#controls .url").attr("value")), 
		   login: $("#controls .login").attr("value"), 
		   password: $("#controls .password").attr("value")};
	if (!obj.url){
	    return reportUserError("Bad url");
	}
	if (self.urls[obj.url]){
	    return reportUserError("Url already exists");
	}
	self.newObject(obj, function(){
	    $("#controls .newRecord :input[type != submit]").filter(":not(select)").attr("value", "");
	});
	return false;
    });
    $("#controls .generate").click(function(){
	var len = $("#controls .maximumLen").attr("value");
	var useSpecials = $("#controls .useSpecials").attr("checked");
	generatePassword(len, useSpecials, function(v){
	    $("#controls .password").attr("value", v);
	});
	return false;
    });

    $("#templates > .search").clone().appendTo("#controls");
    $("#controls .searchText").focusin(function(){
	if ($("#controls .searchText").attr("value") == $("#templates .searchText").attr("value")){
	    $("#controls .searchText").attr("value", "");
	}
    });
    $("#controls .searchText").focusout(function(){
	if (!$("#controls .searchText").attr("value")){
	    $("#controls .searchText").attr("value", $("#templates .searchText").attr("value"));
	}
    });
    $("#controls .searchForm").submit(function(){return false;});
    $("#controls .searchText").keyup(function(event){
	if (event.keyCode == 13)
	{
	    var buttons = $("#entryList .entryUrl:visible");
	    if (buttons.size() == 1){
		buttons.click();
	    }
	}
	var text = $("#controls .searchText").attr("value");
	setTimeout(function(){
	    if ($("#controls .searchText").attr("value") == text)
	    {
		text = text.toLowerCase();
		$(".entry2").each(function(){
		    if ($(this).find(".entryUrl").text().toLowerCase().indexOf(text) == -1){
			$(this).hide();
		    } else{
			$(this).show();
		    }
		});
	    }
	}, 300);
    });
};

MainController.prototype.refreshUrlList = function(){
    var self = this;
    var newContent = $("#templates > .entry2FullContainer").clone();
    /*
    for (var url in self.urls){
	var d = $("#templates > .entry").clone();
	d.find(".entryUrl").text(url).attr("href", url);
	d.appendTo(newContent);
    }
    */
    var divs = new Array();
    for (var i = 0; i < 3; ++i){
	divs.push($("#templates > .entry2Container").clone());
    }
    var i = 0;
    for (var url in self.urls){
	var d = $("#templates > .entry2").clone();
	d.find(".entryUrl").text(url);
	d.find(".entry2Go").attr("href", url);
	d.appendTo(divs[i % divs.length]);
	i++; 
    }
    for (var i = 0; i < divs.length; ++i){
	if (i == 0)
	{
	    divs[i].addClass("first");
	}
	if (i == divs.length - 1)
	{
	    divs[i].addClass("last");
	}
	divs[i].appendTo(newContent);
    }
    $("#entryList").html(newContent);
    $(".entryUrl").click(function(){
	if ($(this).parent().parent().find(".entryLogin:visible").size() > 0)
	{	    
	    var thisObj = this;
	    $(this).parent().siblings(".entry2body").slideUp('fast', function(){
		$(thisObj).parent().parent().find(".entryLogin").attr("value", "");
		$(thisObj).parent().parent().find(".entryPassword").attr("value", "");
	    });
	    return false;
	}
	$(this).parents().siblings(".entry2body").slideDown();
	var key = self.urls[$(this).text()];
	var thisButton = this;
	get(self._ckey, key, function(err, data){
	    if (err){
		return reportError(err);
	    }
	    $(thisButton).parent().parent().find(".entryLogin").attr("value", data.login);
	    $(thisButton).parent().parent().find(".entryPassword").attr("value", data.password);
	});
	return false;
    });
    $(".entry2Delete").click(function(){
	if ($(this).parent().siblings(".entry2confirmation").find(".confirmationText:visible").size() > 0)
	{
	    var thisObj = this;
	    $(this).parent().siblings(".entry2confirmation").slideUp('fast', function(){
		$(thisObj).parent().siblings(".entry2confirmation").find(".confirmationText").text("");
	    });
	    return false;
	}
	$(this).parent().siblings(".entry2confirmation").find(".confirmationText").text("Are you sure?");
	$(this).parent().siblings(".entry2confirmation").slideDown();
	return false;
    });
    $(".entry2confirmationCancel").click(function(){
	var thisObj = this;
	$(this).parent().slideUp('fast', function(){
	    $(thisObj).parent().find(".confirmationText").text("");
	});
	return false;
    });
    $(".entry2confirmationOk").click(function(){
	var url = $(this).parent().parent().find(".entryUrl").text();
	self.deleteObject(url);
	return false;
    });
};
MainController.prototype.start = function(){
    var self = this;
    get(this._ckey, listKey, function(err, urls){
	if (err){
	    return reportError(err);
	}
	self.createControls();
	if (urls){
	    self.urls = urls;
	    self.refreshUrlList();
	} else{
	    self.urls = {};
	}
	$("#controls .searchText").focus();
    });
};

function getPassword(cb){
    return cb("this is my password");
    $("#templates .passwordBox").clone().appendTo("#content");
    $("#content .storagePassword").focus();
    $("#content .storagePasswordForm").submit(function(){
	var pass = $(this).find(".storagePassword").attr("value");
	$("#content .passwordBox").remove();
	cb(pass);
	return false;
    });
}

function main(){
    $.getScript("/javascripts/crypto/rollups/aes.js", function(){
	$.getScript("/javascripts/crypto/rollups/pbkdf2.js", function(){
	    $(".logOut").click(function(){
		getToken(function(token){
		    $.post("/logout", {"_csrf": token}, function(){
			location.reload();
		    });
		});
		return false;
	    });
	    getPassword(function(password){
		var ckey = CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 1000 });
		var m = new MainController(ckey);
		m.start();
	    });
	});
    });
};


$(document).ready(function(){main();});
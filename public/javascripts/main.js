var password = "this is my password";

function MainController(ckey){
    this._ckey = ckey;
}
MainController.prototype.lock = function(){console.log("lock")};
MainController.prototype.unlock = function(){console.log("unlock")};
MainController.prototype.newObject = function(obj, onSuccess){
    var self = this;
    self.lock();
    randomString(40, function(rnd){
	console.log(rnd);
	self.urls[obj.url] = rnd;
	console.log(self.urls);
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
	var obj = {url: $("#controls .url").attr("value"), 
		   login: $("#controls .login").attr("value"), 
		   password: $("#controls .password").attr("value")};
	self.newObject(obj, function(){
	    $("#controls .newRecord :input[type != submit]").filter(":not(select)").attr("value", "");
	});
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
    $("#controls .doSearch").click(function(){
	var text = $("#controls .searchText").attr("value");
	console.log(text);
	return false;
    });
    $("#controls .searchText").focusin(function(){
	$("#controls .searchText").attr("value", "");
    });
    $("#controls .searchText").focusout(function(){
	if (!$("#controls .searchText").attr("value")){
	    $("#controls .searchText").attr("value", $("#templates .searchText").attr("value"));
	}
    });
    $("#controls .searchText").keyup(function(event){
	if (event.keyCode == 13)
	{
	    var buttons = $("#entryList .entryButton:visible");
	    if (buttons.size() == 1){
		buttons.click();
	    }
	}
	var text = $("#controls .searchText").attr("value");
	setTimeout(function(){
	    if ($("#controls .searchText").attr("value") == text)
	    {
		text = text.toLowerCase();
		$(".entry").each(function(){
		    if ($(this).find(".entryUrl").attr("value").toLowerCase().indexOf(text) == -1){
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
    var newContent = $("<div>");
    for (var url in self.urls){
	newContent.append($("<div>").addClass("entry")
			  .append($("<input>").addClass("entryUrl").attr("value", url))
			  .append($("<input type='submit'>").addClass("entryButton").attr("value", ">>"))
			  .append($("<span>").addClass("entryLogin"))
			  .append($("<span>").addClass("entryPassword")));
    }
    $("#entryList").html(newContent);
    $(".entryButton").click(function(){
	if ($(this).siblings(".entryLogin").text())
	{
	    $(this).siblings(".entryLogin").text("");
	    $(this).siblings(".entryPassword").text("");
	    return;
	}
	$(this).attr("disabled", true);
	var key = self.urls[$(this).siblings(".entryUrl").attr("value")];
	var thisButton = this;
	get(self._ckey, key, function(err, data){
	    $(thisButton).attr("disabled", false);
	    if (err){
		return reportError(err);
	    }
	    $(thisButton).siblings(".entryLogin").text(data.login);
	    $(thisButton).siblings(".entryPassword").text(data.password);
	});
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

function main(){
    $.getScript("/javascripts/crypto/rollups/aes.js", function(){
	$.getScript("/javascripts/crypto/rollups/pbkdf2.js", function(){
	    var ckey = CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 1000 });
	    var m = new MainController(ckey);
	    m.start();
	});
    });
};


$(document).ready(function(){main();});
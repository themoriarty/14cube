function refreshTicket(cb){
    $.get("/rnd", {bytes: 0}, function(data){
	$("input[name=_csrf]").attr("value", data.token);
	$("input[type=submit]").removeAttr("disabled");
	cb();
    });
}
$(document).ready(function(){
    $('.nav-tabs a').click(function (e) {
	e.preventDefault();
	$(this).tab('show');
    });

    $("#signIn input[type=submit]").click(function(e){
	var self = this;
	$(this).attr("disabled", "disabled");
	refreshTicket(function(){
	    $(self).parent().submit();
	});
	return false;
    });
    $("#signUp input[type=submit]").click(function(e){
	var self = this;
	$(self).parentsUntil("#signUp").find(".control-group").removeClass("error");
	$(self).parentsUntil("#signUp").find("span").text("");
	$(this).attr("disabled", "disabled");
	refreshTicket(function(){
	    var data = {};
	    $(self).parent().find("input[type != submit]").each(function(i, e){
		data[$(e).attr("name")] = $(e).attr("value");
	    });
	    $.post($(self).parent().attr("action"), data, function(d){
		if (d.errors){
		    for (var field in d.errors){
			var input = $(self).parentsUntil("#signUp").find("input[name='" + field + "']");
			input.parent().addClass("error");
			input.siblings("span").text(d.errors[field].msg);
		    }
		}
		$(self).removeAttr("disabled");
	    });
	});
	return false;
    });
});

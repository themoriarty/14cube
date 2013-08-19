/*
	, 
	, create_html_doc = function(html) {
		var
			  dt = 
			, 
			, doc_el = doc.documentElement
			, head = doc_el.appendChild(doc.createElement("head"))
			, charset_meta = head.appendChild(doc.createElement("meta"))
			, title = head.appendChild(doc.createElement("title"))
			, body = doc_el.appendChild(doc.createElement("body"))
			, i = 0
			, len = html.childNodes.length
		;
		charset_meta.setAttribute("charset", html.ownerDocument.characterSet);
		for (; i < len; i++) {
			body.appendChild(doc.importNode(html.childNodes.item(i), true));
		}
		var title_text = guess_title(doc);
		if (title_text) {
			title.appendChild(doc.createTextNode(title_text));
		}
		return doc;
	}

	var
		  BB = get_blob()
		, xml_serializer = new XMLSerializer
		, doc = create_html_doc(html)
	;
	saveAs(
		  new BB(
			  [xml_serializer.serializeToString(doc)]
			, {type: "application/xhtml+xml;charset=" + document.characterSet}
		)
		, (html_filename.value || html_filename.placeholder) + ".xhtml"
	);
*/

function getNewVariables(ckey, cb){
    var ret = "var g_isOffline = true;";
    ret += "var g_data = {";
    get(ckey, listKey, function(err, urls){
	if (err){
	    reportError("Can't fetck offline key. " + err);
	    return cb(err);
	}
	$.get("/get", {key: listKey}, function(listKeyRaw){
	    ret += "'" + listKey + "': " + JSON.stringify(listKeyRaw);
	    var urlsLeft = 0;
	    for (var a in urls){
		urlsLeft++;
	    }
	    if (urlsLeft > 0){
		ret += ", ";
	    } else{
		return cb(undefined, ret + "};");
	    }
	    for (var i in urls){
		function impl(url){
		    $.get("/get", {key: url}, function(data){
			if (false){
			    reportError("Can't fetck offline key. " + err);
			    return cb(err);
			}
			var isLast = (--urlsLeft == 0);
			ret += "'" + url + "': " + JSON.stringify(data);
			if (isLast){
			    cb(undefined, ret + "};");
			} else{
			    ret += ", ";
			}
		    });
		};
		impl(urls[i]);
	    }
	});
    });
}

function saveOffline(ckey){
    var doc_impl = document.implementation;
    var doc = doc_impl.createDocument("http://www.w3.org/1999/xhtml", "html", doc_impl.createDocumentType('html', null, null));
    doc.documentElement.appendChild(document.head.cloneNode("head"));
    doc.documentElement.appendChild(document.body.cloneNode("body"));
    var meta = doc.createElement("meta");
    $(meta).attr("http-equiv", "Content-Type");
    $(meta).attr("content", "text/html; charset=utf-8");
    doc.head.appendChild(meta);

    $(doc.body).find("#content > #controls > *").remove()
    $(doc.body).find("#content > #entryList > *").remove()

    var theScript = $(doc.head).find("script:not([src])");

    var scriptsRemaining = $(doc.head).find("script[src]").length;
    $(doc.head).find("script[src]").each(function(_, s){
	var url = $(s).attr('src');
	$.get(url, function(data){
	    $(s).text(data);
	    $(s).removeAttr('src');
	    if (--scriptsRemaining == 0){
		var stylesRemaining = $(doc.head).find("link").length;
		$(doc.head).find("link").each(function(_, l){
		    var url = $(l).attr("href");
		    $.get(url, function(data){
			var newS = doc.createElement("style");
			$(newS).text(data);
			$(l).after(newS);
			$(l).remove()
			if (--stylesRemaining == 0){
			    getNewVariables(ckey, function(err, data){
				if (err){
				    return reportError(err);
				}
				console.log(data);
				theScript.text(theScript.text() + data);

				$.getScript("/javascripts/FileSaver.min.js", function(){
				    var blob = new Blob([new XMLSerializer().serializeToString(doc)],
							{type: "text/html; charset=" + document.characterSet});
				    saveAs(blob, "14cube.html");
				});

			    });
			}
		    });
		});
	    }
	});
    });

}
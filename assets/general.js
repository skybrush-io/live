
String.prototype.replaceAll = function(s1,s2) {return this.split(s1).join(s2);}

function dw(s) {document.writeln(s);}
function zpad(n,k) {n="0000000000000000"+n;n=n.substr(n.length-k);return n;}

function iterateHTML(tplSelector,replacementRule) {

	var tpl = $(tplSelector).html().trim();
	var h = "";
	
	console.log("Working from template "+tpl);

	if(typeof(replacementRule)=="object") {
		var a = replacementRule;
		for(var i in a) {
			h+=tpl
				.replaceAll("[[code]]",i)
				.replaceAll("[[capt]]",a[i])
			;
		}
	}
	if(typeof(replacementRule)=="number") {
		var m = replacementRule;
		for(i=1;i<=m;++i) {
			h+=tpl
				.replaceAll("[[nnn]]",zpad(i,3))
				.replaceAll("[[nn]]",zpad(i,2))
				.replaceAll("[[n]]",i)
			;
		}
	}

	return h;

}


function performAction(o,what) {
	
	var ca = $(o).closest(".control-area");
	if(ca.hasClass("feature-switches")) {
	
		if(what=="click") {
			$(o).toggleClass("switch-off").toggleClass("switch-on");
		}
		
	}
	
}


//in:"20160118.014707", merre tovább hogyan
//url:"file:///D:/http/collmot/Denes/screen.html"
//url:"http://me/collmot/Denes/dev-only/autocompile.less.php"

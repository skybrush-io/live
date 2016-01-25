<?php
include("inc.lesscompiler.php");

if(!$_GET["poll"]) {
	?>
	<title> ............................. </title>
	<link rel="stylesheet" href="../assets/bootstrap/bootstrap.css">
	<link rel="icon" href="../assets/less.icon.png" type="image/x-icon" />
	<script src="../assets/jquery.js"></script>
	<script>
	
		$.get("autocompile.less.php",{"poll":1},function(n) {
			if(n==1) top.document.title="Recompiled";
			setTimeout("location.reload()",800);
		});
		
		setInterval(function(){
			var h = $(".anibar").html();
			h = h.substr(-1) + h.substr(0,h.length-1);
			$(".anibar").html(h);
		
		},301);
	
	</script>
	<body style="background-color:#1c3142;color:rgba(255,255,255,0.6);padding:70px 140px;">

	<h1>LESS to CSS autocompiler</h1><br>
	Just leave it alone, it does the job automatically<br><br>
	<span class="anibar">........................watching.for.changes..............................................</span>
	
	<?
	exit;
}

$file = "../assets/screen.less";

$unchanged = @filemtime("$file.css");
for($i=0;$i<100;++$i) {
	clearstatcache();
	$mt = @filemtime($file);
	if($mt>$unchanged) {
		lessUpdate($file);
		print 1;
		exit;
	}
	usleep(1000*400);
}       
print 0;

exit;



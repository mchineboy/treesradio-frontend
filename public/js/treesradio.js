
//
// TREES RADIO PRE-MINIFICATION JS
// 
//
//
//
//

// Important Style Things
$(document).ready(function() {

	$('#syncbtn').hide();

	var windowHeight = $(window).height();
	$("html").css("height", windowHeight);


	$(window).resize(function() {
		var windowHeight = $(window).height();

		$("html").css("height", windowHeight);

	});

}); 





// TEST CODE
function fakeChat(e){
	if(e.keyCode === 13){
		var msgTosend = $("#chatinput").val();
		$("#chatscroll").append("<li class='chat-item'><span class='chat-username'>thrawn93</span><br><span class='chat-text'>" + msgTosend + "</span></li>");
		$("#chatinput").val("");
		$("#chatscroll").animate({ scrollTop: $('#chatscroll').prop("scrollHeight")}, 1000);
	}
}




//==============================================================
// USER REGISTRATION
//==============================================================
function callRegisterUser() {
	var desiredemail = $("#user-register-email").val();
	var desiredpass = $("#user-regsiter-password").val();
	var desireduser = $("#user-register-username").val();
	
	
	var ref = new Firebase("https://treesadio.firebaseio.com");
	ref.createUser({
		email: desiredemail,
		password: desiredpass
	}, function(error, userData) {
		if (error) {
			console.log("Error creating user:", error);
		} else {
			console.log("Successfully created user with uid:", userData.uid);
		}
	});
}




///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// PRE-FIREBASE
/*
//==============================================================
// Some Globals
//==============================================================
var RadioBaseApiUrl = "https://treesradio1.herokuapp.com";
var ytURL = "https://www.youtube.com/watch?v=";

//==============================================================
// PUSHER
//==============================================================
var pusher = new Pusher('1606b459b1e64280f3dc', {
	encrypted: true,
	authEndpoint: '/api/pusher/auth'
});

//videosync channel sub
var videosyncdata = pusher.subscribe('videosync');



//==============================================================
// VIDEOJS
//==============================================================

var player = videojs("player", { "techOrder": ["youtube"], "src": "https://www.youtube.com/watch?v=uBBDMqZKagY" }).ready(function(){
	//runs when loaded
	player.play();
	$('#syncbtn').hide();
});
player.volume(0.5);
setInterval(() => {
    $('#progress').animate({
        duration: 200,
        width: (player.currentTime() / player.duration()) * 100 + "%"
    });
}, 500);
setInterval(function(){
	if (player.paused()) {
		$('#syncbtn').show();
	}
}, 500);
function refreshVolume () {
	var curVol = player.volume();
	var volSliderRaw = $("#volslider").slider("value");
	var volSliderVal = volSliderRaw / 100;
	if (volSliderVal != curVol) {
		player.volume(volSliderVal);
	}
}
var volslider = $("#volslider").slider({
	range: "min",
	max: 100,
	orientation: "horizontal",
	slide: refreshVolume,
	change: refreshVolume
});

//==============================================================
// VIDEO PUSHER STUFF
//==============================================================
videosyncdata.bind('newvideo', function(data){
	var newurl = ytURL + data;
	player.src(newurl);
	player.play();
});
videosyncdata.bind('heartbeat', function(data){
	//var hbdataraw = this.;
	//var hbdata = JSON.parse(hbdataraw);
	//var findme = this.data;
	curURL = ytURL + data.vid;
	remCurTime = data.ts;
	remBottom = remCurTime - 10;
	remTop = remCurTime + 10;
	locCurTime = player.currentTime();
	if (player.currentSrc() != curURL) {
		player.src(curURL);
		player.currentTime(remCurTime);
		player.play();
		$('#syncbtn').hide();
	} else if (locCurTime < remBottom || locCurTime > remTop) {
		$('#syncbtn').show();
	} else {
		$('#syncbtn').hide();
	}


});

function SyncUp () {
	player.currentTime(remCurTime);
	player.play();
	$('#syncbtn').hide();
}


function callRegisterUser () {
	
	var emailToReg = $('#user-register-email').val();
	console.log("email = " + emailToReg);
	var passToReg = $('#user-regsiter-password').val();
	console.log("password = " + passToReg);
	$('#registerModal').modal('hide');


}

function callAuthUser () {

	var emailToAuth = $('#user-login-email').val();
	console.log("email = " + emailToAuth);
	var passToAuth = $('#user-login-password').val();
	console.log("password = " + passToAuth);
	$('#loginModal').modal('hide');

}*/

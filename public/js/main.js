var socket = io();

var game;
var view;

socket.on('connect', function (data) {
	game = new Game();
	view = new View();
	view.startDisplay();
});


socket.on('message', function(data) {
	console.log(data);
});

socket.on('disconnect', function() {});
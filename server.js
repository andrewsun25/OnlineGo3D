const express = require('express');
const socket = require('socket.io');
const routes = require('./routes/routes');


const app = express();

// Middlewares
app.use(express.static('public'));
// Route handler
app.all('*', routes);

// Server
var server = app.listen(process.env.port || 4000, function() { // If process.env.port is not null or defined use that
    console.log('now listening for requests');
});

// Socket set up
var io = socket(server);

var numGames = 0;
io.on('connection', function(socket) { // each socket connects to server with a socket

    console.log('user connected: ' + socket.id);

    // setTimeout(function() {
    //     socket.send('Sent a message 4seconds after connection!');
    // }, 4000);
    // io.emit('event'. {}) sends event to all listening sockets.
    // socket.broadcast.emit excludes the socket which calls broadcast.emit
    socket.on('createGame', function(data) {
    	console.log('new game created');
        socket.game = numGames;
        socket.join('game-'+numGames++);
        // socket.emit('newGame', { name: data.name });
    });

    socket.on('joinGame', function(data) {
        console.log('joining an exisiting game');
        socket.broadcast.to('game-'+numGames).emit('opponentJoined', socket.id);

        // socket.emit('newGame', { name: data.name });
    });

    socket.on('disconnect', function() {
        console.log("user disconnected: " + socket.id);
        socket.leave(socket.game);
    });
});



// Game events
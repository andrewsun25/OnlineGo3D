const express = require('express');
const routes = require('./routes/routes');

const app = express();

// Middlewares
app.use(express.static('public')); // looks in public folder for static resources.

// Route handler
app.all('*', routes);

var server = app.listen(process.env.port || 4000, function(){ // If process.env.port is not null or defined use that
	console.log('now listening for requests');
});
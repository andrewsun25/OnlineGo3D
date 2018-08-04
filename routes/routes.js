const express = require('express');
const router = express.Router();
const root = __dirname + '/../public/';


router.get('/', function(req, res, next) {
	res.sendFile('index.html');
});

router.get('/create-game', function(req, res, next) {
	res.sendFile('create-game.html', { root: root });
})

router.get('/join-game', function(req, res, next) {
	res.sendFile('join-game.html', { root: root });
})

module.exports = router;
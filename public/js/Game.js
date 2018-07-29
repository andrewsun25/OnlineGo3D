function Game() {

    // Static
    Game.BLACK = 1;
    Game.WHITE = 2;

    // Private
    currentPlayer = Game.BLACK;
    board = _zeros([19, 19]);

    // Public methods
    this.processMove = function(i, j) {
        if (board[i][j] == 0) {
            board[i][j] = currentPlayer;
            EventBus.dispatch('pointAddedEvent', this, { point: { i: i, j: j }, player: currentPlayer });
            currentPlayer == Game.WHITE ? currentPlayer = Game.BLACK : currentPlayer = Game.WHITE;
        } else {
            EventBus.dispatch('pointTakenEvent');
        }
    }


    // Private methods
    function _zeros(dimensions) {
        var array = [];
        for (var i = 0; i < dimensions[0]; ++i) {
            array.push(dimensions.length == 1 ? 0 : _zeros(dimensions.slice(1)));
        }
        return array;
    }
};

// Object.assign(Game.prototype, THREE.EventDispatcher.prototype);
Game.prototype.constructor = Game;

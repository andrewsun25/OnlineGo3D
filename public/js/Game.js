function Game() {
    const WHITE = 1;
    const BLACK = 2;
    this.board = _zeros([19, 19]);

    function _zeros(dimensions) {
        var array = [];
        for (var i = 0; i < dimensions[0]; ++i) {
            array.push(dimensions.length == 1 ? 0 : _zeros(dimensions.slice(1)));
        }
        return array;
    }
};

Game.prototype = Object.create( THREE.EventDispatcher.prototype );
Game.prototype.constructor = Game;
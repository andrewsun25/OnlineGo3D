function Group(piece) {
    piece.color == Game.WHITE ? this.type = "White Group" : this.type = "Black Group";
    this.color = piece.color;

    this.pieces = [];
    (this.addPiece = function(piece) {
        if (piece.color == this.color) {
            this.pieces.push(piece);
            piece.group = this;
        } else
            console.log("Trying to add different colored piece into group");
    }).call(this, piece);

    // appends all points of group to this group.
    this.absorbs = function(group) {
        for (let piece of group.pieces) {
            this.addPiece(piece);
        }
    }

    // CONST method
    this.touches = function(group) {
        for (let thisPiece of this.pieces) {
            for (let thatPiece of group.pieces) {
                if (thisPiece.touches(thatPiece)) {
                    return true;
                }
            }
        }
        return false;
    }
}

function Piece(coord, color) {
    color == Game.WHITE ? this.type = "White Piece" : this.type = "Black Piece";
    this.coord = coord;
    this.color = color;
    this.group;

    // CONST method
    this.touches = function(piece) {
        if (this.coord.topNeighbor().equals(piece.coord) || this.coord.bottomNeighbor().equals(piece.coord) ||
            this.coord.leftNeighbor().equals(piece.coord) || this.coord.rightNeighbor().equals(piece.coord)) {
            return true;
        } else {
            return false;
        }
    }
}

function Coordinate(i, j) {
    this.i = i;
    this.j = j;
    this.equals = function(coord) {
        return this.i === coord.i && this.j === coord.j;
    }
    this.topNeighbor = function() {
        return new Coordinate(i, j + 1);
    }
    this.bottomNeighbor = function() {
        return new Coordinate(i, j - 1);
    }
    this.leftNeighbor = function() {
        return new Coordinate(i - 1, j);
    }
    this.rightNeighbor = function() {
        return new Coordinate(i + 1, j);
    }
}


function Game() {

    // Static
    Game.BLACK = 0;
    Game.WHITE = 1;
    Game.EMPTY = 2;
    Game.OFF = 3;

    // Private
    var _currentColor = Game.BLACK; // if you omit var, JS looks up scope chain and creates it if not found.
    // var board = _empties([19, 19]);
    var _board = new Map(); // string --> Piece objects
    for (let i = 0; i < 19; i++) {
        for (let j = 0; j < 19; j++) {
            _board.set(parseCoordToString(i, j), null);
        }
    }

    var _groups = new Set(); // set of Group objects
    // Public methods
    this.processMove = function(i, j) {
        if (_board.get(parseCoordToString(i, j)) === null) { //  If the _board @ given coordinate is empty
            var newCoord = new Coordinate(i, j);
            var newPiece = new Piece(newCoord, _currentColor);

            // 1. Add newPiece to the _board
            _board.set(parseCoordToString(i, j), newPiece);

            var newGroup = new Group(newPiece);

            // 2. If the newGroup touches any existing friendly group, then append the old into the new and delete the old
            _mergeIfTouchingFriendly(_groups, newGroup);

            // 3.  Add the newGroup to exisiting _groups
            _groups.add(newGroup);

            // 4. Removes opponent's dead _groups or issues warning if current move is suicidal
            _removeDead(_groups);

            EventBus.dispatch('pieceAddedToScene', this, {
                addedAt: {
                    i: i,
                    j: j
                },
                pieceColor: _currentColor
            });

            // switches turns
            _currentColor = !_currentColor; // converts current color into a boolean
        } else {
            EventBus.dispatch('pieceCannotBeAddedToScene');
        }
    }

    // Private methods


    function _mergeIfTouchingFriendly(groups, newGroup) {
        // Loop throguh existing groups
        groups.forEach(function(oldGroup) {
            // newGroup touches friendly group then newGroup absorbs the old one
            if (newGroup.touches(oldGroup) && newGroup.color == oldGroup.color) {
                newGroup.absorbs(oldGroup); // adds all points from old to new
                groups.delete(oldGroup);
            }
        });
    }

    function _removeDead(groups) {
        for (let group of groups) {
            if (_countLiberties(group) < 1) {
                groups.delete(group);

                var removedPoints = [];
                for(let piece of group.pieces) {
                    removedPoints.push({
                        i: piece.coord.i,
                        j: piece.coord.j
                    });
                }
                for(let removedPoint of removedPoints) {
                    _board.set(parsePointToString(removedPoint), null);
                }
                EventBus.dispatch('piecesRemovedFromScene', this, {
                    removedPoints: removedPoints,
                });
            }
        }
    }

    function _countLiberties(group) {
        var liberties = 4 * group.pieces.length;
        for (let [coordString, otherPiece] of _board) {
            for (let piece of group.pieces) {
                if (otherPiece != null && piece.touches(otherPiece)) {
                    liberties--;
                }
            }
        }
        return liberties;
    }
}

// Object.assign(Game.prototype, THREE.EventDispatcher.prototype);
Game.prototype.constructor = Game;

// Warn if overriding existing method
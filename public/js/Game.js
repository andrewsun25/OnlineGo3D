// Game --> Group --> Piece --> Coordinate. 
function Game() {

    // Static
    Game.BLACK = 0;
    Game.WHITE = 1;

    // Private
    var _currentColor = Game.BLACK; // if you omit var, JS looks up scope chain and creates it if not found.

    var _board = new Map(); // coordinate strings --> Piece objects
    _board.setPiece = function(i, j, newPiece) {
        this.set(parseCoordToString(i, j), newPiece);
    }
    _board.getPiece = function(i, j) {
        return this.get(parseCoordToString(i, j));
    }
    // init _board to 19x19 board of null
    for (let i = 0; i < 19; i++) {
        for (let j = 0; j < 19; j++) {
            _board.setPiece(i, j, null);
        }
    }

    var _groups = new Set(); // set of Group objects representing groups of friendly black and white pieces

    var _lastCapturedPiece = null;
    var _KO = false; // whether go applies

    // Public methods
    this.processMove = function(i, j) {     // updates _board and _groups
        if (_board.getPiece(i, j) !== null) {
            EventBus.dispatch('pieceCannotBeAddedToScene', this, {
                reason: "coord taken",
            });
            return;
        }

        var newCoord = new Coordinate(i, j);
        var newPiece = new Piece(newCoord, _currentColor);

        // If the new move is made by the same player in the same spot where he was captured then KO rule applies
        if(newPiece.equals(_lastCapturedPiece) && _KO === true) {
            EventBus.dispatch('pieceCannotBeAddedToScene', this, {
                reason: "KO",
            });
            return;
        }

        _KO = false;

        // 1. Add new piece onto the board
        _board.setPiece(i, j, newPiece);

        if (_groups.size > 0) {
            // 2. Remove any opponent groups that we killed and return true if these existed a group to kill.
            var killedAGroup = _removeOpponentGroupsFromBoard();
        }

        // 3. If we didn't kill a group and the current move is suicidal then that's illegal
        if (!killedAGroup && _lastMoveIsSuicidal(i, j)) {
            _board.setPiece(i, j, null); // remove the illegal move from _board
            EventBus.dispatch('pieceCannotBeAddedToScene', this, {
                reason: "move is suicidal",
            });
            return;
        }

        // 4. Add a new group based on the current move (piece) to the game that might absorb existing groups if they touch
        var newGroup = new Group(newPiece);
        _absorbOldGroupsIntoNew(_groups, newGroup);

        EventBus.dispatch('pieceAddedToScene', this, {
            coordString: parseCoordToString(i, j),
            pieceColor: _currentColor
        });

        // 5. switches turns
        _currentColor === Game.BLACK ? _currentColor = Game.WHITE : _currentColor = Game.BLACK;
    }

    // returns whether or not a group was killed. Kills all groups of opponent's that should be dead.
    function _removeOpponentGroupsFromBoard() {
        var killedAGroup = false;
        for (let group of _groups) {
            // If group should be dead and group belongs to opponent
            if (_countLiberties(group) < 1 && group.color !== _currentColor) {
                killedAGroup = true;

                // KO rule
                if(group.pieces.length === 1) {
                    _lastCapturedPiece = group.pieces[0];
                    _KO = true;
                }

                // 1. Delete killed group from _groups
                _groups.delete(group);

                // 2. Remove the group's pieces from _board.
                var removedCoords = [];
                for (let piece of group.pieces) {
                    var removedCoordString = parseCoordToString(piece.coord.i, piece.coord.j);
                    removedCoords.push(removedCoordString);
                    _board.set(removedCoordString, null);
                }

                // 3. Notify the scene
                EventBus.dispatch('piecesRemovedFromScene', this, {
                    removedCoords: removedCoords,
                });
            }
        }
        return killedAGroup;
    }

    // checks if the last move is suicidal without modifying _groups or _board.
    function _lastMoveIsSuicidal(i, j) {
        // Simulate the new move and check if it causes a friendly group to die.
        var newCoord = new Coordinate(i, j);
        var newPiece = new Piece(newCoord, _currentColor);

        var newGroup = new Group(newPiece);
        var groupsCopy = new Set(_groups);
        _absorbOldGroupsIntoNew(groupsCopy, newGroup); 

        for (let group of groupsCopy) {
            // if group is killed and the group is friendly
            if (_countLiberties(group) < 1 && _currentColor === group.color) {
                return true;
            }
        }

        return false;
    }

    function _absorbOldGroupsIntoNew(groups, newGroup) {
        var friendlyGroups = Array.from(groups).filter((group) => group.color === newGroup.color);

        for (let friendlyGroup of friendlyGroups) {
            // If newGroup touches friendly group then newGroup absorbs the old one
            if (newGroup.touches(friendlyGroup)) {
                for (let piece of friendlyGroup.pieces) { // adds all points from old to new
                    newGroup.addPiece(piece);
                }
                groups.delete(friendlyGroup); // newGroup now contains all the pieces of friendlyGroup so friendlyGroup is no longer necessary
            }
        }

        groups.add(newGroup);
    }

    function _countLiberties(group) {
        var liberties = 0;

        for (let piece of group.pieces) {
            liberties += _countLiberties(piece);
        }

        return liberties;

        function _countLiberties(piece) {
            var coord = piece.coord;
            var liberties = coord.topNeighbor().inBounds + coord.bottomNeighbor().inBounds + coord.leftNeighbor().inBounds + coord.rightNeighbor().inBounds;
            for (let [coordString, otherPiece] of _board) {
                if (piece.touches(otherPiece)) {
                    liberties--;
                }
            }
            return liberties;
        }

    }

    // Helpers

    function _printBoard() {
        var notNullBoard = [];
        for (let [coordString, piece] of _board) {
            if (piece != null) {
                notNullBoard.push(coordString);
            }
        }
        console.log(notNullBoard);
        console.log("current color: " + _currentColor);
    }
}

// Object.assign(Game.prototype, THREE.EventDispatcher.prototype);
Game.prototype.constructor = Game;

function Group(piece) {
    piece.color === Game.WHITE ? this.type = "White Group" : this.type = "Black Group";
    this.color = piece.color;

    this.pieces = [];
    (this.addPiece = function(piece) {
        if (piece.color === this.color) {
            this.pieces.push(piece);
            piece.group = this;
        } else
            console.log("Trying to add different colored piece into group");
    }).call(this, piece);

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
    if (!coord.inBounds) {
        console.log("Piece is out of bounds");
        return;
    }
    color === Game.WHITE ? this.type = "White Piece" : this.type = "Black Piece";
    this.coord = coord;
    this.color = color;
    this.group = null;

    // CONST method
    this.touches = function(piece) {
        if (!piece) {
            return false;
        } else if (this.coord.topNeighbor().equals(piece.coord) || this.coord.bottomNeighbor().equals(piece.coord) ||
            this.coord.leftNeighbor().equals(piece.coord) || this.coord.rightNeighbor().equals(piece.coord)) {
            return true;
        } else {
            return false;
        }
    }

    this.equals = function(piece) {
        if(!piece) {
            return false;
        }
        return this.coord.equals(piece.coord) && this.color == piece.color;
    }
}

function Coordinate(i, j) {
    this.i = i;
    this.j = j;
    if (j > 18 || i > 18 || j < 0 || i < 0) {
        this.inBounds = false;
    } else {
        this.inBounds = true;
    }

    this.equals = function(coord) {
        if(!coord) {
            return false;
        }
        return this.i === coord.i && this.j === coord.j;
    }

    this.topNeighbor = function() {
        return new Coordinate(i, j - 1);
    }

    this.bottomNeighbor = function() {
        return new Coordinate(i, j + 1);
    }

    this.leftNeighbor = function() {
        return new Coordinate(i - 1, j);
    }

    this.rightNeighbor = function() {
        return new Coordinate(i + 1, j);
    }
}
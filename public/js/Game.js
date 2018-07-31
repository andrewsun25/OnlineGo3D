function Group(point) {
    point.color == Game.WHITE ? this.type = "White Group" : this.type = "Black Group";
    this.color = point.color;
    this.liberties = 0; // equal to sum of this.points.liberties

    this.points = [];
    (this.addPoint = function(point) {
        if (point.color == this.color) {
            this.points.push(point);
            point.group = this;
            // updateLiberties();
        } else
            console.log("Trying to add different colored point into group");
    })(point);

    // appends all points of group to this group.
    this.absorbs = function(group) {
        for (let point of group.points) {
            this.addPoint(point);
        }
    }

    // CONST method
    this.touches = function(group) {
        for (let thisPoint of this.points) {
            for (let thatPoint of group.points) {
                if (thisPoint.touches(thatPoint)) {
                    return true;
                }
            }
        }
        return false;
    }

    this.resolveContact = function(group) {
        console.log("resolveContact");
    }

    // function updateLiberties() {
    //     this.liberties = 0;
    //     for(let point of group.points) {
    //         this.liberties += point.liberties;
    //     }
    // }
}

function Point(coord, color) {
    color == Game.WHITE ? this.type = "White Point" : this.type = "Black Point";
    this.coord = coord;
    this.color = color;
    this.liberties = 4;
    this.group;

    // CONST method
    this.touches = function(point) {
        if (this.coord.topNeighbor().equals(point.coord) || this.coord.bottomNeighbor().equals(point.coord) ||
            this.coord.leftNeighbor().equals(point.coord) || this.coord.rightNeighbor().equals(point.coord)) {
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
    var currentColor = Game.BLACK; // if you omit var, JS looks up scope chain and creates it if not found.
    var board = _empties([19, 19]);
    var points = new Map();
    var groups = new Set();


    // Public methods
    this.processMove = function(i, j) {
        if (board[i][j] == Game.EMPTY) {
            board[i][j] = currentColor;
            var newCoord = new Coordinate(i, j);
            var newPoint = new Point(newCoord, currentColor);
            var newGroup = new Group(newPoint);



            _mergeIfTouching(groups, newGroup);

            groups.add(newGroup); // add newGroup to exisiting groups

            _removeDeadFrom(groups);

            EventBus.dispatch('pieceAddedToScene', this, {
                point: {
                    i: i,
                    j: j
                },
                color: currentColor
            });

            currentColor = !currentColor; // converts current color into a boolean
        } else {
            EventBus.dispatch('pieceCannotBeAddedToScene');
        }
    }

    // Private methods
    function _empties(dimensions) {
        var array = [];
        for (var i = 0; i < dimensions[0]; ++i) {
            array.push(dimensions.length == 1 ? Game.EMPTY : _empties(dimensions.slice(1)));
        }
        return array;
    }

    function _removeDead(groups) {
        groups.forEach(function(group) {
            if (_countLiberties(group) < 1) {
                groups.delete(group);
            }
        });
    }

    function _mergeIfTouching(groups, newGroup) {
        // Loop throguh existing groups
        groups.forEach(function(oldGroup) {
            // newGroup touches friendly group then newGroup absorbs the old one
            if (newGroup.touches(oldGroup) && newGroup.color == oldGroup.color) {
                newGroup.absorbs(oldGroup); // adds all points from old to new
                groups.delete(oldGroup);
                console.log("Group touched friendly group");
                console.log(oldGroup);
                console.log(newGroup);
                console.log(groups);
            }
        });
    }

    function _countLiberties(group) {
        var liberties = 4 * group.points.length;
        groups.forEach(function(otherGroup) {
            for (let otherPoint of otherGroup.points) {
                for (let point of group.points) {
                    liberties -= point.touches(otherPoint);
                }
            }
        })
    }
}

// Object.assign(Game.prototype, THREE.EventDispatcher.prototype);
Game.prototype.constructor = Game;

// Warn if overriding existing method
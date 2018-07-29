// Loading

function loadBoardAsync() {
    gObjLoader.load('board.obj', _onBoardLoad);

    function _onBoardLoad(object) {
        object.children.forEach(function(child) {
            gBoardGroup.add(child.clone()); // need to add the clone or else when child gets garbage collected bad stuff happens.
        });

        // Change names of gBoardGroup's children
        gBoardGroup.getObjectByName("Grid_Grid.003").name = "Grid";
        gBoardGroup.getObjectByName("Board_Cube").name = "Board";
        gBoardGroup.getObjectByName("Foot_Circle.003").name = "Foot";

        // Materials
        var boardMaterial = new THREE.MeshPhongMaterial({
            color: WOOD_COLOR,
        });
        var gridMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
        });

        // Apply materials to all children
        gBoardGroup.traverse(function(child) {
            if (child.name == "Grid") child.material = gridMaterial;
            else child.material = boardMaterial;
        });

        // Scale the Board
        gBoardGroup.scale = gBoardGroup.scale.multiplyScalar(BOARD_SCALE);
        gBoardGroup.updateMatrixWorld();

        // Find the dimensions of the grid and board
        var grid = gBoardGroup.getObjectByName("Grid");
        var gridBox = new THREE.Box3().setFromObject(grid); // size: x: 4, y: 0, z: 4
        var board = gBoardGroup.getObjectByName("Board");
        var boardBox = new THREE.Box3().setFromObject(board);
        BOARD_HEIGHT = boardBox.max.y + 0.01;

        // Add grid hit boxes

        var pointGeometry = new THREE.BoxBufferGeometry(BOARD_SCALE / 50, BOARD_SCALE / 50, BOARD_SCALE / 50);
        var pointMaterial = new THREE.MeshBasicMaterial({ color: BLUE_COLOR });

        for (var i = 0; i < 19; i++) {
            for (var j = 0; j < 19; j++) {
                var point = new THREE.Mesh(pointGeometry, pointMaterial);
                point.position.x = i * (gridBox.max.x - gridBox.min.x) / 18 + gridBox.min.x;
                point.position.y = BOARD_HEIGHT;
                point.position.z = j * (gridBox.max.z - gridBox.min.z) / 18 + gridBox.min.z;
                point.layers.set(1);
                point.name = i.toString() + "-" + j.toString();

                // updates the point if it is a starpoint
                // if ((i == 3 || i == 9 || i == 15) && (j == 3 || j == 9 || j == 15)) {
                //     point.scale = point.scale.multiplyScalar(1.5);
                //     point.name += "-StarPoint";
                // }
                gGridHitBoxes.add(point);
            }
        }
    } // _onBoardLoad
    loadPiecesAsync();
}

function loadPiecesAsync() {
    gObjLoader.load('piece.obj', (object) => {
        var piece = object.children[0];
        piece.position.y = BOARD_HEIGHT + 0.01;
        piece.scale = piece.scale.multiplyScalar(BOARD_SCALE);
        piece.updateMatrixWorld();

        gWhitePiece.geometry.copy(piece.geometry);
        gWhitePiece.position.copy(piece.position);
        gWhitePiece.scale.copy(piece.scale);

        gBlackPiece.geometry.copy(piece.geometry);
        gBlackPiece.position.copy(piece.position);
        gBlackPiece.scale.copy(piece.scale);

        gCursor.geometry.copy(piece.geometry);
        gCursor.scale.copy(piece.scale);

        var whiteMaterial = new THREE.MeshPhongMaterial({
            color: WHITE_COLOR,
            shininess: 125
        });
        gWhitePiece.material = whiteMaterial;

        var blackMaterial = new THREE.MeshPhongMaterial({
            color: BLACK_COLOR,
            shininess: 250
        });
        gBlackPiece.material = blackMaterial;

        var cursorMaterial = new THREE.MeshPhysicalMaterial({
            map: null,
            color: LIGHT_TEAL_COLOR,
            opacity: 0.7,
            side: THREE.FrontSide,
            transparent: true,
        });
        gCursor.material = cursorMaterial;
    });
}
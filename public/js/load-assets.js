// Loading

function loadBoardAsync() {
    gObjLoader.load('board.obj', _onBoardLoad);

    function _onBoardLoad(object) {
        object.children.forEach(function(child) {
            gBoardGroup.add(child.clone()); // need to add the clone or else when child gets garbage collected bad stuff happens.
        });

        // Change names of gBoardGroup's children
        gBoardGroup.getObjectByName("Grid_Grid.003").name = "GridMesh";
        gBoardGroup.getObjectByName("Board_Cube").name = "BoardMesh";
        gBoardGroup.getObjectByName("Foot_Circle.003").name = "FootMesh";

        // Materials
        var boardMaterial = new THREE.MeshPhongMaterial({
            color: WOOD_COLOR,
        });
        var gridMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
        });

        // Apply materials to all children
        gBoardGroup.traverse(function(child) {
            if (child.name == "GridMesh") child.material = gridMaterial;
            else child.material = boardMaterial;
        });

        // Scale the Board
        gBoardGroup.scale = gBoardGroup.scale.multiplyScalar(BOARD_SCALE);
        gBoardGroup.updateMatrixWorld();

        // Find the dimensions of the grid and board
        var grid = gBoardGroup.getObjectByName("GridMesh");
        var gridBox = new THREE.Box3().setFromObject(grid); // size: x: 4, y: 0, z: 4
        var board = gBoardGroup.getObjectByName("BoardMesh");
        var boardBox = new THREE.Box3().setFromObject(board);

        // Add grid hit boxes

        var hitBoxGeometry = new THREE.BoxBufferGeometry(BOARD_SCALE / 50, BOARD_SCALE / 50, BOARD_SCALE / 50);

        for (var i = 0; i < 19; i++) {
            for (var j = 0; j < 19; j++) {
                var hitBox = new THREE.Mesh(hitBoxGeometry, gMaterials.hitBoxMeshMaterial);
                hitBox.position.x = i * (gridBox.max.x - gridBox.min.x) / 18 + gridBox.min.x;
                hitBox.position.y = boardBox.max.y + 0.01;
                hitBox.position.z = j * (gridBox.max.z - gridBox.min.z) / 18 + gridBox.min.z;
                hitBox.layers.set(1);
                hitBox.name = i.toString() + "-" + j.toString();

                // updates the point if it is a starpoint
                // if ((i == 3 || i == 9 || i == 15) && (j == 3 || j == 9 || j == 15)) {
                //     point.scale = point.scale.multiplyScalar(1.5);
                //     point.name += "-StarPoint";
                // }
                gGridHitBoxes.add(hitBox);
            }
        }
    } // _onBoardLoad
}

function loadPiecesAsync() {
    gObjLoader.load('piece.obj', _onPieceLoad);

    function _onPieceLoad(object) {
        var piece = object.children[0];
        piece.scale = piece.scale.multiplyScalar(BOARD_SCALE);
        piece.updateMatrixWorld();

        gWhitePiece.geometry.copy(piece.geometry);
        gWhitePiece.material = gMaterials.whitePieceMeshMaterial;
        // gWhitePiece.position.copy(piece.position);
        gWhitePiece.scale.copy(piece.scale);
        gWhitePiece.visible = false;

        gBlackPiece.geometry.copy(piece.geometry);
        gBlackPiece.material = gMaterials.blackPieceMeshMaterial;
        // gBlackPiece.position.copy(piece.position);
        gBlackPiece.scale.copy(piece.scale);
        gBlackPiece.visible = false;

        gCursor.geometry.copy(piece.geometry);
        gCursor.material = gMaterials.cursorMeshMaterial;
        gCursor.scale.copy(piece.scale);
    }
}
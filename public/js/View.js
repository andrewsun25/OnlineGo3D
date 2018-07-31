function View() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    this.renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    this.orbitControls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    const USE_HELPERS = true;

    (function _init() {
        _initScene();
        _initCamera();
        _initRenderer();
        _initOrbitControls();
        _initLights();
        if (USE_HELPERS)
            initHelpers();
    })();

    function _initScene() {
        this.scene.background = new THREE.Color(0xcccccc);
        this.scene.fog = new THREE.FogExp2(0xcccccc, 0.002);
    }

    // Sets gCamera as a perspective camera and its position
    function _initCamera() {
        this.camera.position.set(0, 7, 0); // y==200, z==200
    }

    // Sets gRenderer, its pixel ratio, size, and appends it to the doc body
    function _initRenderer() {
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
    }

    // Sets gOrbitControls and its settings
    function _initOrbitControls() {
        this.orbitControls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        this.orbitControls.dampingFactor = 0.3;
        this.orbitControls.screenSpacePanning = true;
        this.orbitControls.minDistance = 1; // closest we can dolly in to origin. 
        this.orbitControls.maxDistance = 500; // furtherest out we can get
        this.orbitControls.maxPolarAngle = 2 * Math.PI; // angle by which we can deviate from y axis(in radians). Defines a cone.
    }

    // Adds ambient and directional lighting to this.scene
    function _initLights() {
        var dirLight = new THREE.DirectionalLight(WHITE_COLOR);
        dirLight.position.y = 20;
        this.scene.add(dirLight);

        var hemiLight = new THREE.HemisphereLight(LIGHT_YELLOW_COLOR, DARK_NAVY_COLOR, 0.5);
        this.scene.add(hemiLight);

        if (USE_HELPERS) {
            var dirHelper = new THREE.DirectionalLightHelper(dirLight, 5);
            this.scene.add(dirHelper);
            var hemiLight = new THREE.HemisphereLightHelper(hemiLight, 5);
            this.scene.add(hemiLight);
        }
    }

    // Adds a grid to gScene
    function _initHelpers() {
        var gridHelper = new THREE.GridHelper(10, 10, 0x0000ff, 0x808080);
        this.scene.add(gridHelper);
    }

    // Scene Objects that are modified

    this.sceneObjects = {
        boardGroup: new THREE.Group(),
        blackPiece: new THREE.Mesh(),
        whitePiece: new THREE.Mesh(),
        cursor: new THREE.Mesh(),
        gridHitBoxes: new THREE.Group(),
        visiblePieces: new THREE.Group()
    }
    for (let objKey in this.sceneObjects) {
        this.scene.add(this.sceneObjects[objKey]);
    }
    this.sceneObjects.boardGroup.name = "boardGroup";
    this.sceneObjects.blackPiece.name = "blackPiece";
    this.sceneObjects.whitePiece.name = "whitePiece";
    this.sceneObjects.cursor.name = "cursor";
    this.sceneObjects.gridHitBoxes.name = "gridHitBoxes";
    this.sceneObjects.visiblePieces.name = "visiblePieces";

    // Children of this.sceneObjects.boardGroup
    this.boardMesh;
    this.gridMesh;
    this.footMesh;
    this.materials = {
        boardMeshMaterial: new THREE.MeshPhongMaterial({
            color: WOOD_COLOR,
        }),
        gridMeshMaterial: new THREE.MeshBasicMaterial({
            color: WHITE_COLOR,
        }),
        hitBoxMeshMaterial: new THREE.MeshBasicMaterial({
            color: BLUE_COLOR,
        }),
        whitePieceMeshMaterial: new THREE.MeshPhongMaterial({
            color: WHITE_COLOR,
            shininess: 125
        }),
        blackPieceMeshMaterial: new THREE.MeshPhongMaterial({
            color: BLACK_COLOR,
            shininess: 250
        }),
        cursorMeshMaterial: new THREE.MeshPhysicalMaterial({
            map: null,
            color: LIGHT_TEAL_COLOR,
            opacity: 0.7,
            side: THREE.FrontSide,
            transparent: true,
        }),
    };

    const BOARD_SCALE = 10;
    var BOARD_HEIGHT;

    this.onBoardLoad = function(object) {

        // Get all children from loaded object into this scene's boardGroup.
        var boardGroup = this.sceneObjects.boardGroup;
        object.children.forEach(function(child) {
            boardGroup.add(child.clone()); // need to add the clone or else when child gets garbage collected bad stuff happens.
        });

        // Change names of boardGroup's children
        this.boardMesh = boardGroup.getObjectByName("Board_Cube");
        this.boardMesh.name = "boardMesh";
        this.gridMesh = boardGroup.getObjectByName("Grid_Grid.003");
        this.gridMesh.name = "gridMesh";
        this.footMesh = boardGroup.getObjectByName("Foot_Circle.003");
        this.footMesh.name = "footMesh";

        // Apply materials to all children
        boardGroup.traverse(function(child) {
            if (child.name == "gridMesh") child.material = this.materials.gridMeshMaterial;
            else child.material = this.materials.boardMeshMaterial;
        });

        // Scale the Board
        boardGroup.scale = boardGroup.scale.multiplyScalar(BOARD_SCALE);
        boardGroup.updateMatrixWorld();

        // Find the dimensions of the grid and board
        var gridBox = new THREE.Box3().setFromObject(this.gridMesh); // size: x: 4, y: 0, z: 4
        var boardBox = new THREE.Box3().setFromObject(this.boardMesh);
        BOARD_HEIGHT = boardBox.max.y + 0.01;

        // Add grid hit boxes
        var hitBoxGeometry = new THREE.BoxBufferGeometry(BOARD_SCALE / 50, BOARD_SCALE / 50, BOARD_SCALE / 50);
        for (var i = 0; i < 19; i++) {
            for (var j = 0; j < 19; j++) {
                var hitBox = new THREE.Mesh(hitBoxGeometry, this.materials.hitBoxMeshMaterial);
                hitBox.position.x = i * (gridBox.max.x - gridBox.min.x) / 18 + gridBox.min.x;
                hitBox.position.y = BOARD_HEIGHT;
                hitBox.position.z = j * (gridBox.max.z - gridBox.min.z) / 18 + gridBox.min.z;
                hitBox.layers.set(1);
                hitBox.name = i.toString() + "-" + j.toString();

                // updates the point if it is a starpoint
                // if ((i == 3 || i == 9 || i == 15) && (j == 3 || j == 9 || j == 15)) {
                //     point.scale = point.scale.multiplyScalar(1.5);
                //     point.name += "-StarPoint";
                // }
                this.gridHitBoxes.add(hitBox);
            }
        }
    }

    this.onPieceLoad = function(object) {
        var piece = object.children[0];
        piece.scale = piece.scale.multiplyScalar(BOARD_SCALE);
        piece.updateMatrixWorld();

        var whitePiece = this.sceneObjects.whitePiece;
        whitePiece.geometry.copy(piece.geometry);
        whitePiece.material = this.materials.whitePieceMeshMaterial;
        whitePiece.scale.copy(piece.scale);
        whitePiece.visible = false;

        var blackPiece = this.sceneObjects.blackPiece;
        blackPiece.geometry.copy(piece.geometry);
        blackPiece.material = this.materials.blackPieceMeshMaterial;
        blackPiece.scale.copy(piece.scale);
        blackPiece.visible = false;

        var cursor = this.sceneObjects.cursor;
        cursor.geometry.copy(piece.geometry);
        cursor.material = this.materials.cursorMeshMaterial;
        cursor.scale.copy(piece.scale);
    }
}
if (!Detector.webgl) Detector.addGetWebGLMessage();
// Globals
var gCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
var gScene = new THREE.Scene();
var gRenderer = new THREE.WebGLRenderer({
    antialias: true
});
var gOrbitControls = new THREE.OrbitControls(gCamera, gRenderer.domElement);
var gObjLoader = new THREE.OBJLoader();
gObjLoader.setPath('../res/models/');

// Objects
var gBoard, gBlackPiece, gWhitePiece;
var gGridPoints = new THREE.Group();
gGridPoints.name = "GridPoints";
gScene.add(gGridPoints);

const BOARD_SCALE = 10;
var BOARD_HEIGHT;

// Raycasting
var gRaycaster = new THREE.Raycaster();
var gMouse = new THREE.Vector2();

// Colors
const WOOD_COLOR = 0x876101;
const WHITE_COLOR = 0xffffff;
const BLACK_COLOR = 0x000000;
const LIGHT_YELLOW_COLOR = 0xffffbb;
const DARK_NAVY_COLOR = 0x022244;
const BLUE_COLOR = 0x0033ff;

const USE_HELPERS = true;

// Game Logic
var gGame = new Game();

// Kick it off
init();
animate();

// Sets gScene, background color, and fog
function initScene() {
    gScene.background = new THREE.Color(0xcccccc);
    gScene.fog = new THREE.FogExp2(0xcccccc, 0.002);
}

// Sets gRenderer, its pixel ratio, size, and appends it to the doc body
function initRenderer() {
    gRenderer.setPixelRatio(window.devicePixelRatio);
    gRenderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(gRenderer.domElement);
}

// Sets gCamera as a perspective camera and its position
function initCamera() {
    gCamera.position.set(0, 7, 0); // y==200, z==200
}

// Sets gOrbitControls and its settings
function initOrbitControls() {
    gOrbitControls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    gOrbitControls.dampingFactor = 0.3;
    gOrbitControls.screenSpacePanning = true;
    gOrbitControls.minDistance = 1; // closest we can dolly in to origin. 
    gOrbitControls.maxDistance = 500; // furtherest out we can get
    gOrbitControls.maxPolarAngle = 2 * Math.PI; // angle by which we can deviate from y axis(in radians). Defines a cone.
}

// Adds a grid to gScene
function initHelpers() {
    var gridHelper = new THREE.GridHelper(10, 10, 0x0000ff, 0x808080);
    gScene.add(gridHelper);
}

// Adds ambient and directional lighting to gScene
function initLights() {
    var dirLight = new THREE.DirectionalLight(WHITE_COLOR);
    dirLight.position.y = 20;
    gScene.add(dirLight);

    var hemiLight = new THREE.HemisphereLight(LIGHT_YELLOW_COLOR, DARK_NAVY_COLOR, 0.5);
    gScene.add(hemiLight);

    if (USE_HELPERS) {
        var dirHelper = new THREE.DirectionalLightHelper(dirLight, 5);
        gScene.add(dirHelper);
        var hemiLight = new THREE.HemisphereLightHelper(hemiLight, 5);
        gScene.add(hemiLight);
    }
}

function initEventListeners() {
    window.addEventListener('resize', onWindowResize, false); // false means event won't be executed in capturing phase
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('dblclick', onDblClick, false);
}

function initGame() {

}

function init() {

    initScene();
    initRenderer();
    initCamera();
    initLights();
    if (USE_HELPERS)
        initHelpers();

    initOrbitControls();

    initEventListeners();

    loadBoardAsync();

    initGame();
}

// Game stuff

function loadBoardAsync() {
    gObjLoader.load('board.obj', _onBoardLoad);

    function _onBoardLoad(object) {
        gBoard = object;
        gBoard.name = "BoardGroup";
        // Materials
        var boardMaterial = new THREE.MeshPhongMaterial({
            color: WOOD_COLOR,
        });
        var gridMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
        });

        // Change names of gBoard's children
        gBoard.getObjectByName("Grid_Grid.003").name = "Grid";
        gBoard.getObjectByName("Board_Cube").name = "Board";
        gBoard.getObjectByName("Foot_Circle.003").name = "Foot";

        // Apply materials to all children
        gBoard.traverse(function(child) {
            if (child.name == "Grid") child.material = gridMaterial;
            else child.material = boardMaterial;
        });

        // Scale the Board
        gBoard.scale = gBoard.scale.multiplyScalar(BOARD_SCALE);
        gBoard.updateMatrixWorld();
        gScene.add(gBoard);

        // Add nodes to grid
        var grid = gBoard.getObjectByName("Grid");
        var gridBox = new THREE.Box3().setFromObject(grid); // size: x: 4, y: 0, z: 4
        var board = gBoard.getObjectByName("Board");
        var boardBox = new THREE.Box3().setFromObject(board);
        BOARD_HEIGHT = boardBox.max.y + 0.01;
        __addGridPoints(gridBox);

        loadPiecesAsync();
    }

    function __addGridPoints(gridBox) {
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
                gGridPoints.add(point);
            }
        }
    }

}

function loadPiecesAsync() {
    gObjLoader.load('piece.obj', (object) => {
        var piece = object.children[0];
        piece.position.y = BOARD_HEIGHT + 0.01;
        piece.scale = piece.scale.multiplyScalar(BOARD_SCALE);

        gWhitePiece = piece;
        gScene.add(gWhitePiece);

        gBlackPiece = piece.clone();
        gScene.add(gBlackPiece);


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
    });
}

function updateGame() {}

function updateWorld() {
    gGridPoints.traverse(function(child) {
        child.layers.set(1);
    });
    if (typeof gBoard != "undefined") { // if the board has been loaded
        gRaycaster.setFromCamera(gMouse, gCamera);
        var intersects = gRaycaster.intersectObjects(gGridPoints.children);
        if (intersects.length > 0) {
            intersects[0].object.layers.set(0);
        }
    }
}

// Render Loop

function animate() {
    requestAnimationFrame(animate); // Asynchronously calls animate function when the next repaint can happen IE when call stack is clear. 
    gOrbitControls.update(); // only required if gOrbitControls.enableDamping = true, or if gOrbitControls.autoRotate = true
    // updateWorld();
    render();
}

function render() {
    gRenderer.render(gScene, gCamera);
}


// Doc event listeners

function onWindowResize() {
    gCamera.aspect = window.innerWidth / window.innerHeight; // update aspect ratio for perspective gCamera
    gCamera.updateProjectionMatrix(); // update the gCamera's internal proj matrix
    gRenderer.setSize(window.innerWidth, window.innerHeight); // resize gRenderer
}

function onMouseMove(event) {
    setMouse(event);
    // gGridPoints.traverse(function(child) {
    //     child.layers.set(1);
    // });
    if (typeof gBoard != "undefined") { // if the board has been loaded
        gRaycaster.setFromCamera(gMouse, gCamera);
        var intersects = gRaycaster.intersectObjects(gGridPoints.children);
        if (intersects.length > 0) {
            processHover(intersects[0]);
        }
    }
}

function onDblClick(event) {
    setMouse(event);
    if (typeof gBoard != "undefined") { // if the board has been loaded
        gRaycaster.setFromCamera(gMouse, gCamera);
        var intersects = gRaycaster.intersectObjects(gGridPoints.children);
        if (intersects.length > 0) {
            processClick(intersects[0]);
        }
    }
}

function processHover(intersected) {
    if (typeof gWhitePiece != "undefined") {
        gWhitePiece.position.copy(intersected.object.position);
    }
}

function processClick(intersected) {
    console.log(intersected.object.name);
    var clickedPoint = _parseName(intersected.object.name);
    console.log(clickedPoint);

    function _parseName(name) {
        var strArray = name.split("-");
        var i = parseInt(strArray[0]);
        var j = parseInt(strArray[1]);
        return {
            i: i,
            j: j
        }
    }
}

function setMouse(event) {
    gMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    gMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
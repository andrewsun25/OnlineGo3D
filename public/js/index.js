if (!Detector.webgl) Detector.addGetWebGLMessage();
// Globals
var gCamera, gOrbitControls, gScene, gRenderer;

// Objects
var gBoard;
const BOARD_SCALE = 10;

// Raycasting
var gRaycaster = new THREE.Raycaster();
var gMouse = new THREE.Vector2();

// Colors
const WOOD_COLOR = 0x876101;
const WHITE_COLOR = 0xffffff;
const LIGHT_YELLOW_COLOR = 0xffffbb;
const DARK_NAVY_COLOR = 0x022244;
const BLUE_COLOR = 0x0033ff;

const USE_HELPERS = true;

// Kick it off
init();
animate();

// Sets gScene, background color, and fog
function initScene() {
    gScene = new THREE.Scene();
    gScene.background = new THREE.Color(0xcccccc);
    gScene.fog = new THREE.FogExp2(0xcccccc, 0.002);
}

// Sets gRenderer, its pixel ratio, size, and appends it to the doc body
function initRenderer() {
    gRenderer = new THREE.WebGLRenderer({
        antialias: true
    });
    gRenderer.setPixelRatio(window.devicePixelRatio);
    gRenderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(gRenderer.domElement);
}

// Sets gCamera as a perspective camera and its position
function initCamera() {
    gCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    gCamera.position.set(0, 7, 0); // y==200, z==200
}

// Sets gOrbitControls and its settings
function initOrbitControls() {
    gOrbitControls = new THREE.OrbitControls(gCamera, gRenderer.domElement); // we are controlling the global gCamera and listening for orbit events from the canvas 
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

    addBoard();

}

// Game stuff
function addBoard() {
    var objLoader = new THREE.OBJLoader();
    objLoader.setPath('../res/models/');
    objLoader.load('board.obj', (object) => {
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
        _addGridPoints(gridBox, boardBox);


    });

    function _addGridPoints(gridBox, boardBox) {
        var sphereGeometry = new THREE.SphereBufferGeometry(BOARD_SCALE / 300, 8, 8);
        var basicMaterial = new THREE.MeshBasicMaterial({ color: BLUE_COLOR });
        var gridPoints = new THREE.Group(); // group of meshes
        gridPoints.name = "GridPoints";
        gScene.add(gridPoints);

        for (var i = 0; i < 19; i++) {
            for (var j = 0; j < 19; j++) {
                var gridPoint = new THREE.Mesh(sphereGeometry, basicMaterial);
                gridPoint.position.x = i * (gridBox.max.x - gridBox.min.x) / 18 + gridBox.min.x;
                gridPoint.position.y = boardBox.max.y;
                gridPoint.position.z = j * (gridBox.max.z - gridBox.min.z) / 18 + gridBox.min.z;
                gridPoint.visible = false;
                gridPoint.name = i.toString() + "-" + j.toString();
                _updatePointIfStarPoint();
                gridPoints.add(gridPoint);
            }
        }

        function _updatePointIfStarPoint() {
            if ((i == 3 || i == 9 || i == 15) && (j == 3 || j == 9 || j == 15)) {
                gridPoint.scale = gridPoint.scale.multiplyScalar(1.5);
                gridPoint.name += "-StarPoint";
            }
            // if(i == 3 && j == 3) {
            //     gridPoint.name = "ULStarPoint";
            //     gridPoint.scale = gridPoint.scale.multiplyScalar(1.5);
            //     gridPoint.visible = false;
            // }
            // else if(i == 9 && j == 3) {
            //     gridPoint.name = "UMStarPoint";
            //     gridPoint.scale = gridPoint.scale.multiplyScalar(1.5);
            //     gridPoint.visible = false;
            // }
            // else if(i == 15 && j == 3) {
            //     gridPoint.name = "URStarPoint";
            //     gridPoint.scale = gridPoint.scale.multiplyScalar(1.5);
            //     gridPoint.visible = false;
            // }
            // else if(i == 3 && j == 9) {
            //     gridPoint.name = "MLStarPoint";
            //     gridPoint.scale = gridPoint.scale.multiplyScalar(1.5);
            //     gridPoint.visible = false;
            // }
            // else if(i == 9 && j == 9) {
            //     gridPoint.name = "MMStarPoint";
            //     gridPoint.scale = gridPoint.scale.multiplyScalar(1.5);
            //     gridPoint.visible = false;
            // }
            // else if(i == 15 && j == 9) {
            //     gridPoint.name = "MRStarPoint";
            //     gridPoint.scale = gridPoint.scale.multiplyScalar(1.5);
            //     gridPoint.visible = false;
            // }
            // else if(i == 3 && j == 15) {
            //     gridPoint.name = "LLStarPoint";
            //     gridPoint.scale = gridPoint.scale.multiplyScalar(1.5);
            //     gridPoint.visible = false;
            // }
            // else if(i == 9 && j == 15) {
            //     gridPoint.name = "LMStarPoint";
            //     gridPoint.scale = gridPoint.scale.multiplyScalar(1.5);
            //     gridPoint.visible = false;
            // }
            // else if(i == 15 && j == 15) {
            //     gridPoint.name = "LRStarPoint";
            //     gridPoint.scale = gridPoint.scale.multiplyScalar(1.5);
            //     gridPoint.visible = false;
            // }
        }
    }
}

// Render Loop

function animate() {
    requestAnimationFrame(animate); // Asynchronously calls animate function when the next repaint can happen IE when call stack is clear. 
    gOrbitControls.update(); // only required if gOrbitControls.enableDamping = true, or if gOrbitControls.autoRotate = true
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
    gMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    gMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    gRaycaster.setFromCamera(gMouse, gCamera);
    if (gBoard) { // if the board has been loaded
        var gridPoints = gScene.getObjectByName("GridPoints");
        var intersects = gRaycaster.intersectObjects(gridPoints.children);
        if (intersects.length > 0) {
            intersects.forEach(function(intersect) {
                intersect.object.visible = true;
            });
        }
    }

}
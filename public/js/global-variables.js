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
var gBoardGroup = new THREE.Group(); // contains foot, actual board, and grid meshs
gBoardGroup.name = "BoardGroup";
gScene.add(gBoardGroup);

var gBlackPiece = new THREE.Mesh(); // mesh and material for a black piece
gBlackPiece.name = "BlackPiece";
gBlackPiece.visible = false;
gScene.add(gBlackPiece);

var gWhitePiece = new THREE.Mesh(); // mesh and material for a white piece
gWhitePiece.name = "WhitePiece";
gWhitePiece.visible = false;
gScene.add(gWhitePiece);

var gCursor = new THREE.Mesh();
gCursor.name = "Cursor";
gScene.add(gCursor);

var gGridHitBoxes = new THREE.Group(); // hit boxes for each point
gGridHitBoxes.name = "GridHitBoxes";
gScene.add(gGridHitBoxes);

var gPieces = new THREE.Group(); // current pieces on the baord
gPieces.name = "Pieces"
gScene.add(gPieces);

const BOARD_SCALE = 10;
var BOARD_HEIGHT;

// Raycasting
var gRaycaster = new THREE.Raycaster();
var gMouse = new THREE.Vector2();

// Settings
const USE_HELPERS = true;

// Game Logic
var gGame = new Game();
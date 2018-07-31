// View
var gCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
var gScene = new THREE.Scene();
var gRenderer = new THREE.WebGLRenderer({
    antialias: true
});
var gOrbitControls = new THREE.OrbitControls(gCamera, gRenderer.domElement);

// Settings
const USE_HELPERS = true;

// Raycasting
var gRaycaster = new THREE.Raycaster();
var gMouse = new THREE.Vector2();

// Objects
const BOARD_SCALE = 10;

var gObjLoader = new THREE.OBJLoader();
gObjLoader.setPath('../res/models/');

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

var gMaterials = {
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

// Game Logic
var gGame = new Game();
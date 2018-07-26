if (!Detector.webgl) Detector.addGetWebGLMessage();
// Globals
var gCamera, gOrbitControls, gScene, gRenderer;

// Objects
var gBoard; // Room meshes

// Raycasting
var gRaycaster = new THREE.Raycaster();
var gMouse = new THREE.Vector2();

// Settings
var gParams = { // Maps the values of the GUI gParams to our variables
    NUM_FLOORS: 8,
    MEAN_VERTS_PERFLOOR: 9,
    MEAN_FLOOR_HEIGHT: 10,
    MEAN_FLOOR_SIZE: 20
};

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
    gCamera.position.set(50, 100, 50); // y==200, z==200
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
    var gridHelper = new THREE.GridHelper(100, 100, 0x0000ff, 0x808080);
    gScene.add(gridHelper);
    var axesHelper = new THREE.AxesHelper(5);
    gScene.add(axesHelper);
}

// Adds ambient and directional lighting to gScene
function initLights() {
    var light = new THREE.DirectionalLight(0x002288);
    light.position.y = 20;
    var lightHelper = new THREE.DirectionalLightHelper(light, 5);
    gScene.add(lightHelper);
    var light = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
    var lightHelper = new THREE.HemisphereLightHelper(light, 5);
    gScene.add(lightHelper);
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
    initHelpers();

    initOrbitControls();

    initEventListeners();

    var objLoader = new THREE.OBJLoader();
    objLoader.setPath('../res/models/');
    objLoader.load('board.obj', (object) => {
        gBoard = object;
        object.scale = object.scale.multiplyScalar(10);
        gScene.add(object);
    });
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
    // update the picking ray with the gCamera and gMouse position
}

// function onDocumentKeyDown(event) {
//     // update the picking ray with the gCamera and gMouse position

//     var intersects = gRaycaster.intersectObjects(gScene.children);
//     var keyCode = event.which;
//     // Toggle rotation bool for meshes that we clicked
//     if (keyCode == 68) {
//         if (intersects.length > 0) {
//             console.log("asds");
//             intersects.forEach(function(intersect) {
//                 if (intersect.object.type == 'Mesh') {
//                     intersect.object.rotateY(Math.PI / 3);

//                 }
//             });
//         }
//     }
// }
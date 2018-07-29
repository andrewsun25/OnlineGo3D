if (!Detector.webgl) Detector.addGetWebGLMessage();

// Kick it off

init();
animate();

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

// Init

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
}

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

// Window event listeners

function onWindowResize() {
    gCamera.aspect = window.innerWidth / window.innerHeight; // update aspect ratio for perspective gCamera
    gCamera.updateProjectionMatrix(); // update the gCamera's internal proj matrix
    gRenderer.setSize(window.innerWidth, window.innerHeight); // resize gRenderer
}

function onMouseMove(event) {
    setMouse(event.clientX, event.clientY);
    // gGridHitBoxes.traverse(function(child) {
    //     child.layers.set(1);
    // });
    if (typeof gBoardGroup != "undefined") { // if the board has been loaded
        gRaycaster.setFromCamera(gMouse, gCamera);
        var intersects = gRaycaster.intersectObjects(gGridHitBoxes.children);
        if (intersects.length > 0) {
            handleHover(intersects[0]);
        }
    }
}

function onDblClick(event) {
    setMouse(event.clientX, event.clientY);
    if (typeof gBoardGroup != "undefined") { // if the board has been loaded
        gRaycaster.setFromCamera(gMouse, gCamera);
        var intersects = gRaycaster.intersectObjects(gGridHitBoxes.children);
        if (intersects.length > 0) {
            handleDblClick(intersects[0]);
        }
    }
}

// Window Event Handlers

function handleHover(intersected) {
    if (typeof gWhitePiece != "undefined") {
        gCursor.position.copy(intersected.object.position);
    }
}

function handleDblClick(intersected) {
    var clickedPoint = parseNameToPoint(intersected.object.name);
    gGame.processMove(clickedPoint.i, clickedPoint.j);
}

// Event Bus communicates ebtween scene and game
/*
    @event: {
        type: Name of event
        target: object that dispatched event
    }
    @args: Object with user defined arguments
*/
EventBus.addEventListener('pointAddedEvent', (event, args) => {
    console.log(event);
    console.log(args);
    var newPiece;
    args.player == Game.WHITE ? newPiece = gWhitePiece.clone() : newPiece = gBlackPiece.clone();
    newPiece.visible = true;
    var gridHitBox = gGridHitBoxes.getObjectByName(parsePointToName(args.point));
    newPiece.position.copy(gridHitBox.position);
    gPieces.add(newPiece);
});

EventBus.addEventListener('pointTakenEvent', (event, args) => {
    console.log("POINT TAKEN");
});

// Helpers

function setMouse(clientX, clientY) {
    gMouse.x = (clientX / window.innerWidth) * 2 - 1;
    gMouse.y = -(clientY / window.innerHeight) * 2 + 1;
}

function parseNameToPoint(name) {
    var strArray = name.split("-");
    var i = parseInt(strArray[0]);
    var j = parseInt(strArray[1]);
    return {
        i: i,
        j: j
    }
}

function parsePointToName(point) {
    var str = "";
    str += point.i;
    str += "-";
    str += point.j;
    return str;
}
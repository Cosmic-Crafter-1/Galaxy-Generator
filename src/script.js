import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'

/**
 * Base
 */
// Debug
const gui = new GUI({
    width: 400
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()


// Textures
// const textureLoader = new THREE.TextureLoader()
// const sunTexture = textureLoader.load('./textures/sun-yellow.jpg')
// sunTexture.colorSpace = THREE.SRGBColorSpace


/**
 * Galaxy
 */

const parameters = {}

// Galaxy
parameters.count = 100000
parameters.size = 0.01
parameters.radius = 5
parameters.branches = 5
parameters.spin = 1
parameters.randomness = 0.15
parameters.randomnessPower = 5
parameters.insideColor = '#fa7000'
parameters.outsideColor = '#1b3984'

// Galaxy's Burst/jets
parameters.burstRadius = 6
parameters.burstHeight = 10
parameters.burstParticlesCount = 35000
parameters.burstInsideColor = '#fa7000'
parameters.burstOutsideColor = '#1b3984'
parameters.burstRandomnessPower = 5
parameters.burstSpreadFactor = 0.1

// Galaxy's Core
parameters.coreColor = '#f8d4c9';
parameters.coreSize = 0.01;
parameters.coreParticles = 8000;


let geometry = null
let material = null
let points = null

const generateGalaxy = () => {

    /**
     * Destroy old galaxy
     */

    // .dispose() --Disposes from memory, but doesn't remove from memory
    // .remove() -- use this to remove the points from the scene
    if (points != null) {
        geometry.dispose()
        material.dispose()
        scene.remove(points)
    }


    /**
     * Geometry
     */

    geometry = new THREE.BufferGeometry()

    // x,y,z for each particle
    const totalNumberOfArrayElements = parameters.count * 3

    const positionsArray = new Float32Array(totalNumberOfArrayElements)
    const colorsArray = new Float32Array(totalNumberOfArrayElements)

    const positionsAttribute = new THREE.BufferAttribute(positionsArray, 3)
    const colorsAttribute = new THREE.BufferAttribute(colorsArray, 3)

    const colorInside = new THREE.Color(parameters.insideColor)
    const colorOutside = new THREE.Color(parameters.outsideColor)

    // We need to handle each coordinates later, so do it like this.
    for (let i = 0; i < parameters.count; i++) {

        const i3 = i * 3

        /**
         * Position
         */
        const radius = Math.random() * parameters.radius

        // See the notes explanation and Bruno's video at 35:00 for more clarification.
        // We use the modulo (%) to get the remainder as 0,1,2  0,1,2  0,1,2
        // Then we divide it by branches again, so as to not get whole numbers, majorly [1] because it would lead to inaccurate angle.
        const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2
        const spinAngle = radius * parameters.spin

        // Ok so before the * we use the Math.pow() to keep lesser values even lesser, like close to 0
        // But after * we just use a random value TO DECIDE if the current VALUE will be positive or negative.
        // Eg; I did the first half and I always got a positive value (Because using Math.pow with negative gives weird results)
        // Now, I can't always have positive values, I also need negative values so that points spread evenly, therefore, I simply get a random value, and see if it's below 0.5 ? Then it's going to be positive, else negative.
        // Therefore, the less randomnessPower, the more closer they are to the branch.
        // More randomnessPower means, more spread out.
        const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius
        // Remove the Math.pow and you get 2 galaxies...
        const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius
        const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius

        positionsArray[i3 + 0] = Math.cos(branchAngle + spinAngle) * radius + randomX
        positionsArray[i3 + 1] = 0 + randomY
        positionsArray[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ


        /**
         * Colors
         */

        // Cloning because I don't want to change the original 'colorInside' variable when it lerps, the base color.
        const mixedColor = colorInside.clone()
        mixedColor.lerp(colorOutside, radius / parameters.radius)

        colorsArray[i3 + 0] = mixedColor.r
        colorsArray[i3 + 1] = mixedColor.g
        colorsArray[i3 + 2] = mixedColor.b
    }

    geometry.setAttribute('position', positionsAttribute)
    geometry.setAttribute('color', colorsAttribute)

    /**
     * Material
     */
    material = new THREE.PointsMaterial({
        size: parameters.size,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    })

    points = new THREE.Points(geometry, material)
    scene.add(points)
}


let burstGeometry = null
let burstMaterial = null
let burstPoints = null

const generateBurst = () => {
    /**
     * Destroy old burst
     */
    if (burstPoints != null) {
        burstGeometry.dispose();
        burstMaterial.dispose();
        scene.remove(burstPoints);
    }

    burstGeometry = new THREE.BufferGeometry();

    // Set a reasonable number of burst particles for performance
    const burstParticles = parameters.burstParticlesCount;
    const positions = new Float32Array(burstParticles * 3);
    const colors = new Float32Array(burstParticles * 3);

    for (let i = 0; i < burstParticles * 3; i++) {
        const i3 = i * 3;

        // Ensure symmetrical burst along Y-axis
        const heightFactor = Math.random() * parameters.burstHeight;
        const yDirection = Math.random() < 0.5 ? 1 : -1;

        // Control spread and ensure it resembles a beam
        const spreadFactor = parameters.burstRadius * parameters.burstSpreadFactor
        const randomX = Math.pow(Math.random(), parameters.burstRandomnessPower) * (Math.random() < 0.5 ? 1 : -1) * spreadFactor
        const randomZ = Math.pow(Math.random(), parameters.burstRandomnessPower) * (Math.random() < 0.5 ? 1 : -1) * spreadFactor


        positions[i3 + 0] = randomX;
        positions[i3 + 1] = heightFactor * yDirection;
        positions[i3 + 2] = randomZ;

        // Create color gradient from the base
        const burstColorInside = new THREE.Color(parameters.burstInsideColor);
        const burstColorOutside = new THREE.Color(parameters.burstOutsideColor);
        const mixedColor = burstColorInside.clone();
        mixedColor.lerp(burstColorOutside, heightFactor / parameters.burstHeight);

        colors[i3 + 0] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;
    }

    burstGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    burstGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    burstMaterial = new THREE.PointsMaterial({
        size: parameters.size * 0.2,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
    });

    burstPoints = new THREE.Points(burstGeometry, burstMaterial);
    scene.add(burstPoints);
};

const generateGalaxyCore = () => {
    const points = parameters.coreParticles;
    const totalNumberOfArrayElements = points * 3;
    const positionsArray = new Float32Array(totalNumberOfArrayElements);

    for (let i = 0; i < points; i++) {
        const radius = Math.random();
        const theta = Math.random() * Math.PI * 2; // Longitude
        const phi = Math.acos(2 * Math.random() - 1); // Latitude

        // Convert spherical coordinates to Cartesian
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        const index = i * 3;
        positionsArray[index] = x;
        positionsArray[index + 1] = y;
        positionsArray[index + 2] = z;
    }

    const positionsAttribute = new THREE.BufferAttribute(positionsArray, 3);

    const coreGeometry = new THREE.BufferGeometry();
    coreGeometry.setAttribute('position', positionsAttribute);

    const coreMaterial = new THREE.PointsMaterial({
        size: parameters.coreSize,
        sizeAttenuation: true,
        color: parameters.coreColor,
        transparent: true,
        opacity: 1.0,
    });

    // Destroy old core
    if (scene.getObjectByName('galaxyCore')) {
        scene.remove(scene.getObjectByName('galaxyCore'));
    }

    // Create the Points object
    const core = new THREE.Points(coreGeometry, coreMaterial);
    core.name = 'galaxyCore';

    // Scale down the entire core
    const scaleFactor = 0.9; // Adjust this value (e.g., 0.5 to reduce size by half)
    core.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Add the points to the scene
    scene.add(core);
};

// Generate everything
generateGalaxy()
generateBurst()
generateGalaxyCore()


// Create folders for better organization
const galaxyFolder = gui.addFolder('Galaxy')
const burstFolder = gui.addFolder('Burst')
const coreFolder = gui.addFolder('Core')

// Galaxy Folder
galaxyFolder.add(parameters, 'count').min(100).max(100000).step(100).onFinishChange(generateGalaxy)
galaxyFolder.add(parameters, 'size').min(0.001).max(0.1).step(0.001).onFinishChange(generateGalaxy)
galaxyFolder.add(parameters, 'radius').min(0.01).max(20).step(0.01).onFinishChange(generateGalaxy)
galaxyFolder.add(parameters, 'branches').min(3).max(20).step(1).onFinishChange(generateGalaxy)
galaxyFolder.add(parameters, 'spin').min(-5).max(5).step(0.001).onFinishChange(generateGalaxy)
galaxyFolder.add(parameters, 'randomness').min(0).max(2).step(0.01).onFinishChange(generateGalaxy)
galaxyFolder.add(parameters, 'randomnessPower').min(1).max(10).step(0.001).onFinishChange(generateGalaxy)
galaxyFolder.addColor(parameters, 'insideColor').onFinishChange(generateGalaxy)
galaxyFolder.addColor(parameters, 'outsideColor').onFinishChange(generateGalaxy)

// Burst Folder
burstFolder.add(parameters, 'burstParticlesCount').min(100).max(100000).step(100).onFinishChange(generateBurst)
burstFolder.add(parameters, 'burstRadius').min(1).max(30).step(1).onFinishChange(generateBurst)
burstFolder.add(parameters, 'burstHeight').min(1).max(30).step(1).onFinishChange(generateBurst)
burstFolder.add(parameters, 'burstSpreadFactor').min(0).max(1).step(0.01).onFinishChange(generateBurst)
burstFolder.add(parameters, 'burstRandomnessPower').min(1).max(10).step(0.1).onFinishChange(generateBurst)
burstFolder.addColor(parameters, 'burstInsideColor').onFinishChange(generateBurst)
burstFolder.addColor(parameters, 'burstOutsideColor').onFinishChange(generateBurst)

// Core Folder
coreFolder.add(parameters, 'coreSize').min(0.001).max(0.1).step(0.001).onFinishChange(generateGalaxyCore)
coreFolder.add(parameters, 'coreParticles').min(100).max(20000).step(100).onFinishChange(generateGalaxyCore)
coreFolder.addColor(parameters, 'coreColor').onFinishChange(generateGalaxyCore)

// Close all folders by default
galaxyFolder.close()
burstFolder.close()
coreFolder.close()

// Optionally, open the main folder by default if you'd like to
// gui.open() // Uncomment to open the main GUI by default



/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = -2
camera.position.y = 3
camera.position.z = 7
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Rotate the galaxy
    if (points) {
        points.rotation.y = - elapsedTime * 0.1
    }

    // Rotate the jets
    if (burstPoints) {
        burstPoints.rotation.y = - elapsedTime * 0.2
    }


    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
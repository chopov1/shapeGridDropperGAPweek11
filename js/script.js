//use ctrl c to stop the program running and gain control of the console
//ThreeJS is a Y-up platform
//use f12 on website to debug
//use "npm init -y" to create package.json
//use "npm i parcel" to create node-modules - use "npm i parcel@2.7.0" if you get version error
//use "npm install three" to install threejs library
//use "npm install cannon-es" to install cannon library
//to run type "parcel ./src/index.html"

import * as THREE from "three";
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import * as CANNON from 'cannon-es';
import { Mesh, MeshStandardMaterial, Vector2, Vector3 } from "three";

const renderer = new THREE.WebGL1Renderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1,1000);
camera.position.set(10,15,-22);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.update();
scene.add(camera);

const light = new THREE.DirectionalLight( 0xFFFFFF );
light.castShadow = true;
scene.add(light);

const ambLight = new THREE.AmbientLight(0x404040);
scene.add(ambLight);

const axisHelper = new THREE.AxesHelper(20);
scene.add(axisHelper);

const world = new CANNON.World({
    gravity : new CANNON.Vec3(0,-10,0)
});


//--------- CREATE PLANES ---------

const groundGeo = new THREE.PlaneGeometry(20,20);
const groundMat = new MeshStandardMaterial({color: 0xeeeeee, side: THREE.DoubleSide});
const ground = new Mesh(groundGeo, groundMat);
ground.visible = false;
ground.rotateX(-Math.PI/2);
ground.name = "ground";
scene.add(ground);
const grid = new THREE.GridHelper(20, 20);
scene.add(grid);
const planeGeo = new THREE.PlaneGeometry(1,1);
const planeMat = new THREE.MeshStandardMaterial({color:0xeeeeee, side: THREE.DoubleSide});
const planeSmall = new Mesh(planeGeo, planeMat);
planeSmall.position.setX(.5);
planeSmall.position.setZ(.5);
planeSmall.rotateX(Math.PI/2);
scene.add(planeSmall);

const groundPhyMat = new CANNON.Material();
const objPhyMat = new CANNON.Material();

const groundBody = new CANNON.Body({
    shape: new CANNON.Plane(),
    type: CANNON.Body.STATIC,
    material: groundPhyMat
});
groundBody.quaternion.setFromEuler(-Math.PI/2,0,0);
world.addBody(groundBody);

const contactMat = new CANNON.ContactMaterial(
    groundPhyMat,
    objPhyMat,
    {restitution: .7}
);
world.addContactMaterial(contactMat);

//------------ CREATE SPAWNABLE OBJECTS ---------

const torusGeo = new THREE.TorusGeometry(.2, .5, 20);
const torusMat = new THREE.MeshStandardMaterial({color:0xeeffaa});
const torusMesh = new THREE.Mesh(torusGeo, torusMat);

const boxGeo = new THREE.BoxGeometry(1,1,1);
const boxMat = new THREE.MeshStandardMaterial({color:0x111111});
const boxMesh = new THREE.Mesh(boxGeo, boxMat);

const sphereGeo = new THREE.SphereGeometry(.5,20);
const sphereMat = new THREE.MeshStandardMaterial({color:0xbbccbb});
const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);

const doGeo = new THREE.DodecahedronGeometry(.6, 0);
const doMat = new THREE.MeshStandardMaterial({color:0xbbccee});
const doMesh = new THREE.Mesh(doGeo, doMat);

const coneGeo = new THREE.ConeGeometry(.5, 1);
const coneMat = new MeshStandardMaterial({color:0xeebbee});
const coneMesh = new THREE.Mesh(coneGeo, coneMat);

//--------- MOUSE MOVE -------------
const mousepos = new THREE.Vector2;
const raycaster = new THREE.Raycaster();
let intersects;

window.addEventListener('mousemove', function(e){

    mousepos.x = (e.clientX / window.innerWidth) * 2 -1;
    mousepos.y = (e.clientY/ window.innerHeight) * 2 -1;

    raycaster.setFromCamera(mousepos, camera);
    intersects = raycaster.intersectObjects(scene.children);

    intersects.forEach(function(intersect){
        if(intersect.object.name === 'ground'){
            const highlightPos = new THREE.Vector3().copy(intersect.point).floor().addScalar(0.5);
            planeSmall.position.set(highlightPos.x, 0, highlightPos.z);

            const exists = objects.find(function(object){
                return ((object.position.x === planeSmall.position.x) && (object.position.z === planeSmall.position.z));
            });
            if(!exists){
                planeSmall.material.color.setHex(0xffffff);
            }
            else{
                planeSmall.material.color.setHex(0xffbbdd);
            }
            
        }
    });
    const exists = objects.find(function(object){

        return ((object.position.x === planeSmall.position.x) && (object.position.z === planeSmall.position.z));
    });
    if(!exists){
        planeSmall.material.color.setHex(0xffffff);
    }
    else{
        planeSmall.material.color.setHex(0xffbbdd);
    }
});

const spawnableObjs = [torusMesh, boxMesh, sphereMesh, doMesh, coneMesh];
const objects = [];
const objectBodies = [];
window.addEventListener('mousedown', function(e){

    var index = Math.floor(Math.random() * spawnableObjs.length);
    const exists = objects.find(function(object){
        return ((object.position.x === planeSmall.position.x) && (object.position.z === planeSmall.position.z));
    });
    if(!exists){
        intersects.forEach(function(intersect){
            if(intersect.object.name === 'ground'){
                const objToSpawn = spawnableObjs[index].clone();
                const objBody = new CANNON.Body({
                    shape: new CANNON.Sphere(.5),
                    mass: 1,
                    material: objPhyMat
                });
            objToSpawn.material.color.setHex(Math.random(0, 1) * 0xaaaaaa);
            objToSpawn.rotateX((Math.floor(Math.random() * 360)));
            objToSpawn.rotateZ((Math.floor(Math.random() * 360)));
            objToSpawn.position.copy(planeSmall.position);
            objToSpawn.position.setY(Math.floor(Math.random() * 9) + 1);
            objBody.position.copy(objToSpawn.position);
            objBody.quaternion.copy(objToSpawn.quaternion);
            scene.add(objToSpawn);
            world.addBody(objBody);
            objects.push(objToSpawn);
            objectBodies.push(objBody);
            }
        });
    }
    if(!exists){
        planeSmall.material.color.setHex(0xffffff);
    }
    else{
        planeSmall.material.color.setHex(0xaaaaaa);
    }
    
    console.log(index);
    console.log(spawnableObjs.length);
});

const timestep = 1/60;

function animate(){
    world.step(timestep);

    ground.position.copy(groundBody.position);
    ground.quaternion.copy(groundBody.quaternion);

    for (let index = 0; index < objects.length; index++) {
        objects[index].position.copy(objectBodies[index].position);
        objects[index].quaternion.copy(objectBodies[index].quaternion);
    }

    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

window.addEventListener('resize', function (){
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
})
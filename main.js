import * as THREE from 'https://cdn.skypack.dev/three@0.142.0';
import { EffectComposer } from 'https://unpkg.com/three@0.142.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.142.0/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://unpkg.com/three@0.142.0/examples/jsm/postprocessing/ShaderPass.js';
import { SMAAPass } from 'https://unpkg.com/three@0.142.0/examples/jsm/postprocessing/SMAAPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.142.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutlinePass } from 'https://unpkg.com/three@0.142.0/examples/jsm/postprocessing/OutlinePass.js';
import { GammaCorrectionShader } from 'https://unpkg.com/three@0.142.0/examples/jsm/shaders/GammaCorrectionShader.js';
import {
    RoundedBoxGeometry
} from 'https://unpkg.com/three@0.142.0/examples/jsm/geometries/RoundedBoxGeometry.js';
import { OrbitControls } from 'https://unpkg.com/three@0.142.0/examples/jsm/controls/OrbitControls.js';
import { EffectShader } from "./EffectShader.js";
import { EffectCompositer } from "./EffectCompositer.js";
import { Stats } from "./stats.js";
import { AssetManager } from './AssetManager.js';
import { CSS2DRenderer, CSS2DObject } from 'https://unpkg.com/three@0.142.0/examples/jsm/renderers/CSS2DRenderer.js';
window.onload = () => {
    function angleDifference(angle1, angle2) {
        const diff = ((angle2 - angle1 + Math.PI) % (Math.PI * 2)) - Math.PI;
        return (diff < -Math.PI) ? diff + (Math.PI * 2) : diff;
    }
    async function main() {
        // Setup basic renderer, controls, and profiler
        const clientWidth = window.innerWidth;
        const clientHeight = clientWidth * (1 / 1.9699042407660738);
        console.log(clientWidth, clientHeight);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(30, clientWidth / clientHeight, 0.1, 1000);
        camera.position.set(0, 116, 26.5);
        camera.lookAt(0, 0, 26.5);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(clientWidth, clientHeight);
        document.body.appendChild(renderer.domElement);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.VSMShadowMap;
        const labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize(clientWidth, clientHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0px';
        document.body.appendChild(labelRenderer.domElement);
        const stats = new Stats();
        stats.showPanel(0);
        document.body.appendChild(stats.dom);
        // Setup scene
        // Skybox
        const environment =
            /*new THREE.CubeTextureLoader().load([
                   "skybox/Box_Right.bmp",
                   "skybox/Box_Left.bmp",
                   "skybox/Box_Top.bmp",
                   "skybox/Box_Bottom.bmp",
                   "skybox/Box_Front.bmp",
                   "skybox/Box_Back.bmp"
               ]);*/
            await AssetManager.loadTextureAsync("building.jpeg");
        environment.encoding = THREE.sRGBEncoding;
        environment.mapping = THREE.EquirectangularReflectionMapping;
        const bgeometry = new THREE.SphereGeometry(500, 60, 40);
        // invert the geometry on the x-axis so that all of the faces point inward
        bgeometry.scale(-1, 1, 1);

        const bmaterial = new THREE.MeshBasicMaterial({ map: environment });

        const bmesh = new THREE.Mesh(bgeometry, bmaterial);
        //bmesh.rotation.x = Math.PI / 2;
        bmesh.rotation.y = -Math.PI / 8;
        bmesh.rotation.x = -Math.PI / 15;
        scene.add(bmesh);
        scene.background = environment;
        // Lighting
        const ambientLight = new THREE.AmbientLight(new THREE.Color(1.0, 1.0, 1.0), 0.15);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.45);
        directionalLight.position.set(150, 200, 50);
        // Shadows
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.left = -75;
        directionalLight.shadow.camera.right = 75;
        directionalLight.shadow.camera.top = 75;
        directionalLight.shadow.camera.bottom = -75;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.bias = -0.001;
        directionalLight.shadow.blurSamples = 8;
        directionalLight.shadow.radius = 4;
        scene.add(directionalLight);
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.15);
        directionalLight2.color.setRGB(1.0, 1.0, 1.0);
        directionalLight2.position.set(-50, 200, -150);
        //scene.add(directionalLight2);
        // Objects
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100).applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2)), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide }));
        ground.castShadow = true;
        ground.receiveShadow = true;
        //scene.add(ground);
        const desk = await AssetManager.loadGLTFAsync("desk/scene.gltf");
        desk.scene.traverse(mesh => {
            if (mesh.material) {
                mesh.material.envMap = environment;
                mesh.material.dithering = true;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
            }
        });
        desk.scene.castShadow = true;
        desk.scene.receiveShadow = true;
        desk.scene.scale.set(50, 50, 50);
        desk.scene.position.x = -53.75;
        scene.add(desk.scene);
        const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
        //buttonBase.add(button);
        const edge1 = new THREE.Mesh(new THREE.CapsuleGeometry(1, 100, 20, 20), new THREE.MeshStandardMaterial({ metalness: 1.0, envMap: cubeRenderTarget.texture, dithering: true, roughness: 0.25 }));
        edge1.position.y = 30.5;
        edge1.position.z = 15;
        edge1.position.x = -30;
        edge1.rotation.z = Math.PI / 2;
        edge1.castShadow = true;
        edge1.receiveShadow = true;
        scene.add(edge1);
        const edge2 = edge1.clone();
        edge2.position.z = 5;
        scene.add(edge2);
        const edge3 = edge1.clone();
        edge3.position.x = 20;
        edge3.rotation.y = Math.PI / 2;
        edge3.position.z -= 5;
        edge3.scale.y = 0.1;
        scene.add(edge3);
        const conveyorTex = await AssetManager.loadTextureAsync("conveyor.jpeg");
        conveyorTex.rotation = Math.PI / 2;
        conveyorTex.wrapS = THREE.RepeatWrapping;
        conveyorTex.wrapT = THREE.RepeatWrapping;
        conveyorTex.repeat.set(1, 10);
        const conveyor = new THREE.Mesh(new THREE.PlaneGeometry(80, 10, 1, 1), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, map: conveyorTex, envMap: cubeRenderTarget.texture }));
        conveyor.position.y = 30;
        conveyor.position.z = 10;
        conveyor.position.x = -20;
        conveyor.rotation.x = Math.PI / 2;
        conveyor.receiveShadow = true;
        scene.add(conveyor);
        const straw = await AssetManager.loadTextureAsync("straw.jpeg");
        straw.wrapS = THREE.RepeatWrapping;
        straw.wrapT = THREE.RepeatWrapping;
        straw.repeat.set(0.25, 0.25);
        const stake1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.33, 30, 20, 20), new THREE.MeshStandardMaterial({ map: straw, envMap: cubeRenderTarget.texture }));
        stake1.position.y = 35;
        stake1.position.z = 37.5;
        stake1.position.x = -30;
        stake1.rotation.x = Math.PI / 2;
        scene.add(stake1);
        const counter1 = (await AssetManager.loadGLTFAsync("counter.glb")).scene;
        counter1.rotation.y = Math.PI;
        counter1.rotation.x = Math.PI / 3 + 0.175;
        counter1.position.y = 25.75;
        counter1.position.z = 42.5;
        counter1.position.x = -25.5;
        counter1.children[0].rotation.x = Math.PI;
        counter1.children[1].rotation.x = Math.PI;
        counter1.receiveShadow = true;
        counter1.castShadow = true;
        counter1.scale.set(5, 5, 5);
        scene.add(counter1);
        const counter2 = counter1.clone();
        counter2.position.x = 1;
        scene.add(counter2);
        const counter3 = counter1.clone();
        counter3.position.x = 27.5;
        scene.add(counter3);
        const status1 = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 1, 32), new THREE.MeshStandardMaterial({ color: new THREE.Color(1.0, 0.0, 0.0), emissive: new THREE.Color(10.0, 0.0, 0.0), envMap: cubeRenderTarget.texture }));
        status1.position.y = 30;
        status1.position.z = 42.5;
        status1.position.x = -36.5;
        status1.add(new THREE.PointLight(0xff0000, 1, 37.5));
        scene.add(status1);
        const status2 = status1.clone();
        status2.material = status2.material.clone();
        status2.position.x = -10;
        scene.add(status2);
        const status3 = status1.clone();
        status3.material = status3.material.clone();
        status3.position.x = 16;
        scene.add(status3);
        const stake2 = stake1.clone();
        stake2.position.x = -5;
        scene.add(stake2);
        const stake3 = stake1.clone();
        stake3.position.x = 20;
        scene.add(stake3);
        stake1.castShadow = true;
        stake2.castShadow = true;
        stake3.castShadow = true;
        stake1.dice = [];
        stake2.dice = [];
        stake3.dice = [];
        stake1.counter = counter1;
        stake2.counter = counter2;
        stake3.counter = counter3;
        stake1.status = status1;
        stake2.status = status2;
        stake3.status = status3;
        const wood = await AssetManager.loadTextureAsync("wood.jpeg");
        wood.encoding = THREE.sRGBEncoding;
        const orderTable = new THREE.Mesh(new RoundedBoxGeometry(20, 5, 30, 2, 1), new THREE.MeshStandardMaterial({ map: wood, envMap: cubeRenderTarget.texture }));
        orderTable.position.y = 35;
        orderTable.position.z = 19;
        orderTable.position.x = 36.5;
        scene.add(orderTable);
        const customerMeter = new THREE.Mesh(new RoundedBoxGeometry(2, 1, 25, 2, 1), new THREE.MeshStandardMaterial({ color: new THREE.Color(0.025, 0.025, 0.025), envMap: cubeRenderTarget.texture }));
        customerMeter.position.y = 38;
        customerMeter.position.z = 19;
        customerMeter.position.x = 28;
        scene.add(customerMeter);
        const customerMeterFiller = new THREE.Mesh(new RoundedBoxGeometry(2, 1, 25, 2, 1).translate(0, 0, -12.5), new THREE.MeshStandardMaterial({
            color: new THREE.Color(0.5, 0.5, 0.5),
            envMap: cubeRenderTarget.texture
        }));
        customerMeterFiller.position.y = 38;
        customerMeterFiller.position.z = 19 + 12.5;
        customerMeterFiller.position.x = 28;
        scene.add(customerMeterFiller);
        const customerOrder1 = counter1.clone();
        customerOrder1.position.y = 35.2;
        customerOrder1.position.z = 10;
        customerOrder1.position.x = 32;
        customerOrder1.scale.set(2.675, 2.675, 2.675);
        scene.add(customerOrder1);
        const customerOrder2 = customerOrder1.clone();
        customerOrder2.position.z += 6.375;
        scene.add(customerOrder2);
        const customerOrder3 = customerOrder1.clone();
        customerOrder3.position.z += 6.375 * 2;
        scene.add(customerOrder3);
        const customerOrder4 = customerOrder1.clone();
        customerOrder4.position.z += 6.375 * 3;
        scene.add(customerOrder4);
        const customOrderStatus1 = new THREE.Mesh(status2.geometry.clone(), new THREE.MeshStandardMaterial({ envMap: cubeRenderTarget.texture, color: new THREE.Color(0.5, 0.5, 0.5) }));
        customOrderStatus1.position.y = 38.5;
        customOrderStatus1.position.z = 9.625;
        customOrderStatus1.position.x = 38;
        scene.add(customOrderStatus1);
        const customOrderStatus2 = customOrderStatus1.clone();
        customOrderStatus2.material = customOrderStatus2.material.clone();
        customOrderStatus2.position.z += 6.375;
        scene.add(customOrderStatus2);
        const customOrderStatus3 = customOrderStatus2.clone();
        customOrderStatus3.material = customOrderStatus3.material.clone();
        customOrderStatus3.position.z += 6.375;
        scene.add(customOrderStatus3);
        const customOrderStatus4 = customOrderStatus3.clone();
        customOrderStatus4.material = customOrderStatus4.material.clone();
        customOrderStatus4.position.z += 6.375;
        scene.add(customOrderStatus4);
        const customerBooths = [
            { dial: customerOrder1, status: customOrderStatus1, occupied: false, value: 0 },
            { dial: customerOrder2, status: customOrderStatus2, occupied: false, value: 0 },
            { dial: customerOrder3, status: customOrderStatus3, occupied: false, value: 0 },
            { dial: customerOrder4, status: customOrderStatus4, occupied: false, value: 0 }
        ];
        const diceTexes = {
            1: {
                map: await AssetManager.loadTextureAsync("dice1color.png"),
                normalMap: await AssetManager.loadTextureAsync("dice1.png")
            },
            2: {
                map: await AssetManager.loadTextureAsync("dice2color.png"),
                normalMap: await AssetManager.loadTextureAsync("dice2.png")
            },
            3: {
                map: await AssetManager.loadTextureAsync("dice3color.png"),
                normalMap: await AssetManager.loadTextureAsync("dice3.png")
            },
            4: {
                map: await AssetManager.loadTextureAsync("dice4color.png"),
                normalMap: await AssetManager.loadTextureAsync("dice4.png")
            },
            5: {
                map: await AssetManager.loadTextureAsync("dice5color.png"),
                normalMap: await AssetManager.loadTextureAsync("dice5.png")
            },
            6: {
                map: await AssetManager.loadTextureAsync("dice6color.png"),
                normalMap: await AssetManager.loadTextureAsync("dice6.png")
            }
        }
        const diceMat1 = new THREE.MeshPhysicalMaterial({ envMap: cubeRenderTarget.texture, roughness: 0.25, transmission: 0.5, dithering: true, ior: 1.5, thickness: 5.0, map: diceTexes[1].map, normalMap: diceTexes[1].map });
        const diceMat2 = new THREE.MeshPhysicalMaterial({ envMap: cubeRenderTarget.texture, roughness: 0.25, transmission: 0.5, dithering: true, ior: 1.5, thickness: 5.0, map: diceTexes[2].map, normalMap: diceTexes[2].map });
        const diceMat3 = new THREE.MeshPhysicalMaterial({ envMap: cubeRenderTarget.texture, roughness: 0.25, transmission: 0.5, dithering: true, ior: 1.5, thickness: 5.0, map: diceTexes[3].map, normalMap: diceTexes[3].map });
        const diceMat4 = new THREE.MeshPhysicalMaterial({ envMap: cubeRenderTarget.texture, roughness: 0.25, transmission: 0.5, dithering: true, ior: 1.5, thickness: 5.0, map: diceTexes[4].map, normalMap: diceTexes[4].map });
        const diceMat5 = new THREE.MeshPhysicalMaterial({ envMap: cubeRenderTarget.texture, roughness: 0.25, transmission: 0.5, dithering: true, ior: 1.5, thickness: 5.0, map: diceTexes[5].map, normalMap: diceTexes[5].map });
        const diceMat6 = new THREE.MeshPhysicalMaterial({ envMap: cubeRenderTarget.texture, roughness: 0.25, transmission: 0.5, dithering: true, ior: 1.5, thickness: 5.0, map: diceTexes[6].map, normalMap: diceTexes[6].map });
        const diceMats = [diceMat1, diceMat2, diceMat3, diceMat4, diceMat5, diceMat6];
        /* const diceBase = new THREE.Mesh(new RoundedBoxGeometry(5, 5, 5, 2, 0.5),);
         diceBase.position.y = 32.5;
         diceBase.position.z = 11;
         diceBase.position.x = -50;
         diceBase.castShadow = true;
         diceBase.receiveShadow = true;*/
        const newDice = () => {
            const diceNum = 1 + Math.floor(Math.random() * 6);
            const dice = new THREE.Mesh(new RoundedBoxGeometry(5, 5, 5, 2, 0.5), diceMats[diceNum - 1]);
            dice.value = diceNum;
            dice.position.y = 32.5;
            dice.position.z = 11;
            dice.position.x = -50;
            dice.castShadow = true;
            dice.receiveShadow = true;
            scene.add(dice);
            return dice;
        }
        let diceQueue = [];

        // Build postprocessing stack
        // Render Targets
        const cubeCamera = new THREE.CubeCamera(1, 100000, cubeRenderTarget);
        scene.add(cubeCamera);
        cubeCamera.position.set(0, 30, 30);
        cubeCamera.update(renderer, scene);
        const defaultTexture = new THREE.WebGLRenderTarget(clientWidth, clientHeight, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.NearestFilter,
            type: THREE.FloatType,
            dithering: true
        });
        defaultTexture.depthTexture = new THREE.DepthTexture(clientWidth, clientHeight, THREE.FloatType);
        // Post Effects
        const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(clientWidth, clientHeight, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.NearestFilter,
            type: THREE.FloatType,
            dithering: true
        }));
        const smaaPass = new SMAAPass(clientWidth, clientHeight);
        const effectPass = new ShaderPass(EffectShader);
        const effectCompositer = new ShaderPass(EffectCompositer);
        const outlinePass = new OutlinePass(new THREE.Vector2(clientWidth, clientHeight), scene, camera);
        outlinePass.hiddenEdgeColor.set(new THREE.Color(0.1, 0.1, 0.1));
        composer.addPass(effectPass);
        composer.addPass(effectCompositer);
        composer.addPass(new UnrealBloomPass(new THREE.Vector2(clientWidth, clientHeight), 0.5, 0.2, 1.0));
        composer.addPass(outlinePass);
        composer.addPass(new ShaderPass(GammaCorrectionShader));
        composer.addPass(smaaPass);
        const smoothstep = x => 3 * x ** 2 - 2 * x ** 3;
        const rollCurve = (x) => {
            if (x < 0.5) {
                return smoothstep(x + 0.5) - 0.5;
            } else {
                return smoothstep(x - 0.5) + 0.5;
            }
        }
        const sharpstep = (x) => {
            return x + (smoothstep(x) - x) * 0.5;
        }
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        let selectedDice = null;
        let selectedStake = null;
        const stakes = [stake1, stake2, stake3];
        const stakeBoxes = stakes.map(stake => new THREE.Box3().setFromObject(stake));
        stakeBoxes.forEach(box => {
            box.expandByScalar(1.25);
            const helper = new THREE.Box3Helper(box, 0xffff00);
            //scene.add(helper);
        });
        let selectCustomer;
        let score = 0;
        const createDialogue = (text, pos) => {
            const elem = document.createElement("span");
            elem.innerHTML = text;
            elem.classList.add("tutorialText");
            const obj = new CSS2DObject(elem);
            obj.elem = elem;
            obj.position.copy(pos);
            return obj;
        }
        let tutorial = [
            createDialogue("Dice will come on this conveyor belt.", new THREE.Vector3(-20, 30, 10)),
            createDialogue("Click on a die and then on a<br> stick to create a dice roll.", new THREE.Vector3(-20, 30, 20)),
            createDialogue("Customer orders come in over here<br>- whenever the meter fills up.", new THREE.Vector3(13.5, 30, 19)),
            createDialogue("Click the blue button once the sum<br> of one of your rolls is equal to the order.", new THREE.Vector3(13.5, 30, 19)),
            createDialogue("If an order comes in and there aren't<br> any spaces left... it's game over.", new THREE.Vector3(13.5, 30, 19)),
            createDialogue("Good luck!", new THREE.Vector3(20, 30, 20))
        ];
        const gameOverText = createDialogue("Game over - your score was $score! Better luck next time! <br>(Press R to play again)", new THREE.Vector3(0, 30, 25))
        let currentTutorial = tutorial.shift();
        let gameOver = false;
        scene.add(currentTutorial);
        document.onmousedown = (e) => {
            if (!backgroundMusic.isPlaying) {
                backgroundMusic.play();
            }
            scene.remove(currentTutorial);
            if (tutorial.length > 0) {
                currentTutorial = tutorial.shift();
                scene.add(currentTutorial);
            }
            pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
            pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(pointer, camera);
            diceQueue.forEach(dice => {
                if (raycaster.intersectObject(dice).length > 0) {
                    outlinePass.selectedObjects = [dice];
                    selectedDice = dice;
                }
            });
            customerBooths.forEach(booth => {
                if (raycaster.intersectObject(booth.status).length > 0) {
                    outlinePass.selectedObjects = [booth.status];
                    selectCustomer = booth;
                    stakes.some(stake => {
                        if (stake.dice.reduce((t, v) => t + v.value, 0) === selectCustomer.value) {
                            selectCustomer.occupied = false;
                            selectCustomer.value = 0;
                            stake.cleaning = true;
                            stake.cleanTick = 0.0;
                            score += stake.dice.length === 5 ? 2 : 1;
                            chaChing.play();
                            return true;
                        }
                    })
                }
            });
            stakes.forEach((stake, i) => {
                if (selectedDice !== null) {
                    if (raycaster.ray.intersectsBox(stakeBoxes[i]) && stake.dice.length < 5 && !stake.cleaning) {
                        selectedStake = stake;
                        diceQueue.splice(diceQueue.indexOf(selectedDice), 1);
                        selectedStake.attach(selectedDice);
                        selectedStake.dice.push(selectedDice);
                        pickUp.play();
                        selectedDice = null;
                        selectedStake = null;
                    }
                }
                if (raycaster.intersectObject(stake.status).length > 0 && !stake.cleaning) {
                    selectCustomer = customerBooths.find(customer => stake.dice.reduce((t, v) => t + v.value, 0) === customer.value);
                    if (selectCustomer === undefined) {
                        selectCustomer = null;
                    }
                    if (selectCustomer !== null && selectCustomer.occupied) {
                        if (stake.dice.reduce((t, v) => t + v.value, 0) === selectCustomer.value) {
                            selectCustomer.occupied = false;
                            selectCustomer.value = 0;
                            stake.cleaning = true;
                            stake.cleanTick = 0.0;
                            score += stake.dice.length === 5 ? 2 : 1;
                            chaChing.play();
                        }
                    }
                }
            });
        }
        document.onkeydown = (e) => {
            if (gameOver && e.key.toLowerCase() === "r") {
                gameOver = false;
                score = 0;
                selectCustomer = null;
                selectedDice = null;
                stakes.forEach(stake => {
                    stake.dice.forEach(dice => {
                        dice.visible = false;
                        scene.remove(dice);
                        dice.geometry.dispose();
                    });
                    stake.dice = [];
                    // stake.position.z = 37.5;
                });
                customerBooths.forEach(booth => {
                    booth.occupied = false;
                    booth.value = 0;
                });
                customerWait = 900;
                diceWait = 300;
                customerTick = 0;
                diceTick = 0;
                diceQueue = [];
                scene.remove(gameOverText);
            }
        }
        let frame = 800;
        let currTime = performance.now();
        let customerTick = 0;
        let diceTick = 0;
        let customerWait = 900;
        let diceWait = 300;
        let orders = 0;
        const listener = new THREE.AudioListener();
        camera.add(listener);
        const backgroundMusic = new THREE.Audio(listener);
        backgroundMusic.setBuffer(await AssetManager.loadAudioAsync("background-music.mp3"));
        backgroundMusic.setLoop(true);
        const chaChing = new THREE.Audio(listener);
        chaChing.setBuffer(await AssetManager.loadAudioAsync("cha-ching.wav"));
        const pickUp = new THREE.Audio(listener);
        pickUp.setBuffer(await AssetManager.loadAudioAsync("pick-up.wav"));
        pickUp.setVolume(2.0);
        const newOrder = new THREE.Audio(listener);
        newOrder.setBuffer(await AssetManager.loadAudioAsync("newOrder.wav"));
        document.getElementById("loading").remove();

        function animate() {
            document.getElementById("score").innerHTML = `Score: ${score}`;
            gameOverText.elem.innerHTML = gameOverText.elem.innerHTML.replace("$score", score);
            let delta = Math.min(performance.now() - currTime, 100);
            currTime = performance.now();
            let scaleFactor = ((delta / 1000) / (1 / 60));
            frame += 1 * scaleFactor;
            customerTick += scaleFactor;
            let usableFrame = Math.floor(frame);
            renderer.setRenderTarget(defaultTexture);
            renderer.clear();
            renderer.render(scene, camera);
            conveyorTex.offset.y += 0.01 * scaleFactor * (gameOver ? 0 : 1);
            if (gameOver) {
                customerTick = 0;
                diceTick = 0;
            }
            customerMeterFiller.scale.set(1.01, 1.1, (customerTick) / customerWait);
            if (customerTick >= customerWait) {
                orders++;
                const customerPlace = customerBooths.find(booth => !booth.occupied);
                if (customerPlace) {
                    newOrder.play();
                    customerPlace.occupied = true;
                    customerPlace.value = Math.floor(5 + (Math.random() ** 2) * Math.min(12 + orders, 25));
                } else {
                    gameOver = true;
                    scene.add(gameOverText);
                }
                customerTick = 0;
                customerWait *= 0.95;
                //customerPlace.status.material.emissive = new THREE.Vector(10.0, 0.0, 0.0);
            }
            customerBooths.forEach(booth => {
                const sum = booth.value;
                const ones = sum % 10;
                const tens = Math.floor(sum / 10);
                booth.dial.children[0].rotation.x += ((Math.PI + (Math.PI / 5) * ones) - booth.dial.children[0].rotation.x) / 10;
                booth.dial.children[1].rotation.x += ((Math.PI + (Math.PI / 5) * tens) - booth.dial.children[1].rotation.x) / 10;
                if (booth.occupied && !gameOver) {
                    const targetColor = new THREE.Color(0.0, 0.0, 1.0);
                    booth.status.material.color.lerp(targetColor, 0.1);
                    booth.status.material.emissive.lerp(targetColor.clone().multiplyScalar(10.0), 0.1);
                } else {
                    const targetColor = new THREE.Color(1.0, 1.0, 1.0);
                    booth.status.material.color.lerp(targetColor, 0.1);
                    booth.status.material.emissive.lerp(targetColor.clone().multiplyScalar(0.0), 0.1);
                }
            });
            /*dice.position.x += 0.1;
            dice.rotation.z = -Math.PI / 2 * (Math.floor(dice.position.x * 0.175) + sharpstep(0.175 * dice.position.x - Math.floor(dice.position.x * 0.175)));*/
            diceTick += scaleFactor;
            if (diceTick > diceWait && diceQueue.length < 12) {
                diceTick = 0;
                diceQueue.push(newDice());
                diceWait = customerWait / 3;
            }
            diceQueue.forEach((dice, i) => {
                if (dice.position.x < 3 * (1 / 0.175) - (1 / 0.175) * i) {
                    dice.position.x += 0.1 * scaleFactor * (gameOver ? 0.0 : 1.0);
                }
                dice.rotation.z = -Math.PI / 2 * (Math.floor(dice.position.x * 0.175) + sharpstep(0.175 * dice.position.x - Math.floor(dice.position.x * 0.175)));
                if (gameOver) {
                    //dice.rotation.z += ((-Math.PI / 2 * (Math.floor(dice.position.x * 0.175))) - dice.rotation.x) / 10.0;
                    dice.position.lerp(new THREE.Vector3(dice.position.x, dice.position.y, 100), 0.01);
                    dice.quaternion.slerp(new THREE.Quaternion(), 0.1);
                }
            });
            stakes.forEach(stake => {
                stake.dice.forEach((die, i) => {
                    die.position.lerp(new THREE.Vector3(0, 5 - i * 5, 0), 0.1);
                    die.quaternion.slerp(new THREE.Quaternion(), 0.1);
                });
                const sum = stake.dice.reduce((t, v) => t + v.value, 0);
                const ones = sum % 10;
                const tens = Math.floor(sum / 10);
                stake.counter.children[0].rotation.x += ((Math.PI + (Math.PI / 5) * ones) - stake.counter.children[0].rotation.x) / 10;
                stake.counter.children[1].rotation.x += ((Math.PI + (Math.PI / 5) * tens) - stake.counter.children[1].rotation.x) / 10;
                let targetColor = new THREE.Color(1.0, 0.0, 0.0).lerp(new THREE.Color(0.0, 1.0, 0.0), stake.dice.length / 5);
                if (gameOver) {
                    targetColor = new THREE.Color(1.0, 1.0, 1.0);
                }
                stake.status.children[0].color.lerp(targetColor, 0.1);
                stake.status.material.color.lerp(targetColor, 0.1);
                stake.status.material.emissive.lerp(targetColor.clone().multiplyScalar(gameOver ? 0.0 : 10.0), 0.1);
                if (stake.cleaning) {
                    stake.position.z = 37.5 + 50 * Math.sin(Math.PI * (stake.cleanTick / 120));
                    stake.cleanTick += scaleFactor;
                    if (stake.cleanTick >= 60 && stake.dice.length > 0) {
                        stake.dice.forEach(dice => {
                            dice.visible = false;
                            scene.remove(dice);
                            dice.geometry.dispose();
                        });
                        stake.dice = [];
                    }
                    if (stake.cleanTick >= 120) {
                        stake.cleanTick = 0;
                        stake.cleaning = false;
                    }
                }
                if (gameOver) {
                    stake.position.z += 1.0 * scaleFactor;
                } else if (!stake.cleaning) {
                    stake.position.z += (37.5 - stake.position.z) / 10;
                }
            })
            effectCompositer.uniforms["sceneDiffuse"].value = defaultTexture.texture;
            effectCompositer.uniforms["sceneDepth"].value = defaultTexture.depthTexture;
            effectPass.uniforms["sceneDiffuse"].value = defaultTexture.texture;
            effectPass.uniforms["sceneDepth"].value = defaultTexture.depthTexture;
            effectPass.uniforms["projMat"].value = camera.projectionMatrix;
            effectPass.uniforms["viewMat"].value = camera.matrixWorldInverse;
            effectPass.uniforms["projViewMat"].value = camera.projectionMatrix.clone().multiply(camera.matrixWorldInverse.clone());
            effectPass.uniforms["projectionMatrixInv"].value = camera.projectionMatrixInverse;
            effectPass.uniforms["viewMatrixInv"].value = camera.matrixWorld;
            effectPass.uniforms["cameraPos"].value = camera.position;
            effectPass.uniforms['resolution'].value = new THREE.Vector2(clientWidth, clientHeight);
            effectPass.uniforms['time'].value = performance.now() / 1000;
            effectCompositer.uniforms["resolution"].value = new THREE.Vector2(clientWidth, clientHeight);
            composer.render();
            labelRenderer.render(scene, camera);
            stats.update();
            requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
    }
    main();
}
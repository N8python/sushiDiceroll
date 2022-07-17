import * as THREE from 'https://cdn.skypack.dev/three@0.142.0';
import {
    GLTFLoader
} from 'https://unpkg.com/three@0.142.0/examples/jsm/loaders/GLTFLoader.js';
const AssetManager = {};
AssetManager.gltfLoader = new GLTFLoader();
AssetManager.textureLoader = new THREE.TextureLoader();
AssetManager.audioLoader = new THREE.AudioLoader();
AssetManager.loadGLTFAsync = (url) => {
    return new Promise((resolve, reject) => {
        AssetManager.gltfLoader.load(url, obj => {
            resolve(obj);
        })
    });
}

AssetManager.loadAudioAsync = (url) => {
    return new Promise((resolve, reject) => {
        AssetManager.audioLoader.load(url, (buffer) => {
            resolve(buffer);
        });
    })
}

AssetManager.loadTextureAsync = (url) => {
    return new Promise((resolve, reject) => {
        AssetManager.textureLoader.load(url, (tex) => {
            resolve(tex);
        })
    })
}
AssetManager.loadAll = (promiseArr, element, message) => {
    let count = promiseArr.length;
    let results = [];
    element.innerHTML = `${message}&nbsp;(${promiseArr.length - count}&nbsp;/&nbsp;${promiseArr.length})...`
    return new Promise((resolve, reject) => {
        promiseArr.forEach((promise, i) => {
            promise.then(result => {
                results[i] = result;
                count--;
                element.innerHTML = `${message}&nbsp;(${promiseArr.length - count}&nbsp;/&nbsp;${promiseArr.length})...`
                if (count === 0) {
                    resolve(results);
                }
            })
        })
    });
}
export { AssetManager };
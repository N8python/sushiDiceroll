import * as THREE from 'https://cdn.skypack.dev/three@0.142.0';
const EffectCompositer = {
    uniforms: {

        'sceneDiffuse': { value: null },
        'sceneDepth': { value: null },
        'tDiffuse': { value: null },
        'projMat': { value: new THREE.Matrix4() },
        'viewMat': { value: new THREE.Matrix4() },
        'projectionMatrixInv': { value: new THREE.Matrix4() },
        'viewMatrixInv': { value: new THREE.Matrix4() },
        'cameraPos': { value: new THREE.Vector3() },
        'resolution': { value: new THREE.Vector2() },
        'time': { value: 0.0 },
    },
    vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,
    fragmentShader: /* glsl */ `
		uniform sampler2D sceneDiffuse;
    uniform sampler2D sceneDepth;
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    varying vec2 vUv;
    void main() {
        const float directions = 16.0;
        const float quality = 6.0;
        const float pi = 3.14159;
        float size = 12.0;//1000.0 * (1.0 - texture2D(sceneDepth, vUv).x);
        vec2 radius = vec2(size) / resolution;
        vec3 texel = vec3(0.0);
        float count = 0.0;
        for(float d =0.0; d < pi * 2.0; d+=(pi * 2.0) / directions) {
            for(float i = 1.0/quality; i<=1.0; i+=1.0/quality) {
                texel += texture2D(tDiffuse, vUv+vec2(cos(d), sin(d)) * radius * i).rgb;
                count += 1.0;
            }
        }
        texel /= count;
        gl_FragColor = vec4(texture2D(sceneDiffuse, vUv).rgb * vec3(pow(texel.x, 5.0)), 1.0);
    }
    `

}
export { EffectCompositer };
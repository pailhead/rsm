import * as dat from "dat.gui";
import Stats from "stats-js";
import {
  BoxGeometry,
  BufferGeometry,
  CameraHelper,
  Clock,
  Matrix4,
  Mesh,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Points,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  SpotLight,
  SpotLightHelper,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { DisplayMRT } from "./DisplayMRT";
import { PATTERN } from "./GatherMaterial";
import { CornellBox } from "./CornellBox";
import { Targets } from "./Targets";
import { MyLayers } from "./constants";
import { GatherPass } from "./GatherPass";
import { InterpolatePass } from "./InterpolatePass";
import { BlitToScreen } from "./BlitToScreen";

const LOW_RES = 128;
const RSM_SIZE = 512;
var stats = new Stats();
document.body.appendChild(stats.dom);

const gui = new dat.GUI();

///=========================================================================================================
const renderer = new WebGLRenderer({
  antialias: true,
  premultipliedAlpha: false,
  alpha: false,
  preserveDrawingBuffer: true,
  stencil: true,
});

const gl = renderer.getContext();
renderer.autoClear = false;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animation);
document.body.appendChild(renderer.domElement);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;

const targets = new Targets(gl, LOW_RES, RSM_SIZE);

///=========================================================================================================

const uLightViewMatrix = { value: new Matrix4() };
const uLightProjectionMatrix = { value: new Matrix4() };
const uSearchRadius = { value: 1 };
const uEdgeCorrection = { value: 0.02 };
const uNormalSimilarityThreshold = { value: 0.8 };
const uWPSimilarityThreshold = { value: 0.1 };

///=========================================================================================================

const scene = new Scene();

const camera = new PerspectiveCamera(50, 1, 0.1, 1000);

camera.position.set(1, 2, 2);
camera.lookAt(new Vector3(0.5, 0, 0.5));

const controls = new OrbitControls(camera, renderer.domElement);

///=========================================================================================================

const spotLight = new SpotLight("#ffffff", 8);
spotLight.position.set(1.5, 1.5, 1.5);
spotLight.angle = Math.PI / 9;
spotLight.lookAt(new Vector3());
spotLight.castShadow = true;
spotLight.shadow.camera.near = 0.1;
spotLight.shadow.camera.far = 6;

scene.add(spotLight);
spotLight.updateMatrixWorld();
spotLight.layers.enable(2);

const shadowCamera = new PerspectiveCamera((180 / 9) * 2, 1, 0.1, 100);
spotLight.add(shadowCamera);

shadowCamera.updateMatrixWorld();
shadowCamera.updateProjectionMatrix();
uLightViewMatrix.value.copy(shadowCamera.matrixWorld).invert();
uLightProjectionMatrix.value.copy(shadowCamera.projectionMatrix);

const slHelper = new SpotLightHelper(spotLight);
scene.add(slHelper);

// const scHelper = new CameraHelper(shadowCamera);
// scene.add(scHelper);
///=========================================================================================================

const cornell = new CornellBox(spotLight);
scene.add(cornell);

const displayMRT = new DisplayMRT(targets.rsmMRT.textures[0]);
scene.add(displayMRT);

///=========================================================================================================
// const points = new Points(
//   new BufferGeometry().setFromPoints(PATTERN),
//   new ShaderMaterial({
//     vertexShader: `
//       void main (){
//         gl_PointSize = 32.*position.z+5.;
//         gl_Position.xy = position.xy * 0.5;
//         gl_Position.z=0.;
//         gl_Position.w=1.;
//       }
//   `,
//     fragmentShader: `
//       void main(){
//         gl_FragColor = vec4(1.,0.,0,1.);
//       }
//   `,
//   })
// );
// points.renderOrder = 5;
// points.frustumCulled = false;
// scene.add(points);
///=========================================================================================================

const gatherPassLowRes = new GatherPass(
  LOW_RES,
  targets.rsmMRT,
  targets.lowResGBuffer,
  uLightViewMatrix,
  uLightProjectionMatrix,
  uSearchRadius,
  uEdgeCorrection
);
const gatherPassFinal = new GatherPass(
  LOW_RES,
  targets.rsmMRT,
  targets.mainGBuffer,
  uLightViewMatrix,
  uLightProjectionMatrix,
  uSearchRadius,
  uEdgeCorrection,
  true
);

const interpolatePass = new InterpolatePass(
  targets.mainGBuffer,
  targets.lowResGBuffer,
  targets.lowResGI,
  uNormalSimilarityThreshold,
  uWPSimilarityThreshold,
  LOW_RES
);
const blitPass = new BlitToScreen(targets.composition.texture);
///=========================================================================================================

const options = {
  showHelper: false,
  showInterpolation: false,
  targetTexture: "rsmMRT:flux",
};
const showHelpers = (v: boolean) => {
  slHelper.visible = v;
  // scHelper.visible = v;
};
const targetNames = [
  "rsmMRT:flux",
  "rsmMRT:normal",
  "rsmMRT:wp",
  "lowResGBuffer:color",
  "lowResGBuffer:normal",
  "lowResGBuffer:wp",
  "lowResGI",
  "mainGBuffer:color",
  "mainGBuffer:normal",
  "mainGBuffer:wp",
];
const onTextureChange = (v: string) => {
  switch (v) {
    case "rsmMRT:flux":
      return displayMRT.setTexture(targets.rsmMRT.textures[0]);
    case "rsmMRT:normal":
      return displayMRT.setTexture(targets.rsmMRT.textures[1]);
    case "rsmMRT:wp":
      return displayMRT.setTexture(targets.rsmMRT.textures[2]);
    case "lowResGBuffer:color":
      return displayMRT.setTexture(targets.lowResGBuffer.textures[0]);
    case "lowResGBuffer:normal":
      return displayMRT.setTexture(targets.lowResGBuffer.textures[1]);
    case "lowResGBuffer:wp":
      return displayMRT.setTexture(targets.lowResGBuffer.textures[2]);
    case "lowResGI":
      return displayMRT.setTexture(targets.lowResGI.texture);
    case "mainGBuffer:color":
      return displayMRT.setTexture(targets.mainGBuffer.textures[0]);
    case "mainGBuffer:normal":
      return displayMRT.setTexture(targets.mainGBuffer.textures[1]);
    case "mainGBuffer:wp":
      return displayMRT.setTexture(targets.mainGBuffer.textures[2]);
  }
};

gui.add(uSearchRadius, "value", 0, 1).step(0.01).name("search radius");
gui.add(uEdgeCorrection, "value", 0, 1).step(0.01).name("edge f");
gui.add(uNormalSimilarityThreshold, "value", 0, 1).step(0.01).name("normal f");
gui.add(uWPSimilarityThreshold, "value", 0, 1).step(0.01).name("wp f");
gui.add(options, "showHelper").onChange(showHelpers);
gui
  .add(options, "showInterpolation")
  .onChange(gatherPassFinal.setShowInterpolation);
gui
  .add(options, "targetTexture", targetNames)
  .onChange(onTextureChange)
  .name("target");

showHelpers(options.showHelper);
onTextureChange(options.targetTexture);
///=========================================================================================================

const clock = new Clock();
let angle = 0;
function animation() {
  stats.begin();

  const delta = clock.getDelta();

  angle += delta * 0.4;

  let anglePhase = Math.cos(angle) * Math.PI;
  anglePhase /= 8;
  anglePhase += Math.PI / 4;
  const lx = Math.cos(anglePhase);
  const ly = Math.sin(anglePhase);

  const r = 1.5 * 1.5;

  spotLight.position.set(lx * r, 1 + Math.cos(angle * 1.3) * 0.2, ly * r);
  spotLight.lookAt(0, 0, 0);

  shadowCamera.layers.set(MyLayers.RSM);
  renderer.setRenderTarget(targets.rsmMRT);
  renderer.clear();
  renderer.render(scene, shadowCamera);

  //render standard materials eligible for effect into low res g buffer
  camera.layers.set(MyLayers.StandardGBuffer);
  renderer.setRenderTarget(targets.lowResGBuffer);
  renderer.clear();
  renderer.render(scene, camera);

  //for each pixel of low res g buffer render gather effect
  //normal and wp are already in low res GBuffer

  renderer.setRenderTarget(targets.lowResGI);
  renderer.render(gatherPassLowRes, gatherPassLowRes.camera);

  //render standard materials into full screen, should write 1
  renderer.setRenderTarget(targets.mainGBuffer);
  renderer.clear();
  renderer.render(scene, camera);

  renderer.setRenderTarget(targets.composition);
  renderer.clear(true, false, false);
  renderer.render(interpolatePass, interpolatePass.camera);
  renderer.render(gatherPassFinal, gatherPassFinal.camera);

  camera.layers.set(MyLayers.Main);
  renderer.render(scene, camera);

  renderer.setRenderTarget(null);
  renderer.clear();
  renderer.render(blitPass, blitPass.camera);

  stats.end();
}

const onResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  targets.setSize(window.innerWidth, window.innerHeight);
};
window.addEventListener("resize", onResize);
onResize();

const remap = (
  v: number,
  sourceMin: number,
  sourceMax: number,
  targetMin: number,
  targetMax: number
) =>
  targetMin +
  (targetMax - targetMin) * ((v - sourceMin) / (sourceMax - sourceMin));

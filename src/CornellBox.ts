import {
  BoxGeometry,
  BufferGeometry,
  Matrix4,
  Mesh,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  SpotLight,
  WebGLRenderTarget,
} from "three";
import { GBufferMaterial } from "./GBufferMaterial";
import { StandardMRTStencilMaterial } from "./StandardMRTStencilMaterial";
import { MyLayers } from "./constants";

export class CornellBox extends Object3D {
  constructor(spotLight: SpotLight) {
    super();

    const planeGeometry = new PlaneGeometry(1, 1, 1, 1);
    planeGeometry.translate(0.5, 0.5, 0);

    const createMesh = (color: string, geometry: BufferGeometry) => {
      //main mesh to draw into multiple targets
      const meshMainGBuffer = new Mesh(
        geometry,
        new StandardMRTStencilMaterial(color)
      );
      meshMainGBuffer.layers.set(MyLayers.StandardGBuffer);

      const meshRSMGBufer = new Mesh(
        geometry,
        new GBufferMaterial(color, spotLight.position)
      );
      meshRSMGBufer.layers.set(MyLayers.RSM);

      const obj = new Object3D();
      obj.add(meshMainGBuffer, meshRSMGBufer);
      return obj;
    };

    const greenWall = createMesh("#00ff00", planeGeometry);
    this.add(greenWall);

    const floor = createMesh("#0000ff", planeGeometry);
    floor.rotation.x = -Math.PI / 2;
    floor.rotation.z = -Math.PI / 2;
    this.add(floor);

    const redWall = createMesh("#ff0000", planeGeometry);
    redWall.rotation.x = Math.PI / 2;
    redWall.rotation.y = Math.PI / 2;
    this.add(redWall);

    const cubeGeometry = new BoxGeometry(1, 1, 1, 1, 1, 1);
    cubeGeometry.translate(0, 0.5, 0);
    const greyBox = createMesh("#ffffff", cubeGeometry);
    greyBox.scale.set(0.2, 0.4, 0.2);
    greyBox.position.set(0.3, 0, 0.4);
    greyBox.rotation.y = 0.3;
    this.add(greyBox);

    const sphereGeometry = new SphereGeometry(1, 32, 16);
    const sphere = createMesh("#ffffff", sphereGeometry);
    sphere.scale.multiplyScalar(0.1);
    sphere.position.set(0.3, 0.5, 0.4);
    this.add(sphere);

    this.traverse((c) => {
      c.castShadow = true;
      c.receiveShadow = true;
    });
  }
}

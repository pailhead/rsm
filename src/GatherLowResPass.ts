import {
  Matrix4,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  WebGLRenderTarget,
} from "three";
import { GatherMaterialScreen } from "./GatherMaterial";

export class GatherPass extends Scene {
  public camera = new PerspectiveCamera();
  constructor(
    lowResSize: number,
    rsmTarget: WebGLRenderTarget,
    lowResGBuffer: WebGLRenderTarget,
    uLightViewMatrix: { value: Matrix4 },
    uLightProjectionMatrix: { value: Matrix4 },
    uSearchRadius: { value: number },
    uEdgeCorrection: { value: number },
    isFullScreen = false
  ) {
    super();

    const geometry = new PlaneGeometry(2, 2, 1, 1);
    const mesh = new Mesh(
      geometry,
      new GatherMaterialScreen(
        lowResSize,
        uLightViewMatrix,
        uLightProjectionMatrix,
        rsmTarget,
        lowResGBuffer,
        uSearchRadius,
        uEdgeCorrection,
        isFullScreen
      )
    );
    mesh.frustumCulled = false;
    this.add(mesh);
  }
}

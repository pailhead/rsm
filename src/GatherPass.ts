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
  private _material: GatherMaterialScreen;
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
    const material = (this._material = new GatherMaterialScreen(
      lowResSize,
      uLightViewMatrix,
      uLightProjectionMatrix,
      rsmTarget,
      lowResGBuffer,
      uSearchRadius,
      uEdgeCorrection,
      isFullScreen
    ));
    const mesh = new Mesh(geometry, material);
    mesh.frustumCulled = false;
    this.add(mesh);
  }
  setShowInterpolation = (v: boolean) => {
    this._material.showInterpolation = v;
  };
}

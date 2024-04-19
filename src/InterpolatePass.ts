import {
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderTarget,
} from "three";
import { InterpolateMaterial } from "./InterpolateMaterial";

export class InterpolatePass extends Scene {
  camera = new PerspectiveCamera();
  constructor(
    mainGBuffer: WebGLRenderTarget,
    lowResGBuffer: WebGLRenderTarget,
    lowResGI: WebGLRenderTarget,
    uNormalSimilarityThreshold: { value: number },
    uWPSimilarityThreshold: { value: number },
    lowResSize: number
  ) {
    super();

    const mesh = new Mesh(
      new PlaneGeometry(2, 2, 1, 1),
      new InterpolateMaterial(
        mainGBuffer,
        lowResGBuffer,
        lowResGI,
        uNormalSimilarityThreshold,
        uWPSimilarityThreshold,
        lowResSize
      )
    );
    this.add(mesh);

    mesh.frustumCulled = false;
  }
}

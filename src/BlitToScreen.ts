import {
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Texture,
} from "three";

const vertexShader = `
varying vec2 vUv;
void main (){ 
  vUv = uv;
  gl_Position = vec4(position.xy,0.,1.);
}
`;
const fragmentShader = `
varying vec2 vUv;
uniform sampler2D uTexture;
void main (){ 
  gl_FragColor = texture2D(uTexture,vUv);
  gl_FragColor.w = 1.;
}
`;
export class BlitToScreen extends Scene {
  public camera = new PerspectiveCamera();
  constructor(texture: Texture) {
    super();
    const mesh = new Mesh(
      new PlaneGeometry(2, 2, 1, 1),
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: { uTexture: { value: texture } },
        depthTest: false,
        depthWrite: false,
      })
    );
    this.add(mesh);
  }
}

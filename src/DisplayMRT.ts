import {
  BufferGeometry,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Texture,
  WebGLRenderTarget,
} from "three";

const vertexShader = `
varying vec2 vUv;
void main () {
  vUv = uv;
  gl_Position = vec4(position.xy*0.25+0.75,0.,1.);
  gl_Position.x -= 1.5;
}
`;

const fragmentShader = `
varying vec2 vUv;
uniform sampler2D uTexture;
void main () {
  gl_FragColor = texture2D(uTexture,vUv);
  gl_FragColor.w = 1.;
}

`;
export class DisplayMRT extends Mesh<BufferGeometry, ShaderMaterial> {
  constructor(texture: Texture) {
    super(
      new PlaneGeometry(2, 2, 1, 1),
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTexture: { value: texture },
        },
      })
    );
    this.frustumCulled = false;
  }
  setTexture(v: Texture) {
    console.log(v);
    this.material.uniforms.uTexture.value = v;
  }
}

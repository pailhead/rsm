import {
  AlwaysStencilFunc,
  GLSL3,
  MeshStandardMaterial,
  ReplaceStencilOp,
} from "three";

/**
 * write one to stencil where there is geometry,
 * write world normlal world pos and albedo
 */
export class StandardMRTStencilMaterial extends MeshStandardMaterial {
  constructor(color: string) {
    super({
      color,
      metalness: 0,
      roughness: 0.5,
      stencilRef: 1,
      stencilWrite: true,
      stencilFunc: AlwaysStencilFunc,
      stencilZPass: ReplaceStencilOp,
    });
    this.onBeforeCompile = (foo) => {
      foo.glslVersion = GLSL3;
      console.log("debug");
      foo.vertexShader = foo.vertexShader.replace(
        "void main() {\n",
        `
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        
        void main(){
          vWorldPosition = (modelMatrix * vec4(position,1.)).xyz;
          vWorldNormal = (modelMatrix * vec4(normal,0.)).xyz;
        `
      );
      foo.fragmentShader = foo.fragmentShader.replace(
        "#include <dithering_fragment>\n",
        `
        #include <dithering_fragment>
        gNormal = vec4(normalize(vWorldNormal),1.);
        gWorldPos = vec4(vWorldPosition,1.);
        `
      );
      foo.fragmentShader = `
      #define gl_FragColor gAlbedo
      ${foo.fragmentShader}
      `;
      foo.fragmentShader = foo.fragmentShader.replace(
        "void main() {\n",
        `
        layout(location = 0) out vec4 gAlbedo;
        layout(location = 1) out vec4 gNormal;
        layout(location = 2) out vec4 gWorldPos;
        
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        void main(){
        `
      );
    };
  }
}

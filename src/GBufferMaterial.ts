import {
  Color,
  GLSL3,
  Matrix4,
  RawShaderMaterial,
  ShaderMaterial,
  Vector3,
} from "three";

const vertexShader = `
in vec3 position;
in vec3 normal;

uniform mat4 modelMatrix;
uniform mat4 projectionMatrix; 
uniform mat4 viewMatrix; 

out vec3 vNormal;
out vec4 vWorldPosDepth;
out vec4 vLightPos;

void main (){
  vNormal = (modelMatrix * vec4(normal,0.)).xyz;
  vec4 worldPos = modelMatrix * vec4(position,1.);  
  vec4 viewPos = viewMatrix * worldPos;
  vWorldPosDepth = vec4(worldPos.xyz, -viewPos.z);
  gl_Position = projectionMatrix * viewPos;
  vLightPos = gl_Position;
}
`;

const fragmentShader = ` 
precision highp float;
precision highp int; 

layout(location = 0) out vec4  gFlux;
layout(location = 1) out vec4  gNormal;
layout(location = 2) out vec4  gWorldPosDepth;

uniform vec3 uColor; 
uniform vec3 uLightPos;

in vec3 vNormal;
in vec4 vWorldPosDepth;
in vec4 vLightPos;


void main () {
  vec3 lDir = uLightPos - vWorldPosDepth.xyz;
  lDir = normalize(lDir);
  vec3 lPos = vLightPos.xyz/vLightPos.w;
  float d = length(lPos.xy);
  float mask = smoothstep(1.,.9,d);
  vec3 normal = normalize(vNormal);
  float ndotl = dot(normal,lDir);
  ndotl = clamp(ndotl,0.,1.);
  vec3 flux = uColor * mask * ndotl;
  gFlux          = vec4(flux,1.);
  gNormal        = vec4(normal,0.);
  gWorldPosDepth = vWorldPosDepth;
}
`;

export class GBufferMaterial extends RawShaderMaterial {
  constructor(color = "#ff0000", lightPosition: Vector3) {
    super({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColor: { value: new Color(color) },
        uLightPos: { value: lightPosition },
      },
      glslVersion: GLSL3,
    });
  }
  // get lightModelViewMatrix(): Matrix4 {
  //   return this.uniforms.uLightViewMatrix.value;
  // }
  // set lightModelViewMatrix(v: Matrix4) {
  //   this.uniforms.uLightViewMatrix.value = v;
  // }
  // get lightProjectionMatrix(): Matrix4 {
  //   return this.uniforms.uLightProjectionMatrix.value;
  // }
  // set lightProjectionMatrix(v: Matrix4) {
  //   this.uniforms.uLightProjectionMatrix.value = v;
  // }
}

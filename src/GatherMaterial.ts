import {
  EqualStencilFunc,
  GLSL3,
  Matrix4,
  NotEqualStencilFunc,
  ShaderMaterial,
  Texture,
  Vector3,
  WebGLRenderTarget,
} from "three";

const SAMPLE_COUNT = 512;
const vertexShader = `
varying vec2 vUv;
void main () { 
  vUv = uv;
  gl_Position = vec4(position.xy,0.,1.);
}
`;
const fragmentShader = `
layout(location = 0) out vec4  outColor;

varying vec2 vUv;

uniform vec3 uPattern[${SAMPLE_COUNT}];

uniform sampler2D uRSMFlux;
uniform sampler2D uRSMNormal;
uniform sampler2D uRSMWorldPos;
uniform sampler2D uGBufferColor;
uniform sampler2D uGBufferNormal;
uniform sampler2D uGBufferWorldPos;

uniform float uSearchRadius;
uniform float uEdgeCorrection;

uniform mat4 uLightViewMatrix;
uniform mat4 uLightProjectionMatrix;

uniform float uLowResSize;

uniform bool uIsFullScreen;
uniform bool uShowInterpolation;

void main () { 
  //get cell centers for low res screen space
  vec2 screenLookup = vUv;
  if(!uIsFullScreen){
    vec2 pxUV = vUv * uLowResSize;
    vec2 pxUVfract = fract(pxUV);
    vec2 pxUVIndex = floor(pxUV);
    
    vec2 pxUVCenter = pxUVIndex + 0.5;
    screenLookup = pxUVCenter / uLowResSize;
  } 


  //get gBuffer data

  vec3 gNormal = texture2D(uGBufferNormal, screenLookup).xyz;
  vec3 gWorldPos = texture2D(uGBufferWorldPos, screenLookup).xyz;

  // get light projected position

  vec4 lp = uLightProjectionMatrix * uLightViewMatrix * vec4(gWorldPos,1.);
  lp /= lp.w;

  vec2 lightUV = lp.xy*0.5+0.5;
  
  vec3 result = vec3(0.);
  float weight = 0.;

  for ( int i = 0 ; i < ${SAMPLE_COUNT} ; i ++ ){
    vec3 rsmLookup = uPattern[i] * uSearchRadius;
    vec2 st = lightUV + rsmLookup.xy;

    if(st.x<0.||st.x>1.) continue;
    if(st.y<0.||st.y>1.) continue;
       
    vec3 rsmWorld =   texture2D(uRSMWorldPos,st).xyz;
    vec3 rsmFlux =    texture2D(uRSMFlux,    st).xyz;
    vec3 rsmNormal =  texture2D(uRSMNormal,  st).xyz;

    vec3 correctedWP = rsmWorld - rsmNormal * uEdgeCorrection;
    vec3 rsmToOrigin = gWorldPos - correctedWP;
    
    float dSQ = dot(rsmToOrigin,rsmToOrigin);

    float r = max(0.,dot(rsmNormal,rsmToOrigin)) * max(0.,dot(gNormal,-rsmToOrigin));
    rsmFlux *= r / (dSQ*dSQ);
    
    result += rsmFlux*rsmLookup.z;
    weight += 1.;
  }
  result/=weight;

  outColor = vec4(pow(result,vec3(0.5)),1.);

  if(uIsFullScreen){
    outColor.xyz += texture2D(uGBufferColor,vUv).xyz;
    if(uShowInterpolation){
      outColor.xyz = mix(outColor.xyz, vec3(1.,0.,0.),0.3);
    }
  }
}
`;
// const SIZE = 512;
export const PATTERN: Vector3[] = [];

for (let i = 0; i < SAMPLE_COUNT; i++) {
  const r = Math.random();

  const a = Math.random() * Math.PI * 2;

  const z = r * r;
  const x = Math.cos(a) * r;
  const y = Math.sin(a) * r;

  PATTERN.push(new Vector3(x, y, z));
}

export class GatherMaterialScreen extends ShaderMaterial {
  constructor(
    lowResSize: number,
    uLightViewMatrix: { value: Matrix4 },
    uLightProjectionMatrix: { value: Matrix4 },
    rsmTarget: WebGLRenderTarget,
    gBuffer: WebGLRenderTarget,
    uSearchRadius: { value: number },
    uEdgeCorrection: { value: number },
    isSecondPass = false
  ) {
    const {
      textures: [flux, normal, worldPosDepth],
    } = rsmTarget;
    const {
      textures: [gColor, gNormal, gWorldPos],
    } = gBuffer;
    super({
      vertexShader,
      fragmentShader,
      uniforms: {
        uLowResSize: { value: lowResSize },
        uRSMFlux: { value: flux },
        uRSMNormal: { value: normal },
        uRSMWorldPos: { value: worldPosDepth },
        uGBufferColor: { value: gColor },
        uGBufferNormal: { value: gNormal },
        uGBufferWorldPos: { value: gWorldPos },
        uShowInterpolation: { value: false },
        uPattern: { value: PATTERN },
        uIsFullScreen: { value: isSecondPass },
        uLightViewMatrix,
        uLightProjectionMatrix,
        uSearchRadius,
        uEdgeCorrection,
      },
      depthTest: false,
      depthWrite: false,
      glslVersion: GLSL3,
      stencilWrite: true,
      stencilRef: 1,
      stencilFunc: EqualStencilFunc,
    });
  }
  get radius(): number {
    return this.uniforms.uSearchRadius.value;
  }
  set radius(v: number) {
    this.uniforms.uSearchRadius.value = v;
  }
  get showInterpolation(): boolean {
    return this.uniforms.uShowInterpolation.value;
  }
  set showInterpolation(v: boolean) {
    this.uniforms.uShowInterpolation.value = v;
  }
}

const RAND = `
float rand(in float n){
  return fract(sin(n) * 43758.5453123);
}
float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}
float noise(in float p){
	float fl = floor(p);
  float fc = fract(p);
	return mix(rand(fl), rand(fl + 1.0), fc);
}
float noise(vec2 n) {
	const vec2 d = vec2(0.0, 1.0);
  vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
	return mix(
    mix(rand(b), rand(b + d.yx), f.x), 
    mix(rand(b + d.xy), rand(b + d.yy), f.x), 
    f.y
  );
}`;

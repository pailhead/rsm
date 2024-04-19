import {
  AlwaysStencilFunc,
  DecrementStencilOp,
  EqualStencilFunc,
  KeepStencilOp,
  MeshStandardMaterial,
  ReplaceStencilOp,
  ShaderMaterial,
  Texture,
  WebGLRenderTarget,
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

uniform sampler2D uMainGColor;
uniform sampler2D uMainGNormal;
uniform sampler2D uMainGWorldPos;
uniform sampler2D uLowResGNormal;
uniform sampler2D uLowResGWorldPos;
uniform sampler2D uLowResGI;

uniform float uNormalSimilarityThreshold;
uniform float uWPSimilarityThreshold;
uniform float uLowResSize;

bool checkSample (vec2 st, vec3 normal, vec3 wp){
  vec3 n = texture2D(uLowResGNormal,   st/uLowResSize).xyz;
  vec3 w = texture2D(uLowResGWorldPos, st/uLowResSize).xyz;
  vec3 d = wp - w;
  float lsq = dot(d,d);
  bool isNormalSimilar = dot(n,normal) > uNormalSimilarityThreshold;
  bool isWPSimilar = lsq < uWPSimilarityThreshold;
  return isNormalSimilar && isWPSimilar;
}

vec3 getRow(vec2 st, float row, float fraction, vec3 normal, vec3 wp){
  vec2 st0 = st + vec2(0.,row);
  vec2 st1 = st + vec2(1.,row);
  bool isSimilar0 = checkSample(st0, normal, wp);
  bool isSimilar1 = checkSample(st1, normal, wp);
  vec3 rowValue,a,b;
  if(isSimilar0){
    rowValue = a = texture2D(uLowResGI,st0/uLowResSize).xyz;
  }
  if(isSimilar1){
    rowValue = b = texture2D(uLowResGI,st1/uLowResSize).xyz;
  }
  if( isSimilar0 &&  isSimilar1) rowValue = mix(a,b,vec3(fraction));
  if(!isSimilar0 && !isSimilar1) rowValue = vec3(-1.);
  return rowValue;
}

void main (){
  
  vec2 pxUV = vUv * uLowResSize;
  vec2 pxUVFract = fract(pxUV);
  vec2 pxUVIndex = floor(pxUV);
  vec2 pxUVCenter = pxUVIndex + 0.5;

  vec3 gColor    = texture2D(uMainGColor,    vUv).xyz;
  vec3 gNormal   = texture2D(uMainGNormal,   vUv).xyz;
  vec3 gWorldPos = texture2D(uMainGWorldPos, vUv).xyz;

  vec3 bot = getRow(pxUVCenter,0.,pxUVFract.x,gNormal,gWorldPos);
  if(bot.x<0.) discard;
  
  vec3 top = getRow(pxUVCenter,1.,pxUVFract.x,gNormal,gWorldPos);
  if(top.x<0.) discard;

  gl_FragColor.xyz = gColor + mix(bot,top,vec3(pxUVFract.y)).xyz;
  gl_FragColor.w = 1.;
}
`;
export class InterpolateMaterial extends ShaderMaterial {
  constructor(
    mainGBuffer: WebGLRenderTarget,
    lowResGBuffer: WebGLRenderTarget,
    lowResGI: WebGLRenderTarget,
    uNormalSimilarityThreshold: { value: number },
    uWPSimilarityThreshold: { value: number },
    lowResSize: number
  ) {
    super({
      vertexShader,
      fragmentShader,
      uniforms: {
        uMainGColor: { value: mainGBuffer.textures[0] },
        uMainGNormal: { value: mainGBuffer.textures[1] },
        uMainGWorldPos: { value: mainGBuffer.textures[2] },
        uLowResGNormal: { value: lowResGBuffer.textures[1] },
        uLowResGWorldPos: { value: lowResGBuffer.textures[2] },
        uLowResGI: { value: lowResGI.texture },
        uNormalSimilarityThreshold,
        uWPSimilarityThreshold,
        uLowResSize: { value: lowResSize },
      },
      stencilRef: 1,
      stencilWrite: true,
      stencilFunc: EqualStencilFunc,
      stencilZPass: DecrementStencilOp,
      depthTest: false,
      depthWrite: false,
    });
  }
}

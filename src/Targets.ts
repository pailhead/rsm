import {
  WebGLRenderTarget,
  ClampToEdgeWrapping,
  NearestFilter,
  RGBAFormat,
  UnsignedByteType,
  FloatType,
} from "three";

export class Targets {
  //fixed size shadow map
  rsmMRT: WebGLRenderTarget;
  //render standard materials into this with attachments, color,normal,world pos
  lowResGBuffer: WebGLRenderTarget;
  //use low res g buffer and rsm mrt to compute GI at each pixel
  lowResGI: WebGLRenderTarget;

  //render main scene into this, it should have stencil, and share it
  mainGBuffer = new WebGLRenderTarget(1, 1, {
    magFilter: NearestFilter,
    minFilter: NearestFilter,
    count: 3,
    stencilBuffer: true,
  });

  //render quad into this, ignore depth, dont write depth, test stencil for 1 (shared with main G buffer)
  //compare g of main and g of low res GI and interpolate, if interpoalate, increment stencil

  //then, using the same stencil of 1 wher interpolation didnt pass, render quad with main g buffer and rsm
  //gather
  composition = new WebGLRenderTarget(1, 1, {
    magFilter: NearestFilter,
    minFilter: NearestFilter,
    stencilBuffer: true,
  });

  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    lowResolution: number,
    rsmResolution: number
  ) {
    const rsmMRT = new WebGLRenderTarget(rsmResolution, rsmResolution, {
      wrapS: ClampToEdgeWrapping,
      wrapT: ClampToEdgeWrapping,
      magFilter: NearestFilter,
      minFilter: NearestFilter,
      format: RGBAFormat,
      count: 3,
    });
    rsmMRT.textures[0].name = "flux";
    rsmMRT.textures[0].type = FloatType;
    rsmMRT.textures[1].name = "normal";
    rsmMRT.textures[1].type = FloatType;
    rsmMRT.textures[2].name = "worldPosDepth";
    rsmMRT.textures[2].type = FloatType;
    this.rsmMRT = rsmMRT;

    const lowResGBuffer = new WebGLRenderTarget(lowResolution, lowResolution, {
      magFilter: NearestFilter,
      minFilter: NearestFilter,
      count: 3,
      stencilBuffer: true,
    });
    lowResGBuffer.textures[0].name = "albedo";
    lowResGBuffer.textures[0].type = UnsignedByteType;
    lowResGBuffer.textures[1].name = "normal";
    lowResGBuffer.textures[1].type = FloatType;
    lowResGBuffer.textures[2].name = "worldPosition";
    lowResGBuffer.textures[2].type = FloatType;
    this.lowResGBuffer = lowResGBuffer;

    const lowResGI = new WebGLRenderTarget(lowResolution, lowResolution, {
      magFilter: NearestFilter,
      minFilter: NearestFilter,
      type: FloatType,
      stencilBuffer: true,
      // count: 3,
    });

    this.lowResGI = lowResGI;

    const lowResSharedDepthStencilBuffer = gl.createRenderbuffer();
    //@ts-ignore
    lowResGBuffer.outsideDepthBuffer = lowResSharedDepthStencilBuffer;
    //@ts-ignore
    lowResGI.outsideDepthBuffer = lowResSharedDepthStencilBuffer;

    const { mainGBuffer } = this;

    mainGBuffer.textures[0].name = "albedo";
    mainGBuffer.textures[0].type = UnsignedByteType;
    mainGBuffer.textures[1].name = "normal";
    mainGBuffer.textures[1].type = FloatType;
    mainGBuffer.textures[2].name = "worldPosDepth";
    mainGBuffer.textures[2].type = FloatType;

    const mainDepthStencilBuffer = gl.createRenderbuffer();
    //@ts-ignore
    mainGBuffer.outsideDepthBuffer = mainDepthStencilBuffer;
    //@ts-ignore
    this.composition.outsideDepthBuffer = mainDepthStencilBuffer;
  }

  setSize(width: number, height: number) {
    this.mainGBuffer.setSize(width, height);
    this.composition.setSize(width, height);
  }

  dispose() {
    this.rsmMRT.dispose();
    this.lowResGBuffer.dispose();
    this.lowResGI.dispose();
    this.mainGBuffer.dispose();
    this.composition.dispose();
  }
}

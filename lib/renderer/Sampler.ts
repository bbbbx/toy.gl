import defaultValue from "../core/defaultValue";
import defined from "../core/defined";
import TextureMagnificationFilter from "./TextureMagnificationFilter";
import TextureMinificationFilter from "./TextureMinificationFilter";
import TextureWrap from "./TextureWrap";

class Sampler {
  _wrapS: TextureWrap;
  _wrapT: TextureWrap;
  _minificationFilter: TextureMinificationFilter;
  _magnificationFilter: TextureMagnificationFilter;
  _maximumAnisotropy: number;

  static NEAREST = Object.freeze(new Sampler({
    wrapS: TextureWrap.CLAMP_TO_EDGE,
    wrapT: TextureWrap.CLAMP_TO_EDGE,
    minificationFilter: TextureMinificationFilter.NEAREST,
    magnificationFilter: TextureMagnificationFilter.NEAREST,
  }));

  constructor(options?: {
    wrapS?: TextureWrap,
    wrapT?: TextureWrap,
    minificationFilter?: TextureMinificationFilter,
    magnificationFilter?: TextureMagnificationFilter,
    maximumAnisotropy?: number
  }) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    const wrapS = defaultValue(options.wrapS, TextureWrap.CLAMP_TO_EDGE);
    const wrapT = defaultValue(options.wrapT, TextureWrap.CLAMP_TO_EDGE);
    const minificationFilter = defaultValue(options.minificationFilter, TextureMinificationFilter.LINEAR);
    const magnificationFilter = defaultValue(options.magnificationFilter, TextureMagnificationFilter.LINEAR);
    const maximumAnisotropy = defaultValue(options.maximumAnisotropy, 1.0);

    this._wrapS = wrapS;
    this._wrapT = wrapT;
    this._minificationFilter = minificationFilter;
    this._magnificationFilter = magnificationFilter;
    this._maximumAnisotropy = maximumAnisotropy;
  }

  public get wrapS() : TextureWrap {
    return this._wrapS;
  }
  public get wrapT() : TextureWrap {
    return this._wrapT;
  }
  public get minificationFilter() : TextureMinificationFilter {
    return this._minificationFilter;
  }
  public get magnificationFilter() : TextureMagnificationFilter {
    return this._magnificationFilter;
  }
  public get maximumAnisotropy() : number {
    return this._maximumAnisotropy;
  }

  static equals(left: Sampler, right: Sampler) {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        left._wrapS === right._wrapS &&
        left._wrapT === right._wrapT &&
        left._minificationFilter === right._minificationFilter &&
        left._magnificationFilter === right._magnificationFilter &&
        left._maximumAnisotropy === right._maximumAnisotropy)
    );
  }
}

export default Sampler;

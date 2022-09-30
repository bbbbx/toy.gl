const ESkyAtmosphereTransformMode = Object.freeze({
  /**
   * 行星表面位于世界坐标的原点
   */
  PlanetTopAtAbsoluteWorldOrigin: 0,
  /**
   * 行星表面位于组件的位置
   */
  PlanetTopAtComponentTransform: 1,
  /**
   * 行星中心位于组件的位置
   */
  PlanetCenterAtComponentTransform: 2,
});

export default ESkyAtmosphereTransformMode;


/**
 * @public
 */
const MMath = {
  EPSILON7: 1.0e-7,
  EPSILON21: 1.0e-21,
  RADIANS_PER_DEGREE: Math.PI / 180,
  DEGREES_PER_RADIAN: 180 / Math.PI,
  toRadians(degrees) {
    return this.RADIANS_PER_DEGREE * degrees;
  },
  toDegrees(radians) {
    return this.DEGREES_PER_RADIAN * radians;
  },
  clamp(value: number, min: number, max: number) : number {
    return Math.max( min, Math.min( max, value ) );
  }
};

export default MMath;

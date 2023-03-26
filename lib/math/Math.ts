
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
  },
  isPowerOfTwo(n: number): boolean {
    return n !== 0 && (n & (n - 1)) === 0;
  },
  nextPowerOfTwo(n: number) : number {
    // From http://graphics.stanford.edu/~seander/bithacks.html#RoundUpPowerOf2
    --n;
    n |= n >> 1;
    n |= n >> 2;
    n |= n >> 4;
    n |= n >> 8;
    n |= n >> 16;
    ++n;

    return n;
  },
  previousPowerOfTwo(n: number) : number {
    n |= n >> 1;
    n |= n >> 2;
    n |= n >> 4;
    n |= n >> 8;
    n |= n >> 16;
    n |= n >> 32;

    // The previous bitwise operations implicitly convert to signed 32-bit. Use `>>>` to convert to unsigned
    n = (n >>> 0) - (n >>> 1);

    return n;
  }
};

export default Object.freeze(MMath);

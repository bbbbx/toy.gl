function isPowerOfTwo(value) {
  return (value & (value - 1)) === 0;
}

export default isPowerOfTwo;

import Cartesian3 from "./Cartesian3";
import Matrix3 from "./Matrix3";


const fromRotationMatrixNext = [1, 2, 0];
const fromRotationMatrixQuat = new Array(3);

/**
 * @public
 */
class Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;

  static ZERO = Object.freeze(new Quaternion(0.0, 0.0, 0.0, 0.0));
  static IDENTITY = Object.freeze(new Quaternion(0.0, 0.0, 0.0, 1.0));

  constructor(x: number = 0.0, y: number = 0.0, z: number = 0.0, w: number = 0.0) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  static unpack(array: ArrayLike<number>, startingIndex = 0, result: Quaternion = new Quaternion()) : Quaternion {
    result.x = array[startingIndex + 0];
    result.y = array[startingIndex + 1];
    result.z = array[startingIndex + 2];
    result.w = array[startingIndex + 3];
    return result;
  }

  static clone(quaternion: Readonly<Quaternion>, result: Quaternion = new Quaternion()) : Quaternion {
    result.x = quaternion.x;
    result.y = quaternion.y;
    result.z = quaternion.z;
    result.w = quaternion.w;
    return result;
  }

  static magnitudeSquared(quaternion: Quaternion) : number {
    return (
      quaternion.x * quaternion.x +
      quaternion.y * quaternion.y +
      quaternion.z * quaternion.z +
      quaternion.w * quaternion.w
    );
  }

  static magnitude(quaternion: Quaternion) : number {
    return Math.sqrt(Quaternion.magnitudeSquared(quaternion));
  }

  static normalize(quaternion: Quaternion, result) : Quaternion {
    const length = Quaternion.magnitude(quaternion);
    if (length === 0.0) {
      result.x = 0.0;
      result.y = 0.0;
      result.z = 0.0;
      result.w = 1.0;
    } else {
      const inverseMagnitude = 1.0 / length;
      result.x = quaternion.x * inverseMagnitude;
      result.y = quaternion.y * inverseMagnitude;
      result.z = quaternion.z * inverseMagnitude;
      result.w = quaternion.w * inverseMagnitude;
    }

    return result;
  }

  static multiplyByScalar(quaternion: Quaternion, scalar: number, result: Quaternion) : Quaternion {
    result.x = quaternion.x * scalar;
    result.y = quaternion.y * scalar;
    result.z = quaternion.z * scalar;
    result.w = quaternion.w * scalar;
    return result;
  }

  static conjugate(quaternion: Quaternion, result: Quaternion) : Quaternion {
    result.x = - quaternion.x;
    result.y = - quaternion.y;
    result.z = - quaternion.z;
    result.w =   quaternion.w;
    return result;
  }

  static inverse(quaternion: Quaternion, result: Quaternion) : Quaternion {
    const magnitudeSquared = Quaternion.magnitudeSquared(quaternion);
    result = Quaternion.conjugate(quaternion, result);
    return Quaternion.multiplyByScalar(result, 1.0 / magnitudeSquared, result);
  }

  static dot(left: Quaternion, right: Quaternion) : number {
    return (
      left.x * right.x + left.y * right.y + left.z * right.z + left.w * right.w
    );
  }

  static fromRotationMatrix(matrix: Matrix3, result: Quaternion = new Quaternion()) : Quaternion {
    let root;
    let x;
    let y;
    let z;
    let w;

    const m00 = matrix[Matrix3.COLUMN0ROW0];
    const m11 = matrix[Matrix3.COLUMN1ROW1];
    const m22 = matrix[Matrix3.COLUMN2ROW2];
    const trace = m00 + m11 + m22;

    if (trace > 0.0) {
      // |w| > 1/2, may as well choose w > 1/2
      root = Math.sqrt(trace + 1.0); // 2w
      w = 0.5 * root;
      root = 0.5 / root; // 1/(4w)

      x = (matrix[Matrix3.COLUMN1ROW2] - matrix[Matrix3.COLUMN2ROW1]) * root;
      y = (matrix[Matrix3.COLUMN2ROW0] - matrix[Matrix3.COLUMN0ROW2]) * root;
      z = (matrix[Matrix3.COLUMN0ROW1] - matrix[Matrix3.COLUMN1ROW0]) * root;
    } else {
      // |w| <= 1/2
      const next = fromRotationMatrixNext;

      let i = 0;
      if (m11 > m00) {
        i = 1;
      }
      if (m22 > m00 && m22 > m11) {
        i = 2;
      }
      const j = next[i];
      const k = next[j];

      root = Math.sqrt(
        matrix[Matrix3.getElementIndex(i, i)] -
          matrix[Matrix3.getElementIndex(j, j)] -
          matrix[Matrix3.getElementIndex(k, k)] +
          1.0
      );

      const quat = fromRotationMatrixQuat;
      quat[i] = 0.5 * root;
      root = 0.5 / root;
      w =
        (matrix[Matrix3.getElementIndex(k, j)] -
          matrix[Matrix3.getElementIndex(j, k)]) *
        root;
      quat[j] =
        (matrix[Matrix3.getElementIndex(j, i)] +
          matrix[Matrix3.getElementIndex(i, j)]) *
        root;
      quat[k] =
        (matrix[Matrix3.getElementIndex(k, i)] +
          matrix[Matrix3.getElementIndex(i, k)]) *
        root;

      x = -quat[0];
      y = -quat[1];
      z = -quat[2];
    }

    result.x = x;
    result.y = y;
    result.z = z;
    result.w = w;
    return result;
  }

  public setFromUnitVectors(vFrom: Cartesian3, vTo: Cartesian3) : Quaternion {
    // assumes direction vectors vFrom and vTo are normalized
    let r = Cartesian3.dot(vFrom, vTo) + 1.0;

    if (r < Number.EPSILON) {
      // vFrom and vTo point in opposite directions

      r = 0.0;

      if (Math.abs(vFrom.x) > Math.abs(vFrom.z)) {
        this.x = - vFrom.y;
        this.y =   vFrom.x;
        this.z = 0.0;
        this.z = r;
      } else {
        this.x = 0;
        this.y = - vFrom.z;
        this.z =   vFrom.y;
        this.z = r;
      }

    } else {
      // cross(vFrom, vTo, this);

      this.x = vFrom.y * vTo.z - vFrom.z * vTo.y;
      this.y = vFrom.z * vTo.x - vFrom.x * vTo.z;
      this.z = vFrom.x * vTo.y - vFrom.y * vTo.x;
      this.w = r;
    }

    return Quaternion.normalize(this, this);
  }
}

export default Quaternion;

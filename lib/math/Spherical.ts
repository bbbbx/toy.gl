import Cartesian3 from "./Cartesian3";
import MMath from "./Math";

/**
 * The polar angle (phi) is measured from the positive y-axis. The positive y-axis is up.
 * The azimuthal angle (theta) is measured from the positive z-axis.
 * @public
 */
class Spherical {
  radius: number;
  phi: number;
  theta: number;

  constructor(radius = 1, phi = 0, theta = 0) {
    this.radius = radius;
    this.phi = phi;
    this.theta = theta;
  }

  set(radius: number, phi: number, theta: number) : Spherical {
    this.radius = radius;
    this.phi = phi;
    this.theta = theta;

    return this;
  }

  public setFromCartesianCoords(x: number, y: number, z: number) : Spherical {
    this.radius = Math.sqrt( x * x + y * y + z * z );

    if (this.radius === 0.0) {
      this.theta = 0.0;
      this.phi = 0.0;
    } else {
      this.theta = Math.atan2(x, z);
      this.phi = Math.acos( MMath.clamp(y / this.radius, -1.0, 1.0) );
    }

    return this;
  }

  public setFromCartesian3(v: Cartesian3) : Spherical {
    return this.setFromCartesianCoords( v.x, v.y, v.z );
  }

  /**
   * restrict phi to be betwee EPS and PI-EPS
   */
  public makeSafe() : Spherical {
    const EPS = 0.000001;
    this.phi = Math.max( EPS, Math.min( Math.PI - EPS, this.phi ) );

    return this;
  }
}

export default Spherical;

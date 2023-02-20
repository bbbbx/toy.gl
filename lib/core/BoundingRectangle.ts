/**
 * @public
 * A bounding rectangle given by a corner, width and height.
 */
class BoundingRectangle {
  x: number;
  y: number;
  width: number;
  height: number;

  /**
   * A bounding rectangle given by a corner, width and height.
   * @param x - The x coordinate of the rectangle.
   * @param y - The y coordinate of the rectangle.
   * @param width - The width of the rectangle.
   * @param height - The height of the rectangle.
   */
  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

export default BoundingRectangle;

export class NgxDraggableRect implements DOMRect {

  /* * * * * Internal Properties * * * * */
  public x: number;
  public y: number;
  public width: number;
  public height: number;

  /* * * * * Read Only Properties * * * * */

  /**
   * The left edge of the rectangle.
   */
  public get left(): number {
    if (this.width < 0) {
      return this.x + this.width;
    } else {
      return this.x;
    }
  }

  /**
   * The top edge of the rectangle.
   */
  public get top(): number {
    if (this.height < 0) {
      return this.y + this.height;
    } else {
      return this.y;
    }
  }

  /**
   * The right edge of the rectangle.
   */
  public get right(): number {
    if (this.width < 0) {
      return this.x;
    } else {
      return this.x + this.width;
    }
  }

  /**
   * The bottom edge of the rectangle.
   */
  public get bottom(): number {
    if (this.height < 0) {
      return this.y;
    } else {
      return this.y + this.height;
    }
  }

  /**
   * Receive the draggable rect in json format.
   */
  public get toJSON(): any {
    return {
      height: this.height,
      width: this.width,
      x: this.left,
      y: this.top,
    };
  }

  public constructor(x: number, y: number, width: number, height: number) {
    this.x = (!!x) ? x : 0;
    this.y = (!!y) ? y : 0;
    this.width = (!!width) ? width : 0;
    this.height = (!!height) ? height : 0;
  }

}

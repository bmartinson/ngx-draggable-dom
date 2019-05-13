/**
 * This object class represents a boundary check event that can be emitted by the directive indicating to the consumer
 * which edges are intersecting with the boundary defined to constrain the draggable element.
 */
export class NgxDraggableBoundsCheckEvent {

  public readonly top: boolean;
  public readonly right: boolean;
  public readonly bottom: boolean;
  public readonly left: boolean;

  /**
   * Read only property that indicates if one or more of the boundaries have been collided with.
   *
   * @return True if any of the boundaries are collided.
   */
  public get hasCollision(): boolean {
    return !!this.top || !!this.right || !!this.bottom || !!this.left;
  }

  constructor(top: boolean, right: boolean, bottom: boolean, left: boolean) {
    this.top = (!!top) ? top : false;
    this.right = (!!right) ? right : false;
    this.bottom = (!!bottom) ? bottom : false;
    this.left = (!!left) ? left : false;
  }

}

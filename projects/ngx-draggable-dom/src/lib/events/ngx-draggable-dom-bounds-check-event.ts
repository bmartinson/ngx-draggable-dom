import { NgxDraggablePoint } from '../classes/ngx-draggable-point';

/**
 * This object class represents a boundary check event that can be emitted by the directive indicating to the consumer
 * which edges are intersecting with the boundary defined to constrain the draggable element.
 */
export class NgxDraggableDomBoundsCheckEvent {
  public readonly top: boolean;
  public readonly right: boolean;
  public readonly bottom: boolean;
  public readonly left: boolean;
  public readonly constrainedCenter: NgxDraggablePoint | undefined;
  public readonly translation: NgxDraggablePoint;
  public readonly isConstrained: boolean;

  /**
   * Read only property that indicates if one or more of the boundaries have been collided with.
   *
   * @return True if any of the boundaries are collided.
   */
  public get hasCollision(): boolean {
    return !!this.top || !!this.right || !!this.bottom || !!this.left;
  }

  /**
   * Constructs the bounds check event with default properties.
   *
   * @param top Whether the top edge has been breached or not.
   * @param right Whether the right edge has been breached or not.
   * @param bottom Whether the bottom edge has been breached or not.
   * @param left Whether the left edge has been breached or not.
   * @param elP0 The center point of the element if it were to be constrained by these bounds.
   * @param translation The calculated translation from the starting point based on any bounds constraints.
   * @param isConstrained Whether the element should be constrained or not.
   */
  public constructor(
    top: boolean,
    right: boolean,
    bottom: boolean,
    left: boolean,
    elP0: NgxDraggablePoint,
    translation: NgxDraggablePoint,
    isConstrained: boolean
  ) {
    this.top = !!top ? top : false;
    this.right = !!right ? right : false;
    this.bottom = !!bottom ? bottom : false;
    this.left = !!left ? left : false;
    if (!!elP0) {
      this.constrainedCenter = elP0;
    }
    this.translation = !!translation ? translation : new NgxDraggablePoint(0, 0);
    this.isConstrained = !!isConstrained ? isConstrained : false;
  }
}

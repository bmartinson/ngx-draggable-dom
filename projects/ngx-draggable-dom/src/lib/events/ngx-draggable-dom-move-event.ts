import { NgxDraggablePoint } from "../classes/ngx-draggable-point";

/**
 * This object class represents a move event that can be emitted by the directive indicating to the consumer
 * the position of the target element.
 */
export class NgxDraggableDomMoveEvent {

  private _target: HTMLElement;
  private _position: NgxDraggablePoint;

  /**
   * Read only property that indicates what element is being moved.
   *
   * @return The reference to the HTMLElement being moved.
   */
  public get target(): HTMLElement {
    return this.target;
  }

  /**
   * Read only property that indicates the position of the element.
   *
   * @return The position of the target element as a NgxDraggablePoint.
   */
  public get position(): NgxDraggablePoint {
    return this._position;
  }

  /**
   * Constructs the move event with specified property values.
   *
   * @param target The target HTMLElement that was moved.
   * @param position The position of the target HTMLElement.
   */
  constructor(target: HTMLElement, position: NgxDraggablePoint) {
    if (!!target) {
      this._target = target;
    }

    if (!!position) {
      this._position = position;
    }
  }

}

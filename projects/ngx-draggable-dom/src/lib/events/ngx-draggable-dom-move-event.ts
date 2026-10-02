import { NgxDraggablePoint } from '../classes/ngx-draggable-point';

/**
 * This object class represents a move event that can be emitted by the directive indicating to the consumer
 * the position of the target element.
 */
export class NgxDraggableDomMoveEvent {
  private _target: HTMLElement | undefined;
  private _position: NgxDraggablePoint | undefined;
  private _dropTarget: Element | null;

  /**
   * Read only property that indicates what element is being moved.
   *
   * @return The reference to the HTMLElement being moved.
   */
  public get target(): HTMLElement | undefined {
    return this._target;
  }

  /**
   * Read only property that indicates the position of the element.
   *
   * @return The position of the target element as a NgxDraggablePoint.
   */
  public get position(): NgxDraggablePoint | undefined {
    return this._position;
  }

  /**
   * The element beneath the release pointer; only populated for stopped events.
   */
  public get dropTarget(): Element | null {
    return this._dropTarget;
  }

  /**
   * Constructs the move event with specified property values.
   *
   * @param target The target HTMLElement that was moved.
   * @param position The position of the target HTMLElement.
   * @param dropTarget The element beneath the dragged element at the release pointer.
   */
  public constructor(target: HTMLElement, position: NgxDraggablePoint, dropTarget: Element | null = null) {
    this._target = target || undefined;
    this._position = position || undefined;
    this._dropTarget = dropTarget;
  }
}

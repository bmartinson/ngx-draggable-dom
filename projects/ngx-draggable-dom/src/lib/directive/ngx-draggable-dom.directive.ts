import {
  ChangeDetectorRef,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnInit,
  Output,
  Renderer2,
  ViewRef,
} from '@angular/core';
import { NgxDraggablePoint } from '../classes/ngx-draggable-point';
import { NgxDraggableRect } from '../classes/ngx-draggable-rect';
import { NgxDraggableDomBoundsCheckEvent } from '../events/ngx-draggable-dom-bounds-check-event';
import { NgxDraggableDomMoveEvent } from '../events/ngx-draggable-dom-move-event';
import { ElementHandle, NgxDraggableMath } from '../helpers/ngx-draggable-dom-math';
import { NgxDraggableDomUtilities } from '../helpers/ngx-draggable-dom-utilities';

@Directive({
  selector: '[ngxDraggableDom]',
})
export class NgxDraggableDomDirective implements OnInit {

  private static MAX_SAFE_Z_INDEX = 16777271;

  @Input() public bounds: HTMLElement | undefined;
  @Input() public constrainByBounds: boolean;
  @Output() private started: EventEmitter<NgxDraggableDomMoveEvent>;
  @Output() private stopped: EventEmitter<NgxDraggableDomMoveEvent>;
  @Output() private moved: EventEmitter<NgxDraggableDomMoveEvent>;
  @Output() private edge: EventEmitter<NgxDraggableDomBoundsCheckEvent>;
  @Input() private handle: HTMLElement | undefined;
  @Input() private requireMouseOver: boolean;
  @Input() private requireMouseOverBounds: boolean;

  private allowDrag: boolean;
  private moving: boolean;
  private computedRotation: number;
  private startPosition: NgxDraggablePoint | null;
  private pickUpOffset: NgxDraggablePoint;
  private oldZIndex: string;
  private oldPosition: string;
  private fnMouseMove: ((event: MouseEvent) => void) | undefined;
  private fnTouchMove: ((event: TouchEvent | any) => void) | undefined;
  private fnMouseUp: ((event: MouseEvent) => void) | undefined;
  private fnTouchEnd: ((event: TouchEvent | any) => void) | undefined;

  /**
   * Controls the draggable behavior of the element that the NgxDraggableDirective is applied to.
   *
   * @param enabled Whether the draggable behavior should be turned on or off.
   */
  @Input()
  public set ngxDraggableDom(enabled: boolean) {
    // if no value is provided for the attribute directive name, then turn it on by default
    if (enabled === undefined || enabled === null) {
      enabled = true;
    }

    if (this.allowDrag !== !!enabled) {
      // update the draggable state
      this.allowDrag = !!enabled;

      // get the element that will be used to make the element draggable
      const draggableControl: HTMLElement = this.handle ? this.handle : this.el.nativeElement;

      // if we are allowed to drag, provide the draggable class, otherwise remove it
      if (this.allowDrag) {
        this.renderer.addClass(draggableControl, 'ngx-draggable');
      } else {
        this.renderer.removeClass(draggableControl, 'ngx-draggable');
      }

      // update the view
      this.ngDetectChanges();
    }
  }

  /**
   * Controls the draggable behavior of the element that the NgxDraggableDirective is applied to.
   *
   * @return True if the element is draggable.
   */
  public get ngxDraggableDom(): boolean {
    return !!this.allowDrag;
  }

  /**
   * Read only property that returns the width of the element in a normalized 0 degree rotation orientation.
   *
   * @return The true width of the element.
   */
  private get elWidth(): number {
    if (!this.el.nativeElement) {
      return 0;
    }

    return this.el.nativeElement.offsetWidth;
  }

  /**
   * Read only property that returns the height of the element in a normalized 0 degree rotation orientation.
   *
   * @return The true height of the element.
   */
  private get elHeight(): number {
    if (!this.el.nativeElement) {
      return 0;
    }

    return this.el.nativeElement.offsetHeight;
  }

  /**
   * Calculates and returns the element's center point based on the element's bounding rectangle.
   *
   * @return A NgxDraggablePoint that represents the center point of the element.
   */
  private get elCenter(): NgxDraggablePoint | null {
    if (!this.el.nativeElement) {
      return null;
    }

    // get the bounding box of the element
    const elBounds: ClientRect = (this.el.nativeElement as HTMLElement).getBoundingClientRect();

    return new NgxDraggablePoint(
      this.scrollLeft + elBounds.left + (elBounds.width / 2),
      this.scrollTop + elBounds.top + (elBounds.height / 2),
    );
  }

  /**
   * Calculates and returns the bounds' center point based on the bounding element's bounding rectangle.
   *
   * @return A NgxDraggablePoint that represents the center point of the bounds.
   */
  private get boundsCenter(): NgxDraggablePoint | null {
    if (!this.bounds) {
      return null;
    }

    // get the bounding box of the element
    const boundsBounds: ClientRect = (this.bounds as HTMLElement).getBoundingClientRect();

    return new NgxDraggablePoint(
      this.scrollLeft + boundsBounds.left + (boundsBounds.width / 2),
      this.scrollTop + boundsBounds.top + (boundsBounds.height / 2),
    );
  }

  /**
   * Read only property that calculates the left scroll position of the document.
   *
   * @return The current scroll position of the document in the x direction.
   */
  private get scrollLeft(): number {
    if (!!window) {
      return window.pageXOffset;
    } else if (!!document && !!document.documentElement) {
      return document.documentElement.scrollLeft;
    } else {
      return 0;
    }
  }

  /**
   * Read only property that calculates the top scroll position of the document.
   *
   * @return The current scroll position of the document in the y direction.
   */
  private get scrollTop(): number {
    if (!!window) {
      return window.pageYOffset;
    } else if (!!document && !!document.documentElement) {
      return document.documentElement.scrollTop;
    } else {
      return 0;
    }
  }

  public constructor(
    @Inject(ElementRef) private el: ElementRef,
    @Inject(Renderer2) private renderer: Renderer2,
    @Inject(ChangeDetectorRef) private changeRef: ChangeDetectorRef,
  ) {
    this.started = new EventEmitter<NgxDraggableDomMoveEvent>();
    this.stopped = new EventEmitter<NgxDraggableDomMoveEvent>();
    this.moved = new EventEmitter<NgxDraggableDomMoveEvent>();
    this.edge = new EventEmitter<NgxDraggableDomBoundsCheckEvent>();

    this.constrainByBounds = this.requireMouseOver = this.requireMouseOverBounds = this.moving = false;
    this.allowDrag = true;
    this.oldZIndex = this.oldPosition = '';
    this.computedRotation = 0;
    this.startPosition = new NgxDraggablePoint(0, 0);
    this.pickUpOffset = new NgxDraggablePoint(0, 0);
  }

  /**
   * Event handler for when the element starts moving via mouse interaction.
   *
   * @param event The mouse event for the click event.
   */
  @HostListener('mousedown', ['$event'])
  private onMouseDown(event: MouseEvent): void {
    // stop all default behavior and propagation of the event so it is fully consumed by us
    event.stopImmediatePropagation();

    // prevent the default mouse behavior on images so that browser image dragging is disabled
    if (event.target instanceof HTMLImageElement) {
      event.preventDefault();
    }

    // skip right clicks and clicks on the element if it can only be moved by the handle
    if (event.button === 2 || (this.handle !== undefined && event.target !== this.handle)) {
      return;
    }

    // pick up the element for dragging
    this.pickUp(event);
  }

  /**
   * Event handler for when the mouse leaves the element so the drag event ends.
   *
   * @param event The mouse event for when the mouse leaves the element.
   */
  @HostListener('mouseleave', ['$event'])
  private onMouseLeave(event: MouseEvent): void {
    // stop all default behavior and propagation of the event so it is fully consumed by us
    event.stopImmediatePropagation();

    // prevent the default mouse behavior on images so that browser image dragging is disabled
    if (event.target instanceof HTMLImageElement) {
      event.preventDefault();
    }

    // if the user is required to keep the mouse over the element, put it back
    if (this.requireMouseOver) {
      this.putBack();
    }
  }

  /**
   * Event handler for when the element starts moving via a touch event.
   *
   * @param event The touch event to handle as a TouchEvent (or any solely for working around issues with Safari).
   */
  @HostListener('touchstart', ['$event'])
  private onTouchStart(event: TouchEvent | any): void {
    // stop all default behavior and propagation of the event so it is fully consumed by us
    event.stopImmediatePropagation();

    // prevent the default mouse behavior on images so that browser image dragging is disabled
    if (event.target instanceof HTMLImageElement) {
      event.preventDefault();
    }

    if (this.handle !== undefined && event.target !== this.handle) {
      return;
    }

    this.pickUp(event);
  }

  /* * * * * Public Lifecycle Hooks * * * * */

  /**
   * Angular lifecycle hook for initialization that ensures that the draggable class is applied to the element.
   */
  public ngOnInit(): void {
    if (this.allowDrag) {
      this.renderer.addClass(this.handle ? this.handle : this.el.nativeElement, 'ngx-draggable');

      // update the view
      this.ngDetectChanges();
    }
  }

  /* * * * * Publicly Accessible Draggable Hooks * * * * */

  /**
   * Resets the state of the element. This will reset all positioning and movement data
   * but will not modify the current state of any data bound properties.
   */
  public reset(): void {
    this.moving = false;
    this.oldZIndex = this.oldPosition = '';

    // reset the computed rotation
    this.computedRotation = 0;

    // make sure the start position offset is reset
    this.pickUpOffset.x = this.pickUpOffset.y = 0;

    // reset the transform value on the nativeElement
    this.renderer.removeStyle(this.el.nativeElement, '-webkit-transform');
    this.renderer.removeStyle(this.el.nativeElement, '-ms-transform');
    this.renderer.removeStyle(this.el.nativeElement, '-moz-transform');
    this.renderer.removeStyle(this.el.nativeElement, '-o-transform');
    this.renderer.removeStyle(this.el.nativeElement, 'transform');

    // update the view
    this.ngDetectChanges();
  }

  /**
   * Invoked the Angular change detector to ensure that changes to the element's styling are reflected in the view.
   */
  private ngDetectChanges(): void {
    if (this.changeRef && !(this.changeRef as ViewRef).destroyed) {
      this.changeRef.detectChanges();
    }
  }

  /* * * * * Event Handlers * * * * */

  /**
   * Event handler for when the element is done being dragged as indicated by a mouse release.
   *
   * @param event The mouse event for the click release event.
   */
  private onMouseUp(event: MouseEvent): void {
    // stop all default behavior and propagation of the event so it is fully consumed by us
    event.stopImmediatePropagation();

    // prevent the default mouse behavior on images so that browser image dragging is disabled
    if (event.target instanceof HTMLImageElement) {
      event.preventDefault();
    }

    this.putBack();
  }

  /**
   * Event handler for when the mouse moves. If the element is currently picked up, then we will apply transformations
   * to the element to move it.
   *
   * @param event The mouse event for the movement from the user's mouse.
   */
  private onMouseMove(event: MouseEvent): void {
    // stop all default behavior and propagation of the event so it is fully consumed by us
    event.stopImmediatePropagation();

    // prevent the default mouse behavior on images so that browser image dragging is disabled
    if (event.target instanceof HTMLImageElement) {
      event.preventDefault();
    }

    // define the position of the mouse event
    const mousePoint: NgxDraggablePoint | null = new NgxDraggablePoint(this.scrollLeft + event.clientX, this.scrollTop + event.clientY);

    if (this.moving && this.allowDrag && this.allowMovementForPosition(mousePoint)) {
      // perform the move operation
      this.moveTo(event.clientX - this.pickUpOffset.x, event.clientY - this.pickUpOffset.y);
    }
  }

  /**
   * Event handler for when the element is done being moved via a touch event.
   *
   * @param event The touch event to handle as a TouchEvent (or any solely for working around issues with Safari).
   */
  private onTouchEnd(event: TouchEvent | any): void {
    // stop all default behavior and propagation of the event so it is fully consumed by us
    event.stopImmediatePropagation();

    // prevent the default mouse behavior on images so that browser image dragging is disabled
    if (event.target instanceof HTMLImageElement) {
      event.preventDefault();
    }

    this.putBack();
  }

  /**
   * Event handler for when the element is moved via a touch event.
   *
   * @param event The touch event to handle as a TouchEvent (or any solely for working around issues with Safari).
   */
  private onTouchMove(event: TouchEvent | any): void {
    // stop all default behavior and propagation of the event so it is fully consumed by us
    event.stopImmediatePropagation();

    // prevent the default mouse behavior on images so that browser image dragging is disabled
    if (event.target instanceof HTMLImageElement) {
      event.preventDefault();
    }

    // define the position of the touch event
    const touchPoint: NgxDraggablePoint | null = new NgxDraggablePoint(
      this.scrollLeft + event.changedTouches[0].clientX,
      this.scrollTop + event.changedTouches[0].clientY,
    );

    // perform the move operation if we are moving, allowing dragging, and the event is within the bounds
    if (this.moving && this.allowDrag && this.allowMovementForPosition(touchPoint)) {
      this.moveTo(event.changedTouches[0].clientX - this.pickUpOffset.x, event.changedTouches[0].clientY - this.pickUpOffset.y);
    }
  }

  /* * * * * Draggable Logic * * * * */

  /**
   * Checks to see if a given point, that should represent the user's mouse position, resides within
   * the bounds if they are defined and we are both checking for bounds constraints and if we are configured
   * to hold the object steady when constrained and the cursor is outside of the bounds.
   *
   * @param point The point to check to see if it is inside of the boundaries
   */
  private allowMovementForPosition(point: NgxDraggablePoint): boolean {
    if (!this.bounds || !this.constrainByBounds || !this.requireMouseOverBounds) {
      return true;
    }

    // generate the bounds dimensional information
    const boundsWidth: number = this.bounds.offsetWidth;
    const boundsHeight: number = this.bounds.offsetHeight;
    const boundsRotation: number = NgxDraggableDomUtilities.getRotationForElement(this.bounds);
    const boundsP0: NgxDraggablePoint | null = this.boundsCenter;

    // guard against null responses
    if (!boundsP0) {
      return false;
    }

    // generate the top left point position of the rotated bounds so we can understand it's true placement
    let boundsTL: NgxDraggablePoint | null = NgxDraggableMath.getTransformedCoordinate(
      boundsP0,
      boundsWidth,
      boundsHeight,
      boundsRotation,
      ElementHandle.TL,
    );

    // guard against null responses
    if (!boundsTL) {
      return false;
    }

    // we must now rotate the point by the negative direction of the bounds rotation so we can analyze in a 0 degree normalized space
    boundsTL = NgxDraggableMath.rotatePoint(boundsTL, boundsP0, -boundsRotation);

    // construct a rectangle that represents the position of the boundary in a normalized space
    const checkBounds: ClientRect = new NgxDraggableRect(boundsTL.x, boundsTL.y, boundsWidth, boundsHeight);

    // calculate if the point is inside of the bounds
    const isPointInside: boolean = NgxDraggableMath.isPointInsideBounds(point, checkBounds);

    return isPointInside;
  }

  /**
   * Moves the element to a specified coordinate and performs any necessary boundary checking.
   *
   * @param x The x position to move the element to.
   * @param y The y position to move the element to.
   */
  private moveTo(x: number, y: number): void {
    let boundsCheck: NgxDraggableDomBoundsCheckEvent | null | undefined;
    let transform: string;
    let translation: NgxDraggablePoint = new NgxDraggablePoint(0, 0);

    // create the numerical matrix we will use
    const matrix: number[] = NgxDraggableDomUtilities.getTransformMatrixForElement(this.el.nativeElement);

    // factor in the scroll position of the page for the position of the drag
    x += this.scrollLeft;
    y += this.scrollTop;

    // extract translation data from the matrix in the rotated context and add our movement to it
    translation.x = matrix[4];
    translation.y = matrix[5];

    // rotate the translation in the opposite direction of the computed parent rotation to normalize
    translation = NgxDraggableMath.rotatePoint(translation, new NgxDraggablePoint(0, 0), -this.computedRotation);

    // calculate the original position at the start of this drag
    const dragPosition: NgxDraggablePoint = new NgxDraggablePoint(
      (this.startPosition ? this.startPosition.x : 0) + translation.x,
      (this.startPosition ? this.startPosition.y : 0) + translation.y,
    );

    // calculate the new position
    dragPosition.x += x - dragPosition.x;
    dragPosition.y += y - dragPosition.y;

    // update the normalized translation to represent the new transfer
    translation.x = dragPosition.x - (this.startPosition ? this.startPosition.x : 0);
    translation.y = dragPosition.y - (this.startPosition ? this.startPosition.y : 0);

    // return the normalized translation back to the appropriate space
    translation = NgxDraggableMath.rotatePoint(translation, new NgxDraggablePoint(0, 0), -this.computedRotation);

    // if the element is to be constrained by the bounds, we must check the bounds for the element
    if (this.constrainByBounds) {
      // check the bounds based on the element position
      boundsCheck = this.boundsCheck(new NgxDraggablePoint(
        dragPosition.x,
        dragPosition.y,
      ));

      // hold the element in position if we are requested to be constrained
      if (boundsCheck && boundsCheck.isConstrained) {
        // update the translation using the constrained center point and bounds center
        translation = boundsCheck.translation;
      }
    }

    // if it is possible, get the transform from the computed style and modify the matrix to maintain transform properties
    if (window) {
      // update the x and y values as part of the matrix
      matrix[4] = translation.x;
      matrix[5] = translation.y;

      // convert the matrix to a string based css matrix definition
      transform = 'matrix(' + matrix.join() + ')';

      // set the style on the element
      this.renderer.setStyle(this.el.nativeElement, 'transform', transform);
      this.renderer.setStyle(this.el.nativeElement, '-webkit-transform', transform);
      this.renderer.setStyle(this.el.nativeElement, '-ms-transform', transform);
      this.renderer.setStyle(this.el.nativeElement, '-moz-transform', transform);
      this.renderer.setStyle(this.el.nativeElement, '-o-transform', transform);
    } else {
      // set up the translation transform for all possible browser styles disregarding previous transform properties
      transform = `translate(${translation.x}px, ${translation.y}px)`;
      this.renderer.setStyle(this.el.nativeElement, 'transform', transform);
      this.renderer.setStyle(this.el.nativeElement, '-webkit-transform', transform);
      this.renderer.setStyle(this.el.nativeElement, '-ms-transform', transform);
      this.renderer.setStyle(this.el.nativeElement, '-moz-transform', transform);
      this.renderer.setStyle(this.el.nativeElement, '-o-transform', transform);
    }

    // emit the output of the bounds check
    if (boundsCheck) {
      this.edge.emit(boundsCheck);
    }

    // emit the current translation
    this.moved.emit(new NgxDraggableDomMoveEvent(this.el.nativeElement as HTMLElement, translation));

    // update the view
    this.ngDetectChanges();
  }

  /**
   * Puts the element into a state of being moved setting appropriate styles and firing movement events when
   * the element is just beginning to move. Here is where the start position and pick up offset is calculated.
   *
   * @param event The pick up event that will either be a mouse event or touch event.
   */
  private pickUp(event: MouseEvent | TouchEvent | any): void {
    let matrix: number[];
    const translation: NgxDraggablePoint = new NgxDraggablePoint(0, 0);
    const elCenter: NgxDraggablePoint | null = this.elCenter;

    // set a default position style
    let position = 'relative';

    // get old z-index and position based on the direct style access
    this.oldZIndex = this.el.nativeElement.style.zIndex ? this.el.nativeElement.style.zIndex : '';
    this.oldPosition = this.el.nativeElement.style.position ? this.el.nativeElement.style.position : '';

    // fetch the old z-index and position from computing the style applied to the element
    if (window) {
      this.oldZIndex = window.getComputedStyle(
        this.el.nativeElement,
        null,
      ).getPropertyValue('z-index');
      this.oldPosition = window.getComputedStyle(
        this.el.nativeElement,
        null,
      ).getPropertyValue('position');
    }

    // check if old position is draggable
    if (this.oldPosition && (
      this.oldPosition === 'absolute' ||
      this.oldPosition === 'fixed' ||
      this.oldPosition === 'relative'
    )
    ) {
      position = this.oldPosition;
    }

    // set the position and z-index for when the object is in a dragging state
    this.renderer.setStyle(this.el.nativeElement, 'position', position);
    this.renderer.setStyle(this.el.nativeElement, 'z-index', String(NgxDraggableDomDirective.MAX_SAFE_Z_INDEX));

    // if we are not moving yet, emit the event to signal moving is beginning and start moving
    if (!this.moving) {
      // create references to the functions
      this.fnMouseMove = this.onMouseMove.bind(this);
      this.fnTouchMove = this.onTouchMove.bind(this);
      this.fnMouseUp = this.onMouseUp.bind(this);
      this.fnTouchEnd = this.onTouchEnd.bind(this);

      // start listening for movement
      document.addEventListener('mousemove', this.fnMouseMove);
      document.addEventListener('touchmove', this.fnTouchMove);
      document.addEventListener('mouseup', this.fnMouseUp);
      document.addEventListener('touchend', this.fnTouchEnd);

      // get the bounds center for rotating
      const boundsCenter: NgxDraggablePoint | null = this.boundsCenter;

      // set the start position based on the element
      this.startPosition = elCenter;

      // guard against no starting position
      if (!this.startPosition) {
        return;
      }

      // compute the current rotation of all parent nodes
      this.computedRotation = NgxDraggableDomUtilities.getTotalRotationForElement(this.el.nativeElement.parentElement);

      // normalize the start position for the rotation
      this.startPosition = NgxDraggableMath.rotatePoint(
        this.startPosition,
        (!!boundsCenter) ? boundsCenter : new NgxDraggablePoint(0, 0),
        -this.computedRotation,
      );

      // get the current transformation matrix and extract the current translation
      matrix = NgxDraggableDomUtilities.getTransformMatrixForElement(this.el.nativeElement);
      translation.x = matrix[4];
      translation.y = matrix[5];

      // translate it back to the start position
      this.startPosition.x -= translation.x;
      this.startPosition.y -= translation.y;

      // reapply the rotation to the start position
      this.startPosition = NgxDraggableMath.rotatePoint(
        this.startPosition,
        (!!boundsCenter) ? boundsCenter : new NgxDraggablePoint(0, 0),
        this.computedRotation,
      );

      // calculate the offset position of the mouse compared to the element center
      this.pickUpOffset.x = this.scrollLeft + event.clientX - this.startPosition.x;
      this.pickUpOffset.y = this.scrollTop + event.clientY - this.startPosition.y;

      // fire the event to signal that the element has begun moving
      this.started.emit(new NgxDraggableDomMoveEvent(this.el.nativeElement as HTMLElement, translation));

      // flag that we are now in a state of movement
      this.moving = true;

      // add the ngx-dragging class to the element we're interacting with
      this.renderer.addClass(this.handle ? this.handle : this.el.nativeElement, 'ngx-dragging');
    }

    // update the view
    this.ngDetectChanges();
  }

  /**
   * Puts the element element down following some movement. This will fire the stopped event to signal that
   * dragging is complete.
   */
  private putBack(): void {
    if (this.oldZIndex) {
      this.renderer.setStyle(this.el.nativeElement, 'z-index', this.oldZIndex);
    } else {
      this.el.nativeElement.style.removeProperty('z-index');
    }

    // if we are currently moving, then we can successfully put down to signal some movement actually occurred
    if (this.moving) {
      // stop listening for movement
      if (this.fnMouseMove) {
        document.removeEventListener('mousemove', this.fnMouseMove);
      }
      if (this.fnTouchMove) {
        document.removeEventListener('touchmove', this.fnTouchMove);
      }
      if (this.fnMouseUp) {
        document.removeEventListener('mouseup', this.fnMouseUp);
      }
      if (this.fnTouchEnd) {
        document.removeEventListener('touchend', this.fnTouchEnd);
      }

      // get the current transformation matrix and extract the current translation
      const matrix: number[] = NgxDraggableDomUtilities.getTransformMatrixForElement(this.el.nativeElement);
      const translation: NgxDraggablePoint = new NgxDraggablePoint(matrix[4], matrix[5]);

      // reset the offset
      this.pickUpOffset.x = this.pickUpOffset.y = 0;

      // emit that we have stopped moving
      this.stopped.emit(new NgxDraggableDomMoveEvent(this.el.nativeElement as HTMLElement, translation));

      // if the user wants bounds checking, do a check and emit the boundaries if bounds have been hit
      if (this.bounds) {
        // get the current center point of the element
        const elCenter: NgxDraggablePoint | null = this.elCenter;

        if (!!elCenter) {
          // check the bounds based on the element position
          const boundsCheck: NgxDraggableDomBoundsCheckEvent | null = this.boundsCheck(elCenter);

          // emit the edge event so consumers know the current state of the position
          if (!!boundsCheck) {
            this.edge.emit(boundsCheck);
          }
        }
      }

      // mark that we are no longer moving
      this.moving = false;

      // remove the ng-dragging class to the element we're interacting with
      this.renderer.removeClass(this.handle ? this.handle : this.el.nativeElement, 'ngx-dragging');
    }

    // reset the calculated rotation in case something changes when we're not dragging
    this.computedRotation = 0;

    // update the view
    this.ngDetectChanges();
  }

  /**
   * Uses the defined boundary element and checks for an intersection with the draggable element to determine
   * if any edge has collided with one another. If the edge is collided and we are constraining, we calculate a new translation value
   * and constrained center point so we can position the element reliably within the bounds.
   *
   * @param elP0 The center point of the element position that boundaries should be checked on.
   * @param isSecondaryBoundsCheck Optional parameter that indicates whether we are the secondary bounds check.
   * @return A NgxDraggableDomBoundsCheckEvent indicating which boundary edges were violated or null if boundary check is disabled.
   */
  private boundsCheck(elP0: NgxDraggablePoint, isSecondaryBoundsCheck?: boolean): NgxDraggableDomBoundsCheckEvent | null {
    // don"t perform the bounds checking if the user has not requested it
    if (!this.bounds || !this.startPosition) {
      return null;
    }

    // generate the bounds dimensional information
    const boundsWidth: number = this.bounds.offsetWidth;
    const boundsHeight: number = this.bounds.offsetHeight;
    const boundsRotation: number = NgxDraggableDomUtilities.getRotationForElement(this.bounds);
    const boundsP0: NgxDraggablePoint | null = this.boundsCenter;

    // guard against null points
    if (!boundsP0) {
      return null;
    }

    // generate the top left point position of the rotated bounds so we can understand it's true placement
    let boundsTL: NgxDraggablePoint | null = NgxDraggableMath.getTransformedCoordinate(
      boundsP0,
      boundsWidth,
      boundsHeight,
      boundsRotation,
      ElementHandle.TL,
    );

    // guard against null points
    if (!boundsTL) {
      return null;
    }

    // we must now rotate the point by the negative direction of the bounds rotation so we can analyze in a 0 degree normalized space
    boundsTL = NgxDraggableMath.rotatePoint(boundsTL, boundsP0, -boundsRotation);

    // construct a rectangle that represents the position of the boundary in a normalized space
    const checkBounds: ClientRect = new NgxDraggableRect(boundsTL.x, boundsTL.y, boundsWidth, boundsHeight);

    // generate the elements dimensional information
    const elWidth: number = this.elWidth;
    const elHeight: number = this.elHeight;
    const elRotation: number = NgxDraggableDomUtilities.getTotalRotationForElement(this.el.nativeElement);
    const normalizedElP0: NgxDraggablePoint = NgxDraggableMath.rotatePoint(elP0, boundsP0, -boundsRotation);

    // generate all four points of the element that we will need to check
    let elTL: NgxDraggablePoint | null = NgxDraggableMath.getTransformedCoordinate(elP0, elWidth, elHeight, elRotation, ElementHandle.TL);
    let elTR: NgxDraggablePoint | null = NgxDraggableMath.getTransformedCoordinate(elP0, elWidth, elHeight, elRotation, ElementHandle.TR);
    let elBR: NgxDraggablePoint | null = NgxDraggableMath.getTransformedCoordinate(elP0, elWidth, elHeight, elRotation, ElementHandle.BR);
    let elBL: NgxDraggablePoint | null = NgxDraggableMath.getTransformedCoordinate(elP0, elWidth, elHeight, elRotation, ElementHandle.BL);

    // guard against invalid points
    if (!elTL || !elTR || !elBR || !elBL) {
      return null;
    }

    // we must now rotate each point by the negative direction of the bounds rotation so we can analyze in a 0 degree normalized space
    elTL = NgxDraggableMath.rotatePoint(elTL, boundsP0, -boundsRotation);
    elTR = NgxDraggableMath.rotatePoint(elTR, boundsP0, -boundsRotation);
    elBR = NgxDraggableMath.rotatePoint(elBR, boundsP0, -boundsRotation);
    elBL = NgxDraggableMath.rotatePoint(elBL, boundsP0, -boundsRotation);

    // check to see if any of the points reside outside of the bounds
    const isTLOutside = !NgxDraggableMath.isPointInsideBounds(elTL, checkBounds);
    const isTROutside = !NgxDraggableMath.isPointInsideBounds(elTR, checkBounds);
    const isBROutside = !NgxDraggableMath.isPointInsideBounds(elBR, checkBounds);
    const isBLOutside = !NgxDraggableMath.isPointInsideBounds(elBL, checkBounds);

    // check each boundary line for being crossed
    const isTopEdgeCollided: boolean = isTLOutside && elTL.y <= checkBounds.top ||
      isTROutside && elTR.y <= checkBounds.top ||
      isBROutside && elBR.y <= checkBounds.top ||
      isBLOutside && elBL.y <= checkBounds.top;
    const isRightEdgeCollided: boolean = isTLOutside && elTL.x >= (checkBounds.left + checkBounds.width) ||
      isTROutside && elTR.x >= (checkBounds.left + checkBounds.width) ||
      isBROutside && elBR.x >= (checkBounds.left + checkBounds.width) ||
      isBLOutside && elBL.x >= (checkBounds.left + checkBounds.width);
    const isBottomEdgeCollided: boolean = isTLOutside && elTL.y >= (checkBounds.top + checkBounds.height) ||
      isTROutside && elTR.y >= (checkBounds.top + checkBounds.height) ||
      isBROutside && elBR.y >= (checkBounds.top + checkBounds.height) ||
      isBLOutside && elBL.y >= (checkBounds.top + checkBounds.height);
    const isLeftEdgeCollided: boolean = isTLOutside && elTL.x <= checkBounds.left ||
      isTROutside && elTR.x <= checkBounds.left ||
      isBROutside && elBR.x <= checkBounds.left ||
      isBLOutside && elBL.x <= checkBounds.left;

    // define variables to store the displacement of the element to constrain it within the bounds
    let displaceX: number | null | undefined;
    let displaceY: number | null | undefined;
    let greatestConstrainDistance: number;
    let constrainPoint: NgxDraggablePoint | null | undefined;

    // if we are to constrain by the bounds, calculate the displacement of the element to keep it within the bounds
    if (!!this.constrainByBounds && isTopEdgeCollided || isRightEdgeCollided || isBottomEdgeCollided || isLeftEdgeCollided) {
      // calculate the constraining displacement if the element fits within the width of the bounds
      if (elWidth < boundsWidth) {
        if (isRightEdgeCollided) {
          greatestConstrainDistance = 0;

          // determine which collision point we're going to constrain with
          if (isTLOutside && elTL.x >= (checkBounds.left + checkBounds.width)) {
            constrainPoint = new NgxDraggablePoint(elTL.x, elTL.y);
            greatestConstrainDistance = NgxDraggableMath.getDistanceBetweenPoints(elTL, boundsP0);
          }
          if (isTROutside && elTR.x >= (checkBounds.left + checkBounds.width) &&
            NgxDraggableMath.getDistanceBetweenPoints(elTR, boundsP0) > greatestConstrainDistance
          ) {
            constrainPoint = new NgxDraggablePoint(elTR.x, elTR.y);
            greatestConstrainDistance = NgxDraggableMath.getDistanceBetweenPoints(elTR, boundsP0);
          }
          if (isBROutside && elBR.x >= (checkBounds.left + checkBounds.width) &&
            NgxDraggableMath.getDistanceBetweenPoints(elBR, boundsP0) > greatestConstrainDistance
          ) {
            constrainPoint = new NgxDraggablePoint(elBR.x, elBR.y);
            greatestConstrainDistance = NgxDraggableMath.getDistanceBetweenPoints(elBR, boundsP0);
          }
          if (isBLOutside && elBL.x >= (checkBounds.left + checkBounds.width) &&
            NgxDraggableMath.getDistanceBetweenPoints(elBL, boundsP0) > greatestConstrainDistance
          ) {
            constrainPoint = new NgxDraggablePoint(elBL.x, elBL.y);
            greatestConstrainDistance = NgxDraggableMath.getDistanceBetweenPoints(elBL, boundsP0);
          }

          // calculate the displacement
          displaceX = checkBounds.left + checkBounds.width - (constrainPoint ? constrainPoint.x : 0);
        } else if (isLeftEdgeCollided) {
          greatestConstrainDistance = 0;

          // determine which collision point we're going to constrain with
          if (isTLOutside && elTL.x <= checkBounds.left) {
            constrainPoint = new NgxDraggablePoint(elTL.x, elTL.y);
            greatestConstrainDistance = NgxDraggableMath.getDistanceBetweenPoints(elTL, boundsP0);
          }
          if (
            isTROutside && elTR.x <= checkBounds.left &&
            NgxDraggableMath.getDistanceBetweenPoints(elTR, boundsP0) > greatestConstrainDistance
          ) {
            constrainPoint = new NgxDraggablePoint(elTR.x, elTR.y);
            greatestConstrainDistance = NgxDraggableMath.getDistanceBetweenPoints(elTR, boundsP0);
          }
          if (
            isBROutside && elBR.x <= checkBounds.left &&
            NgxDraggableMath.getDistanceBetweenPoints(elBR, boundsP0) > greatestConstrainDistance
          ) {
            constrainPoint = new NgxDraggablePoint(elBR.x, elBR.y);
            greatestConstrainDistance = NgxDraggableMath.getDistanceBetweenPoints(elBR, boundsP0);
          }
          if (
            isBLOutside && elBL.x <= checkBounds.left &&
            NgxDraggableMath.getDistanceBetweenPoints(elBL, boundsP0) > greatestConstrainDistance
          ) {
            constrainPoint = new NgxDraggablePoint(elBL.x, elBL.y);
            greatestConstrainDistance = NgxDraggableMath.getDistanceBetweenPoints(elBL, boundsP0);
          }

          // calculate the displacement
          displaceX = checkBounds.left - (constrainPoint ? constrainPoint.x : 0);
        }
      }

      // calculate the constraining displacement if the element fits within the height of the bounds
      if (elHeight < boundsHeight) {
        if (isBottomEdgeCollided) {
          greatestConstrainDistance = 0;

          // determine which collision point we're going to constrain with
          if (isTLOutside && elTL.y >= (checkBounds.top + checkBounds.height)) {
            constrainPoint = new NgxDraggablePoint(elTL.x, elTL.y);
            greatestConstrainDistance = NgxDraggableMath.getDistanceBetweenPoints(elTL, boundsP0);
          }
          if (isTROutside && elTR.y >= (checkBounds.top + checkBounds.height) &&
            NgxDraggableMath.getDistanceBetweenPoints(elTR, boundsP0) > greatestConstrainDistance
          ) {
            constrainPoint = new NgxDraggablePoint(elTR.x, elTR.y);
            greatestConstrainDistance = NgxDraggableMath.getDistanceBetweenPoints(elTR, boundsP0);
          }
          if (isBROutside && elBR.y >= (checkBounds.top + checkBounds.height) &&
            NgxDraggableMath.getDistanceBetweenPoints(elBR, boundsP0) > greatestConstrainDistance
          ) {
            constrainPoint = new NgxDraggablePoint(elBR.x, elBR.y);
            greatestConstrainDistance = NgxDraggableMath.getDistanceBetweenPoints(elBR, boundsP0);
          }
          if (isBLOutside && elBL.y >= (checkBounds.top + checkBounds.height) &&
            NgxDraggableMath.getDistanceBetweenPoints(elBL, boundsP0) > greatestConstrainDistance
          ) {
            constrainPoint = new NgxDraggablePoint(elBL.x, elBL.y);
            greatestConstrainDistance = NgxDraggableMath.getDistanceBetweenPoints(elBL, boundsP0);
          }

          // calculate the displacement
          displaceY = checkBounds.top + checkBounds.height - (constrainPoint ? constrainPoint.y : 0);
        } else if (isTopEdgeCollided) {
          greatestConstrainDistance = 0;

          // determine which collision point we're going to constrain with
          if (isTLOutside && elTL.y <= checkBounds.top) {
            constrainPoint = new NgxDraggablePoint(elTL.x, elTL.y);
            greatestConstrainDistance = NgxDraggableMath.getDistanceBetweenPoints(elTL, boundsP0);
          }
          if (
            isTROutside && elTR.y <= checkBounds.top &&
            NgxDraggableMath.getDistanceBetweenPoints(elTR, boundsP0) > greatestConstrainDistance
          ) {
            constrainPoint = new NgxDraggablePoint(elTR.x, elTR.y);
            greatestConstrainDistance = NgxDraggableMath.getDistanceBetweenPoints(elTR, boundsP0);
          }
          if (
            isBROutside && elBR.y <= checkBounds.top &&
            NgxDraggableMath.getDistanceBetweenPoints(elBR, boundsP0) > greatestConstrainDistance
          ) {
            constrainPoint = new NgxDraggablePoint(elBR.x, elBR.y);
            greatestConstrainDistance = NgxDraggableMath.getDistanceBetweenPoints(elBR, boundsP0);
          }
          if (
            isBLOutside && elBL.y <= checkBounds.top &&
            NgxDraggableMath.getDistanceBetweenPoints(elBL, boundsP0) > greatestConstrainDistance
          ) {
            constrainPoint = new NgxDraggablePoint(elBL.x, elBL.y);
            greatestConstrainDistance = NgxDraggableMath.getDistanceBetweenPoints(elBL, boundsP0);
          }

          // calculate the displacement
          displaceY = checkBounds.top - (constrainPoint ? constrainPoint.y : 0);
        }
      }
    }

    // calculate the constrained position without rotating back
    const normalizedConstrainedElP0: NgxDraggablePoint | null = new NgxDraggablePoint(
      normalizedElP0.x + ((displaceX !== undefined && displaceX !== null) ? displaceX : 0),
      normalizedElP0.y + ((displaceY !== undefined && displaceY !== null) ? displaceY : 0),
    );

    if (!this.boundsCenter) {
      return null;
    }

    // normalize the start position for translation arithmetic
    const normalizedStartPosition: NgxDraggablePoint | null = NgxDraggableMath.rotatePoint(
      this.startPosition,
      this.boundsCenter,
      -boundsRotation,
    );

    // displace the normalized element center
    const constrainedElP0: NgxDraggablePoint | null = NgxDraggableMath.rotatePoint(
      normalizedConstrainedElP0,
      boundsP0,
      boundsRotation,
    );

    // calculate the difference for each direction from the start position
    const translation: NgxDraggablePoint | null = new NgxDraggablePoint(
      normalizedConstrainedElP0.x - (normalizedStartPosition ? normalizedStartPosition.x : 0),
      normalizedConstrainedElP0.y - (normalizedStartPosition ? normalizedStartPosition.y : 0),
    );

    // guard against invalid points
    if (!constrainedElP0) {
      return null;
    }

    // if the bounds check will constrain the object, confirm that the constrained position is not colliding in another area
    if ((displaceX !== undefined || displaceY !== undefined) && !isSecondaryBoundsCheck) {
      const constrainedBoundsCheck: NgxDraggableDomBoundsCheckEvent | null = this.boundsCheck(constrainedElP0, true);
      if (constrainedBoundsCheck?.isConstrained) {
        return constrainedBoundsCheck;
      }
    }

    // return the bounds checking for this original pass
    return new NgxDraggableDomBoundsCheckEvent(
      isTopEdgeCollided,
      isRightEdgeCollided,
      isBottomEdgeCollided,
      isLeftEdgeCollided,
      constrainedElP0,
      translation,
      displaceX !== undefined || displaceY !== undefined,
    );
  }

}

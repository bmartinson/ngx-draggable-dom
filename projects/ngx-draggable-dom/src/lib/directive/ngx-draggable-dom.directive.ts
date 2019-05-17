import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  OnInit,
  Output,
  Renderer2,
  ChangeDetectorRef,
  ViewRef,
} from "@angular/core";
import { NgxDraggableBoundsCheckEvent } from "../classes/ngx-draggable-bounds-check-event";
import { NgxDraggableMoveEvent } from "../classes/ngx-draggable-move-event";
import {
  isPointInsideBounds,
  getTransformedCoordinate,
  rotatePoint,
  ElementHandle,
} from "../helpers/ngx-draggable-dom-math";
import { getRotationForElement, getTotalRotationForElement, getTransformMatrixForElement } from "../helpers/ngx-draggable-dom-utilities";

const MAX_SAFE_Z_INDEX = 16777271;

@Directive({
  selector: "[ngxDraggableDom]",
})
export class NgxDraggableDomDirective implements OnInit {

  @Output() private started: EventEmitter<NgxDraggableMoveEvent>;
  @Output() private stopped: EventEmitter<NgxDraggableMoveEvent>;
  @Output() private moved: EventEmitter<NgxDraggableMoveEvent>;
  @Output() private edge: EventEmitter<NgxDraggableBoundsCheckEvent>;

  @Input() private handle: HTMLElement;
  @Input() private bounds: HTMLElement;
  @Input() private constrainByBounds: boolean;

  private allowDrag: boolean;
  private moving: boolean;
  private computedRotation: number;
  private startPosition: DOMPoint;
  private oldZIndex: string;
  private oldPosition: string;

  /**
   * Controls the draggable behavior of the element that the NgxDraggableDirective is applied to.
   *
   * @param enabled Whether the draggable behavior should be turned on or off.
   */
  @Input("ngxDraggableDom")
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
        this.renderer.addClass(draggableControl, "ngx-draggable");
      } else {
        this.renderer.removeClass(draggableControl, "ngx-draggable");
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
   * @return A DOMPoint that represents the center point of the element.
   */
  private get elCenter(): DOMPoint | null {
    if (!this.el.nativeElement) {
      return null;
    }

    // get the bounding box of the element
    const elBounds: ClientRect = (this.el.nativeElement as HTMLElement).getBoundingClientRect();

    return new DOMPoint(
      this.scrollLeft + elBounds.left + (elBounds.width / 2),
      this.scrollTop + elBounds.top + (elBounds.height / 2),
    );
  }

  /**
   * Calculates and returns the bounds' center point based on the bounding element's bounding rectangle.
   *
   * @return A DOMPoint that represents the center point of the bounds.
   */
  private get boundsCenter(): DOMPoint | null {
    if (!this.bounds) {
      return null;
    }

    // get the bounding box of the element
    const boundsBounds: ClientRect = (this.bounds as HTMLElement).getBoundingClientRect();

    return new DOMPoint(
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

  constructor(
    @Inject(ElementRef) private el: ElementRef,
    @Inject(Renderer2) private renderer: Renderer2,
    @Inject(ChangeDetectorRef) private changeRef: ChangeDetectorRef,
  ) {
    this.started = new EventEmitter<NgxDraggableMoveEvent>();
    this.stopped = new EventEmitter<NgxDraggableMoveEvent>();
    this.moved = new EventEmitter<NgxDraggableMoveEvent>();
    this.edge = new EventEmitter<NgxDraggableBoundsCheckEvent>();

    this.constrainByBounds = this.moving = false;
    this.allowDrag = true;
    this.oldZIndex = this.oldPosition = "";
    this.computedRotation = 0;
    this.startPosition = new DOMPoint(0, 0);
  }

  /**
   * Angular lifecycle hook for initialization that ensures that the draggable class is applied to the element.
   */
  public ngOnInit(): void {
    if (this.allowDrag) {
      this.renderer.addClass(this.handle ? this.handle : this.el.nativeElement, "ngx-draggable");

      // update the view
      this.ngDetectChanges();
    }
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
   * Event handler for when the element starts moving via mouse interaction.
   *
   * @param event The mouse event for the click event.
   */
  @HostListener("mousedown", ["$event"])
  private onMouseDown(event: MouseEvent): void {
    // stop all default behavior and propagation of the event so it is fully consumed by us
    event.stopImmediatePropagation();
    event.preventDefault();

    // skip right clicks and clicks on the element if it can only be moved by the handle
    if (event.button === 2 || (this.handle !== undefined && event.target !== this.handle)) {
      return;
    }

    // pick up the element for dragging
    this.pickUp();
  }

  /**
   * Event handler for when the element is done being dragged as indicated by a mouse release.
   *
   * @param event The mouse event for the click release event.
   */
  @HostListener("mouseup", ["$event"])
  private onMouseUp(event: MouseEvent): void {
    // stop all default behavior and propagation of the event so it is fully consumed by us
    event.stopImmediatePropagation();
    event.preventDefault();

    this.putBack();
  }

  /**
   * Event handler for when the mouse leaves the element so the drag event ends.
   *
   * @param event The mouse event for when the mouse leaves the element.
   */
  @HostListener("mouseleave", ["$event"])
  private onMouseLeave(event: MouseEvent): void {
    // stop all default behavior and propagation of the event so it is fully consumed by us
    event.stopImmediatePropagation();
    event.preventDefault();

    this.putBack();
  }

  /**
   * Event handler for when the mouse moves. If the element is currently picked up, then we will apply transformations
   * to the element to move it.
   *
   * @param event The mouse event for the movement from the user's mouse.
   */
  @HostListener("mousemove", ["$event"])
  private onMouseMove(event: MouseEvent): void {
    // stop all default behavior and propagation of the event so it is fully consumed by us
    event.stopImmediatePropagation();
    event.preventDefault();

    if (this.moving && this.allowDrag) {
      // perform the move operation
      this.moveTo(event.clientX, event.clientY);
    }
  }

  /**
   * Event handler for when the element starts moving via a touch event.
   *
   * @param event The touch event to handle as a TouchEvent (or any solely for working around issues with Safari).
   */
  @HostListener("touchstart", ["$event"])
  private onTouchStart(event: TouchEvent | any): void {
    // stop all default behavior and propagation of the event so it is fully consumed by us
    event.stopImmediatePropagation();
    event.preventDefault();

    if (this.handle !== undefined && event.target !== this.handle) {
      return;
    }

    this.pickUp();
  }

  /**
   * Event handler for when the element is done being moved via a touch event.
   *
   * @param event The touch event to handle as a TouchEvent (or any solely for working around issues with Safari).
   */
  @HostListener("touchend", ["$event"])
  private onTouchEnd(event: TouchEvent | any): void {
    // stop all default behavior and propagation of the event so it is fully consumed by us
    event.stopImmediatePropagation();
    event.preventDefault();

    this.putBack();
  }

  /**
   * Event handler for when the element is moved via a touch event.
   *
   * @param event The touch event to handle as a TouchEvent (or any solely for working around issues with Safari).
   */
  @HostListener("touchmove", ["$event"])
  private onTouchMove(event: TouchEvent | any): void {
    // stop all default behavior and propagation of the event so it is fully consumed by us
    event.stopImmediatePropagation();
    event.preventDefault();

    if (this.moving && this.allowDrag) {
      // perform the move operation
      this.moveTo(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    }
  }

  /* * * * * Draggable Logic * * * * */

  /**
   * Resets the state of the element. This will reset all positioning and movement data
   * but will not modify the current state of any data bound properties.
   */
  public reset(): void {
    this.moving = false;
    this.oldZIndex = this.oldPosition = "";

    // reset the computed rotation
    this.computedRotation = 0;

    // reset the transform value on the nativeElement
    this.renderer.removeStyle(this.el.nativeElement, "-webkit-transform");
    this.renderer.removeStyle(this.el.nativeElement, "-ms-transform");
    this.renderer.removeStyle(this.el.nativeElement, "-moz-transform");
    this.renderer.removeStyle(this.el.nativeElement, "-o-transform");
    this.renderer.removeStyle(this.el.nativeElement, "transform");

    // update the view
    this.ngDetectChanges();
  }

  /**
   * Moves the element to a specified coordinate and performs any necessary boundary checking.
   *
   * @param x The x position to move the element to.
   * @param y The y position to move the element to.
   */
  private moveTo(x: number, y: number): void {
    let boundsCheck: NgxDraggableBoundsCheckEvent;
    let matrix: number[];
    let transform: string;
    let translation: DOMPoint = new DOMPoint(0, 0);

    // factor in the scroll position of the page for the position of the drag
    x += this.scrollLeft;
    y += this.scrollTop;

    // create the numerical matrix we will use
    matrix = getTransformMatrixForElement(this.el.nativeElement);

    // extract translation data from the matrix in the rotated context and add our movement to it
    translation.x = matrix[4];
    translation.y = matrix[5];

    // rotate the translation in the opposite direction of the computed parent rotation to normalize
    translation = rotatePoint(translation, new DOMPoint(0, 0), -this.computedRotation);

    // calculate the original position at the start of this drag
    const dragPosition: DOMPoint = new DOMPoint(
      this.startPosition.x + translation.x,
      this.startPosition.y + translation.y,
    );

    // calculate the new position
    dragPosition.x += x - dragPosition.x;
    dragPosition.y += y - dragPosition.y;

    // update the normalized translation to represent the new transfer
    translation.x = dragPosition.x - this.startPosition.x;
    translation.y = dragPosition.y - this.startPosition.y;

    // return the normalized translation back to the appropriate space
    translation = rotatePoint(translation, new DOMPoint(0, 0), -this.computedRotation);

    // if the element is to be constrained by the bounds, we must check the bounds for the element
    if (this.constrainByBounds) {
      // check the bounds based on the element position
      boundsCheck = this.boundsCheck(new DOMPoint(
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
      transform = "matrix(" + matrix.join() + ")";

      // set the style on the element
      this.renderer.setStyle(this.el.nativeElement, "transform", transform);
      this.renderer.setStyle(this.el.nativeElement, "-webkit-transform", transform);
      this.renderer.setStyle(this.el.nativeElement, "-ms-transform", transform);
      this.renderer.setStyle(this.el.nativeElement, "-moz-transform", transform);
      this.renderer.setStyle(this.el.nativeElement, "-o-transform", transform);
    } else {
      // set up the translation transform for all possible browser styles disregarding previous transform properties
      transform = `translate(${translation.x}px, ${translation.y}px)`;
      this.renderer.setStyle(this.el.nativeElement, "transform", transform);
      this.renderer.setStyle(this.el.nativeElement, "-webkit-transform", transform);
      this.renderer.setStyle(this.el.nativeElement, "-ms-transform", transform);
      this.renderer.setStyle(this.el.nativeElement, "-moz-transform", transform);
      this.renderer.setStyle(this.el.nativeElement, "-o-transform", transform);
    }

    // emit the output of the bounds check
    if (boundsCheck) {
      this.edge.emit(boundsCheck);
    }

    // emit the current translation
    this.moved.emit(new NgxDraggableMoveEvent(this.el.nativeElement as HTMLElement, translation));

    // update the view
    this.ngDetectChanges();

    // clean up memory
    boundsCheck = matrix = transform = translation = null;
  }

  /**
   * Puts the element into a state of being moved setting appropriate styles and firing movement events when
   * the element is just beginning to move.
   */
  private pickUp(): void {
    let matrix: number[];
    let translation: DOMPoint = new DOMPoint(0, 0);

    // set a default position style
    let position = "relative";

    // get old z-index and position based on the direct style access
    this.oldZIndex = this.el.nativeElement.style.zIndex ? this.el.nativeElement.style.zIndex : "";
    this.oldPosition = this.el.nativeElement.style.position ? this.el.nativeElement.style.position : "";

    // fetch the old z-index and position from computing the style applied to the element
    if (window) {
      this.oldZIndex = window.getComputedStyle(
        this.el.nativeElement,
        null,
      ).getPropertyValue("z-index");
      this.oldPosition = window.getComputedStyle(
        this.el.nativeElement,
        null,
      ).getPropertyValue("position");
    }

    // check if old position is draggable
    if (this.oldPosition && (
        this.oldPosition === "absolute" ||
        this.oldPosition === "fixed" ||
        this.oldPosition === "relative"
      )
    ) {
      position = this.oldPosition;
    }

    // set the position and z-index for when the object is in a dragging state
    this.renderer.setStyle(this.el.nativeElement, "position", position);
    this.renderer.setStyle(this.el.nativeElement, "z-index", String(MAX_SAFE_Z_INDEX));

    // if we are not moving yet, emit the event to signal moving is beginning and start moving
    if (!this.moving) {
      // get the bounds rotation for normalizing the position
      const boundsRotation: number = getRotationForElement(this.bounds);

      // get the bounds center for rotating
      let boundsCenter: DOMPoint = this.boundsCenter;

      // set the start position based on the element
      this.startPosition = this.elCenter;

      // compute the current rotation of all parent nodes
      this.computedRotation = getTotalRotationForElement(this.el.nativeElement.parentElement);

      // normalize the start position for the rotation
      this.startPosition = rotatePoint(this.startPosition, (!!boundsCenter) ? boundsCenter : new DOMPoint(0, 0), -this.computedRotation);

      // get the current transformation matrix and extract the current translation
      matrix = getTransformMatrixForElement(this.el.nativeElement);
      translation.x = matrix[4];
      translation.y = matrix[5];

      // translate it back to the start position
      this.startPosition.x -= translation.x;
      this.startPosition.y -= translation.y;

      // reapply the rotation to the start position
      this.startPosition = rotatePoint(this.startPosition, (!!boundsCenter) ? boundsCenter : new DOMPoint(0, 0), this.computedRotation);

      // fire the event to signal that the element has begun moving
      this.started.emit(new NgxDraggableMoveEvent(this.el.nativeElement as HTMLElement, translation));

      // flag that we are now in a state of movement
      this.moving = true;

      // add the ngx-dragging class to the element we're interacting with
      this.renderer.addClass(this.handle ? this.handle : this.el.nativeElement, "ngx-dragging");

      // clean up memory from in this scope
      boundsCenter = null;
    }

    // update the view
    this.ngDetectChanges();

    // clean up memory
    matrix = translation = position = null;
  }

  /**
   * Puts the element element down following some movement. This will fire the stopped event to signal that
   * dragging is complete.
   */
  private putBack(): void {
    if (this.oldZIndex) {
      this.renderer.setStyle(this.el.nativeElement, "z-index", this.oldZIndex);
    } else {
      this.el.nativeElement.style.removeProperty("z-index");
    }

    // if we are currently moving, then we can successfully put down to signal some movement actually occurred
    if (this.moving) {
      // get the current transformation matrix and extract the current translation
      let matrix: number[] = getTransformMatrixForElement(this.el.nativeElement);
      let translation: DOMPoint = new DOMPoint(matrix[4], matrix[5]);

      // emit that we have stopped moving
      this.stopped.emit(new NgxDraggableMoveEvent(this.el.nativeElement as HTMLElement, translation));

      // if the user wants bounds checking, do a check and emit the boundaries if bounds have been hit
      if (this.bounds) {
        // get the current center point of the element
        const elCenter: DOMPoint = this.elCenter;

        if (!!elCenter) {
          // check the bounds based on the element position
          const boundsCheck: NgxDraggableBoundsCheckEvent = this.boundsCheck(elCenter);

          // emit the edge event so consumers know the current state of the position
          if (!!boundsCheck) {
            this.edge.emit(boundsCheck);
          }
        }
      }

      // mark that we are no longer moving
      this.moving = false;

      // remove the ng-dragging class to the element we're interacting with
      this.renderer.removeClass(this.handle ? this.handle : this.el.nativeElement, "ngx-dragging");

      // clean up memory
      matrix = translation = null;
    }

    // reset the calculated rotation in case something changes when we're not dragging
    this.computedRotation = 0;

    // update the view
    this.ngDetectChanges();
  }

  /**
   * Uses the defined boundary element and checks for an intersection with the draggable element to determine
   * if any edge has collided with one another.
   *
   * @param elP0 The center point of the element position that boundaries should be checked on.
   * @return A NgxDraggableBoundsCheckEvent indicating which boundary edges were violated or null if boundary check is disabled.
   */
  private boundsCheck(elP0: DOMPoint): NgxDraggableBoundsCheckEvent | null {
    // don"t perform the bounds checking if the user has not requested it
    if (!this.bounds) {
      return null;
    }

    // generate the bounds dimensional information
    let boundsWidth: number = this.bounds.offsetWidth;
    let boundsHeight: number = this.bounds.offsetHeight;
    let boundsRotation: number = getRotationForElement(this.bounds);
    let boundsP0: DOMPoint = this.boundsCenter;

    // generate the top left point position of the rotated bounds so we can understand it's true placement
    let boundsTL: DOMPoint = getTransformedCoordinate(boundsP0, boundsWidth, boundsHeight, boundsRotation, ElementHandle.TL);

    // we must now rotate the point by the negative direction of the bounds rotation so we can analyze in a 0 degree normalized space
    boundsTL = rotatePoint(boundsTL, boundsP0, -boundsRotation);

    // construct a rectangle that represents the position of the boundary in a normalized space
    let checkBounds: DOMRect = new DOMRect(boundsTL.x, boundsTL.y, boundsWidth, boundsHeight);

    // generate the elements dimensional information
    let elWidth: number = this.elWidth;
    let elHeight: number = this.elHeight;
    let elRotation: number = getTotalRotationForElement(this.el.nativeElement);
    let normalizedElP0: DOMPoint = rotatePoint(elP0, boundsP0, -boundsRotation);

    // generate all four points of the element that we will need to check
    let elTL: DOMPoint = getTransformedCoordinate(elP0, elWidth, elHeight, elRotation, ElementHandle.TL);
    let elTR: DOMPoint = getTransformedCoordinate(elP0, elWidth, elHeight, elRotation, ElementHandle.TR);
    let elBR: DOMPoint = getTransformedCoordinate(elP0, elWidth, elHeight, elRotation, ElementHandle.BR);
    let elBL: DOMPoint = getTransformedCoordinate(elP0, elWidth, elHeight, elRotation, ElementHandle.BL);

    // we must now rotate each point by the negative direction of the bounds rotation so we can analyze in a 0 degree normalized space
    elTL = rotatePoint(elTL, boundsP0, -boundsRotation);
    elTR = rotatePoint(elTR, boundsP0, -boundsRotation);
    elBR = rotatePoint(elBR, boundsP0, -boundsRotation);
    elBL = rotatePoint(elBL, boundsP0, -boundsRotation);

    // check to see if any of the points reside outside of the bounds
    let isTLOutside: boolean = !isPointInsideBounds(elTL, checkBounds);
    let isTROutside: boolean = !isPointInsideBounds(elTR, checkBounds);
    let isBROutside: boolean = !isPointInsideBounds(elBR, checkBounds);
    let isBLOutside: boolean = !isPointInsideBounds(elBL, checkBounds);

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
    let displaceX: number;
    let displaceY: number;
    let constrainPoint: DOMPoint;

    // if we are to constrain by the bounds, calculate the displacement of the element to keep it within the bounds
    if (!!this.constrainByBounds && isTopEdgeCollided || isRightEdgeCollided || isBottomEdgeCollided || isLeftEdgeCollided) {
      // calculate the constraining displacement if the element fits within the width of the bounds
      if (elWidth < boundsWidth) {
        if (isRightEdgeCollided) {
          // determine which collision point we're going to constrain with
          if (isTLOutside && elTL.x >= (checkBounds.left + checkBounds.width)) {
            constrainPoint = new DOMPoint(elTL.x, elTL.y);
          } else if (isTROutside && elTR.x >= (checkBounds.left + checkBounds.width)) {
            constrainPoint = new DOMPoint(elTR.x, elTR.y);
          } else if (isBROutside && elBR.x >= (checkBounds.left + checkBounds.width)) {
            constrainPoint = new DOMPoint(elBR.x, elBR.y);
          } else if (isBLOutside && elBL.x >= (checkBounds.left + checkBounds.width)) {
            constrainPoint = new DOMPoint(elBL.x, elBL.y);
          }

          // calculate the displacement
          displaceX = checkBounds.x + checkBounds.width - constrainPoint.x;
        } else if (isLeftEdgeCollided) {
          // determine which collision point we're going to constrain with
          if (isTLOutside && elTL.x <= checkBounds.left) {
            constrainPoint = new DOMPoint(elTL.x, elTL.y);
          } else if (isTROutside && elTR.x <= checkBounds.left) {
            constrainPoint = new DOMPoint(elTR.x, elTR.y);
          } else if (isBROutside && elBR.x <= checkBounds.left) {
            constrainPoint = new DOMPoint(elBR.x, elBR.y);
          } else if (isBLOutside && elBL.x <= checkBounds.left) {
            constrainPoint = new DOMPoint(elBL.x, elBL.y);
          }

          // calculate the displacement
          displaceX = checkBounds.x - constrainPoint.x;
        }
      }

      // calculate the constraining displacement if the element fits within the height of the bounds
      if (elHeight < boundsHeight) {
        if (isBottomEdgeCollided) {
          // determine which collision point we're going to constrain with
          if (isTLOutside && elTL.y >= (checkBounds.top + checkBounds.height)) {
            constrainPoint = new DOMPoint(elTL.x, elTL.y);
          } else if (isTROutside && elTR.y >= (checkBounds.top + checkBounds.height)) {
            constrainPoint = new DOMPoint(elTR.x, elTR.y);
          } else if (isBROutside && elBR.y >= (checkBounds.top + checkBounds.height)) {
            constrainPoint = new DOMPoint(elBR.x, elBR.y);
          } else if (isBLOutside && elBL.y >= (checkBounds.top + checkBounds.height)) {
            constrainPoint = new DOMPoint(elBL.x, elBL.y);
          }

          // calculate the displacement
          displaceY = checkBounds.y + checkBounds.height - constrainPoint.y;
        } else if (isTopEdgeCollided) {
          // determine which collision point we're going to constrain with
          if (isTLOutside && elTL.y <= checkBounds.top) {
            constrainPoint = new DOMPoint(elTL.x, elTL.y);
          } else if (isTROutside && elTR.y <= checkBounds.top) {
            constrainPoint = new DOMPoint(elTR.x, elTR.y);
          } else if (isBROutside && elBR.y <= checkBounds.top) {
            constrainPoint = new DOMPoint(elBR.x, elBR.y);
          } else if (isBLOutside && elBL.y <= checkBounds.top) {
            constrainPoint = new DOMPoint(elBL.x, elBL.y);
          }

          // calculate the displacement
          displaceY = checkBounds.y - constrainPoint.y;
        }
      }
    }

    // calculate the constrained position without rotating back
    let normalizedConstrainedElP0: DOMPoint = new DOMPoint(
      normalizedElP0.x + ((displaceX !== undefined) ? displaceX : 0),
      normalizedElP0.y + ((displaceY !== undefined) ? displaceY : 0),
    );

    // normalize the start position for translation arithmetic
    let normalizedStartPosition: DOMPoint = rotatePoint(
      this.startPosition,
      this.boundsCenter,
      -boundsRotation,
    );

    // displace the normalized element center
    const constrainedElP0: DOMPoint = rotatePoint(
      normalizedConstrainedElP0,
      boundsP0,
      boundsRotation,
    );

    // calculate the difference for each direction from the start position
    const translation: DOMPoint = new DOMPoint(
      normalizedConstrainedElP0.x - normalizedStartPosition.x,
      normalizedConstrainedElP0.y - normalizedStartPosition.y,
    );

    // clean up memory
    elTL = elTR = elBR = elBL = isTLOutside = isTROutside = isBROutside = isBLOutside = elWidth = elHeight =
      elRotation = elP0 = checkBounds = boundsWidth = boundsHeight = boundsRotation = boundsP0 =
      normalizedElP0 = constrainPoint = normalizedConstrainedElP0 = normalizedStartPosition = null;

    return new NgxDraggableBoundsCheckEvent(
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

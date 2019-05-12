import { Directive, ElementRef, EventEmitter, HostListener, Inject, Input, OnInit, Output, Renderer2 } from "@angular/core";
import { NgxDraggableBoundsCheckEvent } from "../classes/ngx-draggable-bounds-check-event";
import { NgxDraggableMoveEvent } from "../classes/ngx-draggable-move-event";

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
  private constrainedX: boolean;
  private constrainedY: boolean;
  private computedRotation: number;
  private clientMoving: DOMPoint;
  private oldClientPosition: DOMPoint;
  private original: DOMPoint;
  private naturalPosition: DOMPoint;
  private oldTrans: DOMPoint;
  private tempTrans: DOMPoint;
  private oldZIndex: string;
  private oldPosition: string;
  private curTrans: DOMPoint;

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

    // allow dragging if we are enabled
    this.allowDrag = !!enabled;

    // get the element that will be used to make the element draggable
    const draggableControl: HTMLElement = this.handle ? this.handle : this.el.nativeElement;

    // if we are allowed to drag, provide the draggable class, otherwise remove it
    if (this.allowDrag) {
      this.renderer.addClass(draggableControl, "ngx-draggable");
    } else {
      this.renderer.removeClass(draggableControl, "ngx-draggable");
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

  constructor(@Inject(ElementRef) private el: ElementRef, @Inject(Renderer2) private renderer: Renderer2) {
    this.started = new EventEmitter<NgxDraggableMoveEvent>();
    this.stopped = new EventEmitter<NgxDraggableMoveEvent>();
    this.moved = new EventEmitter<NgxDraggableMoveEvent>();
    this.edge = new EventEmitter<NgxDraggableBoundsCheckEvent>();

    this.constrainByBounds = this.moving = this.constrainedX = this.constrainedY = false;
    this.allowDrag = true;
    this.oldClientPosition = this.original = this.naturalPosition = null;
    this.oldZIndex = this.oldPosition = "";
    this.computedRotation = 0;
    this.clientMoving = new DOMPoint(0, 0);
    this.oldTrans = new DOMPoint(0, 0);
    this.tempTrans = new DOMPoint(0, 0);
    this.curTrans = new DOMPoint(0, 0);
  }

  /**
   * Angular lifecycle hook for initialization that ensures that the draggable class is applied to the element.
   */
  public ngOnInit(): void {
    if (this.allowDrag) {
      this.renderer.addClass(this.handle ? this.handle : this.el.nativeElement, "ngx-draggable");
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

    // save the starting position of the drag event
    this.original = new DOMPoint(event.clientX, event.clientY);

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
      // determine the distance this mouse move event is going in each direction
      if (this.oldClientPosition) {
        this.clientMoving.x = event.clientX - this.oldClientPosition.x;
        this.clientMoving.y = event.clientY - this.oldClientPosition.y;
      }

      // perform the move operation
      this.moveTo(event.clientX, event.clientY);
    }

    // after moving, track our new location and mark that we are no longer moving
    this.oldClientPosition = new DOMPoint(event.clientX, event.clientY);
    this.clientMoving.x = this.clientMoving.y = 0;
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

    this.original = new DOMPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);

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
      // determine the distance this mouse move event is going in each direction
      if (this.oldClientPosition) {
        this.clientMoving.x = event.changedTouches[0].clientX - this.oldClientPosition.x;
        this.clientMoving.y = event.changedTouches[0].clientY - this.oldClientPosition.y;
      }

      // perform the move operation
      this.moveTo(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    }

    // after moving, track our new location and mark that we are no longer moving
    this.oldClientPosition = new DOMPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    this.clientMoving.x = this.clientMoving.y = 0;
  }

  /* * * * * Draggable Logic * * * * */

  /**
   * Resets the state of the element. This will reset all positioning and movement data
   * but will not modify the current state of any data bound properties.
   */
  public reset(): void {
    this.moving = this.constrainedX = this.constrainedY = false;
    this.oldClientPosition = this.original = this.naturalPosition = null;
    this.oldZIndex = this.oldPosition = "";

    // reset all stored positions without defining a new object
    this.clientMoving.x = this.clientMoving.y = this.oldTrans.x = this.oldTrans.y =
      this.tempTrans.x = this.tempTrans.y = this.curTrans.x = this.curTrans.y = this.computedRotation = 0;

    // reset the transform value on the nativeElement
    this.renderer.removeStyle(this.el.nativeElement, "-webkit-transform");
    this.renderer.removeStyle(this.el.nativeElement, "-ms-transform");
    this.renderer.removeStyle(this.el.nativeElement, "-moz-transform");
    this.renderer.removeStyle(this.el.nativeElement, "-o-transform");
    this.renderer.removeStyle(this.el.nativeElement, "transform");
  }

  /**
   * Moves the element to a specified coordinate and performs any necessary boundary checking.
   *
   * @param x The x position to move the element to.
   * @param y The y position to move the element to.
   */
  private moveTo(x: number, y: number): void {
    let boundsResponse: NgxDraggableBoundsCheckEvent;
    let matrix: number[];
    let transform: string;
    let boundary: ClientRect;
    let elBounds: ClientRect;

    if (this.original) {
      // check the bounds
      boundsResponse = this.boundsCheck();

      // calculate the new translation
      this.tempTrans.x = x - this.original.x;
      this.tempTrans.y = y - this.original.y;

      // calculate the default translation for this movement (without bounds constrain checking)
      let transX = this.tempTrans.x + this.oldTrans.x;
      let transY = this.tempTrans.y + this.oldTrans.y;

      // make sure the constrained tracking variables are cleared
      this.constrainedX = this.constrainedY = false;

      // fetch the element's bounding box
      elBounds = this.el.nativeElement.getBoundingClientRect();

      // if the bounds were checked, adjust the positioning of the element to prevent dragging outside the bounds
      if (boundsResponse) {
        if (this.constrainByBounds) {
          // get the bounding client rectangles for the element and boundary element
          boundary = this.bounds.getBoundingClientRect();

          // check to constrain in the x direction
          if ((!boundsResponse.left && boundsResponse.right && this.clientMoving.x <= 0) ||
            this.naturalPosition.x + transX < boundary.left) {
            transX = boundary.left - this.naturalPosition.x;
            this.constrainedX = true;
          } else if ((boundsResponse.left && !boundsResponse.right && this.clientMoving.x >= 0) ||
            this.naturalPosition.x + elBounds.width + transX > boundary.left + boundary.width) {
            transX = boundary.right - elBounds.width - this.naturalPosition.x;
            this.constrainedX = true;
          }

          // check to constrain in the y direction
          if ((!boundsResponse.top && boundsResponse.bottom && this.clientMoving.y <= 0) ||
            this.naturalPosition.y + transY < boundary.top) {
            transY = boundary.top - this.naturalPosition.y;
            this.tempTrans.y = transY;
            this.constrainedY = true;
          } else if ((boundsResponse.top && !boundsResponse.bottom && this.clientMoving.y >= 0) ||
            this.naturalPosition.y + elBounds.height + transY > boundary.top + boundary.height) {
            transY = boundary.bottom - elBounds.height - this.naturalPosition.y;
            this.constrainedY = true;
          }

          // if we constrained in one of the directions, update that direction's tempTrans value for putBack
          if (this.constrainedX) {
            this.tempTrans.x = transX;
          }
          if (this.constrainedY) {
            this.tempTrans.y = transY;
          }
        }
      }

      // if it is possible, get the transform from the computed style and modify the matrix to maintain transform properties
      if (window) {
        // create the numerical matrix we will use
        matrix = this.getTransformMatrixForElement(this.el.nativeElement);

        // rotate the translation in the opposite direction to normalize
        const rotatedTranslation: DOMPoint = this.rotatePoint(new DOMPoint(transX, transY), new DOMPoint(0, 0), -this.computedRotation);
        // update the x and y values as part of the matrix
        matrix[4] = rotatedTranslation.x;
        matrix[5] = rotatedTranslation.y;

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
        transform = `translate(${transX}px, ${transY}px)`;
        this.renderer.setStyle(this.el.nativeElement, "transform", transform);
        this.renderer.setStyle(this.el.nativeElement, "-webkit-transform", transform);
        this.renderer.setStyle(this.el.nativeElement, "-ms-transform", transform);
        this.renderer.setStyle(this.el.nativeElement, "-moz-transform", transform);
        this.renderer.setStyle(this.el.nativeElement, "-o-transform", transform);
      }

      // track the current translation placement
      this.curTrans.x = transX;
      this.curTrans.y = transY;

      // emit the output of the bounds check
      if (boundsResponse) {
        this.edge.emit(boundsResponse);
      }

      // emit the current translation
      this.moved.emit(new NgxDraggableMoveEvent(this.el.nativeElement as HTMLElement, this.curTrans));
    }

    // clean up memory
    boundsResponse = matrix = transform = elBounds = boundary = null;
  }

  /**
   * Puts the element into a state of being moved setting appropriate styles and firing movement events when
   * the element is just beginning to move.
   */
  private pickUp(): void {
    // set a default position style
    let position = "relative";

    // get old z-index and position based on the direct style access
    this.oldZIndex = this.el.nativeElement.style.zIndex ? this.el.nativeElement.style.zIndex : "";
    this.oldPosition = this.el.nativeElement.style.position ? this.el.nativeElement.style.position : "";

    // always make sure our constrain flags are clear when we start
    this.constrainedX = this.constrainedY = false;

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
      this.oldPosition === "relative")
    ) {
      position = this.oldPosition;
    }

    // set the position and z-index for when the object is in a dragging state
    this.renderer.setStyle(this.el.nativeElement, "position", position);
    this.renderer.setStyle(this.el.nativeElement, "z-index", String(MAX_SAFE_Z_INDEX));

    // if we are not moving yet, emit the event to signal moving is beginning and start moving
    if (!this.moving) {
      // fire the event to signal that the element has begun moving
      this.started.emit(new NgxDraggableMoveEvent(this.el.nativeElement as HTMLElement, this.curTrans));

      // flag that we are now in a state of movement
      this.moving = true;

      // compute the current rotation of all parent nodes
      this.computedRotation = this.getParentalRotationContext(this.el.nativeElement.parentElement);

      // add the ngx-dragging class to the element we're interacting with
      this.renderer.addClass(this.handle ? this.handle : this.el.nativeElement, "ngx-dragging");
    }

    // track the natural position of the element (the window relative position of the element)
    if (!this.naturalPosition) {
      this.naturalPosition = new DOMPoint(
        this.el.nativeElement.getBoundingClientRect().left,
        this.el.nativeElement.getBoundingClientRect().top,
      );
    }

    // clean up memory
    position = null;
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
      // emit that we have stopped moving
      this.stopped.emit(new NgxDraggableMoveEvent(this.el.nativeElement as HTMLElement, this.curTrans));

      // if the user wants bounds checking, do a check and emit the boundaries if bounds have been hit
      if (this.bounds) {
        const boundsResponse: NgxDraggableBoundsCheckEvent = this.boundsCheck();
        if (boundsResponse) {
          this.edge.emit(boundsResponse);
        }
      }

      // mark that we are no longer moving
      this.moving = false;

      // remove the ng-dragging class to the element we're interacting with
      this.renderer.removeClass(this.handle ? this.handle : this.el.nativeElement, "ngx-dragging");

      // if we're constrained just use the tempTrans value set by moveTo, else add to our last trans
      if (this.constrainedX) {
        this.oldTrans.x = this.tempTrans.x;
      } else {
        this.oldTrans.x += this.tempTrans.x;
      }

      // if we're constrained just use the tempTrans value set by moveTo, else add to our last trans
      if (this.constrainedY) {
        this.oldTrans.y = this.tempTrans.y;
      } else {
        this.oldTrans.y += this.tempTrans.y;
      }

      // clear the tempTrans for the next pickup
      this.tempTrans.x = this.tempTrans.y = 0;
    }

    // clear our variables used to track movement direction during mouse move events
    this.clientMoving.x = this.clientMoving.y = 0;
    this.oldClientPosition = null;

    // reset the calculated rotation in case something changes when we're not dragging
    this.computedRotation = 0;
  }

  /**
   * Uses the defined boundary element and checks for an intersection with the draggable element to determine
   * if any edge has collided with one another.
   *
   * @return A NgxDraggableBoundsCheckEvent indicating which boundary edges were violated or null if boundary check is disabled.
   */
  private boundsCheck(): NgxDraggableBoundsCheckEvent | null {
    // don"t perform the bounds checking if the user has not requested it
    if (!this.bounds) {
      return null;
    }

    // get the bounding rectangles for the the element and the bounds
    const bounds: ClientRect = this.bounds.getBoundingClientRect();
    const elBounds: ClientRect = (this.el.nativeElement as HTMLElement).getBoundingClientRect();

    return new NgxDraggableBoundsCheckEvent(
      bounds.top < elBounds.top,
      bounds.right > elBounds.right,
      bounds.bottom > elBounds.bottom,
      bounds.left < elBounds.left,
    );
  }

  /**
   * Calculates the computed transform matrix for a given element.
   *
   * @param el The html element that we want to find the computed transform matrix for.
   * @return The computed transform matrix as an array of numbers.
   */
  private getTransformMatrixForElement(el: HTMLElement): number[] {
    // create the numerical matrix we will use
    const matrix: number[] = [1, 0, 0, 1, 0, 0];

    if (window) {
      // get the computed transform style
      let transform = window.getComputedStyle(
        el,
        null,
      ).getPropertyValue("transform");

      // strip non matrix values from the string
      transform = transform.replace(/matrix/g, "").replace(/\(/g, "").replace(/\)/g, "").replace(/ /g, "");

      // if we have a transform set, convert the string matrix to a numerical one
      if (transform !== "none") {
        // split the string based on commas
        let transformMatrix: string[] = transform.split(",");

        // convert the values of the matrix to numbers and add to our numerical matrix
        for (let i = 0; i < transformMatrix.length; i++) {
          matrix[i] = +transformMatrix[i];
        }
        transformMatrix = null;
      }
    }

    return matrix;
  }

  /**
   * Finds the overall computed rotation of the element's parent nodes so we can get an accurate
   * reading on the visual rotation of the element so we can appropriately adjust matrix translation
   * adjustments.
   *
   * @return The overall rotation of all parent nodes.
   */
  private getParentalRotationContext(node: HTMLElement, rotation = 0): number {
    // if we can't calculate the computed style or we have no node to analyze, return the current calculated rotation
    if (!node || !window) {
      return rotation;
    }

    // get the computed transform style matrix
    const matrix: number[] = this.getTransformMatrixForElement(node);

    // if we have reached the body, stop processing beyond here
    if (node.nodeName === "BODY") {
      return rotation + ((Math.acos(matrix[0]) * 180) / Math.PI);
    }

    // search up the DOM tree calculating the rotation
    return this.getParentalRotationContext(node.parentElement, rotation + ((Math.acos(matrix[0]) * 180) / Math.PI));
  }

  /**
   * Rotates a given DOMPoint around another pivot DOMPoint.
   *
   * @param point The point to be rotated.
   * @param pivot The pivot point that we are rotating the DOMPoint, point, around.
   * @param angle The angle at which we want to rotate the DOMPoint, point, around the pivot point.
   */
  private rotatePoint(point: DOMPoint, pivot: DOMPoint, angle: number): DOMPoint {
    const radians: number = angle * (Math.PI / 180);
    const rotatedX: number = Math.cos(radians) * (point.x - pivot.x) - Math.sin(radians) * (point.y - pivot.y) + pivot.x;
    const rotatedY: number = Math.sin(radians) * (point.x - pivot.x) + Math.cos(radians) * (point.y - pivot.y) + pivot.y;

    return new DOMPoint(rotatedX, rotatedY);
  }

}

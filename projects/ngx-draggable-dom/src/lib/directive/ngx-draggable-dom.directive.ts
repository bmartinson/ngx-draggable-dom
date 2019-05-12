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

  @HostListener("mousedown", ["$event"])
  private onMouseDown(event: MouseEvent): void {
    // stop all default behavior and propagation of the event so it is fully consumed by us
    event.stopImmediatePropagation();
    event.preventDefault();

    // 1. skip right click;
    // 2. if handle is set, the element can only be moved by handle
    if (event.button === 2 || (this.handle !== undefined && event.target !== this.handle)) {
      return;
    }

    this.original = { x: event.clientX, y: event.clientY } as DOMPoint;
    this.pickUp();
  }

  @HostListener("mouseup", ["$event"])
  private onMouseUp(event: MouseEvent): void {
    // stop all default behavior and propagation of the event so it is fully consumed by us
    event.stopImmediatePropagation();
    event.preventDefault();

    this.putBack();
  }

  @HostListener("mouseleave", ["$event"])
  private onMouseLeave(event: MouseEvent): void {
    // stop all default behavior and propagation of the event so it is fully consumed by us
    event.stopImmediatePropagation();
    event.preventDefault();

    this.putBack();

    this.moving = false;
  }

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
    this.oldClientPosition = { x: event.clientX, y: event.clientY } as DOMPoint;
    this.clientMoving.x = this.clientMoving.y = 0;
  }

  @HostListener("touchend", ["$event"])
  private onTouchEnd(event: TouchEvent | any): void {
    // stop all default behavior and propagation of the event so it is fully consumed by us
    event.stopImmediatePropagation();
    event.preventDefault();

    this.putBack();
  }

  @HostListener("touchstart", ["$event"])
  private onTouchStart(event: TouchEvent | any): void {
    // stop all default behavior and propagation of the event so it is fully consumed by us
    event.stopImmediatePropagation();
    event.preventDefault();

    if (this.handle !== undefined && event.target !== this.handle) {
      return;
    }

    this.original = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY } as DOMPoint;
    this.pickUp();
  }

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
    this.oldClientPosition = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY } as DOMPoint;
    this.clientMoving.x = this.clientMoving.y = 0;
  }

  /* * * * * Draggable Logic * * * * */

  /**
   * Moves the element to a specified coordinate and performs any necessary boundary checking.
   *
   * @param x The x position to move the element to.
   * @param y The y position to move the element to.
   */
  private moveTo(x: number, y: number): void {
    if (this.original) {
      // check the bounds
      const boundsResponse: NgxDraggableBoundsCheckEvent = this.boundsCheck();

      // calculate the new translation
      this.tempTrans.x = x - this.original.x;
      this.tempTrans.y = y - this.original.y;

      // calculate the default translation for this movement (without bounds constrain checking)
      let transX = this.tempTrans.x + this.oldTrans.x;
      let transY = this.tempTrans.y + this.oldTrans.y;

      // make sure the constrained tracking variables are cleared
      this.constrainedX = this.constrainedY = false;

      // if the bounds were checked, adjust the positioning of the element to prevent dragging outside the bounds
      if (boundsResponse) {
        if (this.constrainByBounds) {
          // get the bounding client rectangles for the element and boundary element
          const boundary: ClientRect = this.bounds.getBoundingClientRect();
          const elBounds: ClientRect = this.el.nativeElement.getBoundingClientRect();

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

      // set up the translation transform for all possible browser styles
      const transform = `translate(${transX}px, ${transY}px)`;
      this.renderer.setStyle(this.el.nativeElement, "transform", transform);
      this.renderer.setStyle(this.el.nativeElement, "-webkit-transform", transform);
      this.renderer.setStyle(this.el.nativeElement, "-ms-transform", transform);
      this.renderer.setStyle(this.el.nativeElement, "-moz-transform", transform);
      this.renderer.setStyle(this.el.nativeElement, "-o-transform", transform);

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
  }

  /**
   * Puts the element into a state of being moved setting appropriate styles and firing movement events when
   * the element is just beginning to move.
   */
  private pickUp(): void {
    // get old z-index and position
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

    // set a default position style
    let position = "relative";

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

      // add the ngx-dragging class to the element we're interacting with
      this.renderer.addClass(this.handle ? this.handle : this.el.nativeElement, "ngx-dragging");
    }

    // track the natural position of the element (the window relative position of the element)
    if (!this.naturalPosition) {
      this.naturalPosition = {
        x: this.el.nativeElement.getBoundingClientRect().left,
        y: this.el.nativeElement.getBoundingClientRect().top,
      } as DOMPoint;
    }
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
      const element = this.handle ? this.handle : this.el.nativeElement;
      this.renderer.removeClass(element, "ngx-dragging");

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
   * Resets the state of the element. This will reset all positioning and movement data
   * but will not modify the current state of any data bound properties.
   */
  public reset(): void {
    this.moving = this.constrainedX = this.constrainedY = false;
    this.oldClientPosition = this.original = this.naturalPosition = null;
    this.oldZIndex = this.oldPosition = "";

    // reset all stored positions without defining a new object
    this.clientMoving.x = this.clientMoving.y = this.oldTrans.x = this.oldTrans.y =
      this.tempTrans.x = this.tempTrans.y = this.curTrans.x = this.curTrans.y = 0;

    // reset the transform value on the nativeElement
    this.renderer.removeStyle(this.el.nativeElement, "transform");
    this.renderer.removeStyle(this.el.nativeElement, "-webkit-transform");
    this.renderer.removeStyle(this.el.nativeElement, "-ms-transform");
    this.renderer.removeStyle(this.el.nativeElement, "-moz-transform");
    this.renderer.removeStyle(this.el.nativeElement, "-o-transform");
  }

}

import {Directive, ElementRef, EventEmitter, HostListener, Inject, Input, OnInit, Output, Renderer2} from "@angular/core";

export interface IPosition {
    x: number;
    y: number;
}

export interface IBounds {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
}

export interface IMoveEvent {
    target: any;
    position: IPosition;
}

@Directive({
    selector: "[ngxDraggableDom]",
})
export class NgxDraggableDomDirective implements OnInit {

    @Output() private started: EventEmitter<IMoveEvent>;
    @Output() private stopped: EventEmitter<IMoveEvent>;
    @Output() private moved: EventEmitter<IMoveEvent>;
    @Output() private edge: EventEmitter<IBounds>;

    @Input() private handle: HTMLElement;
    @Input() private bounds: HTMLElement;
    @Input() private constrainByBounds: boolean;

    private allowDrag: boolean;
    private moving: boolean;
    private constrainedX: boolean;
    private constrainedY: boolean;
    private clientMoving: IPosition;
    private oldClientPosition: IPosition;
    private original: IPosition;
    private naturalPosition: IPosition;
    private oldTrans: IPosition;
    private tempTrans: IPosition;
    private oldZIndex: string;
    private oldPosition: string;
    private curTrans: IPosition;

    @Input("ngxDraggableDom")
    public set ngxDraggableDom(setting: boolean) {
        // if no value is provided for the attribute directive name, then turn it on
        if (setting === undefined || setting === null) {
            setting = true;
        }

        // turn on the directive setting
        this.allowDrag = !!setting;

        const element = this.handle ? this.handle : this.el.nativeElement;

        if (this.allowDrag) {
            this.renderer.addClass(element, "ng-draggable");
        } else {
            this.renderer.removeClass(element, "ng-draggable");
        }
    }

    public get ngxDraggableDom(): boolean {
        return !!this.allowDrag;
    }

    constructor(@Inject(ElementRef) private el: ElementRef, @Inject(Renderer2) private renderer: Renderer2) {
        this.started = new EventEmitter<IMoveEvent>();
        this.stopped = new EventEmitter<IMoveEvent>();
        this.moved = new EventEmitter<IMoveEvent>();
        this.edge = new EventEmitter<IBounds>();

        this.constrainByBounds = false;
        this.allowDrag = true;
        this.moving = false;
        this.constrainedX = false;
        this.constrainedY = false;
        this.clientMoving = {x: 0, y: 0} as IPosition;
        this.oldClientPosition = null;
        this.original = null;
        this.naturalPosition = null;
        this.oldTrans = {x: 0, y: 0} as IPosition;
        this.tempTrans = {x: 0, y: 0} as IPosition;
        this.oldZIndex = "";
        this.oldPosition = "";
        this.curTrans = {x: 0, y: 0} as IPosition;
    }

    /**
     * Angular lifecycle hook for initialization that ensures that the draggable class is applied to the element.
     */
    public ngOnInit(): void {
        if (this.allowDrag) {
            const element: any = this.handle ? this.handle : this.el.nativeElement;
            this.renderer.addClass(element, "ng-draggable");
        }
    }

    @HostListener("mousedown", ["$event"])
    private onMouseDown(event: any): void {
        event.stopImmediatePropagation();
        event.preventDefault();

        // 1. skip right click;
        // 2. if handle is set, the element can only be moved by handle
        if (event.button === 2 || (this.handle !== undefined && event.target !== this.handle)) {
            return;
        }

        this.original = {x: event.clientX, y: event.clientY} as IPosition;
        this.pickUp();
    }

    @HostListener("document:mouseup", ["$event"])
    private onMouseUp(event: Event): void {
        event.stopImmediatePropagation();
        event.preventDefault();

        this.putBack();
    }

    @HostListener("document:mouseleave", ["$event"])
    private onMouseLeave(event: Event): void {
        event.stopImmediatePropagation();
        event.preventDefault();

        this.putBack();
    }

    @HostListener("document:mousemove", ["$event"])
    private onMouseMove(event: MouseEvent): void {
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
        this.oldClientPosition = {x: event.clientX, y: event.clientY} as IPosition;
        this.clientMoving.x = this.clientMoving.y = 0;
    }

    // Support Touch Events:
    @HostListener("document:touchend", ["$event"])
    private onTouchEnd(event: TouchEvent | any): void {
        event.stopImmediatePropagation();
        event.preventDefault();

        this.putBack();
    }

    @HostListener("touchstart", ["$event"])
    private onTouchStart(event: TouchEvent | any): void {
        event.stopImmediatePropagation();
        event.preventDefault();

        if (this.handle !== undefined && event.target !== this.handle) {
            return;
        }

        this.original = {x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY} as IPosition;
        this.pickUp();
    }

    @HostListener("document:touchmove", ["$event"])
    private onTouchMove(event: TouchEvent | any): void {
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
        this.oldClientPosition = {x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY} as IPosition;
        this.clientMoving.x = this.clientMoving.y = 0;
    }

    /**
     * Main logic for moving the element via a transform while it is picked up.
     *
     * @param x The x position to move the element to.
     * @param y The y position to move the element to.
     */
    private moveTo(x: number, y: number): void {
        if (this.original) {
            // check the bounds
            const boundsResponse = this.boundsCheck();

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
                    const boundary = this.bounds.getBoundingClientRect();
                    const elem = this.el.nativeElement.getBoundingClientRect();

                    // check to constrain in the x direction
                    if ((!boundsResponse.left && boundsResponse.right && this.clientMoving.x <= 0) ||
                        this.naturalPosition.x + transX < boundary.left) {
                        transX = boundary.left - this.naturalPosition.x;
                        this.constrainedX = true;
                    } else if ((boundsResponse.left && !boundsResponse.right && this.clientMoving.x >= 0) ||
                        this.naturalPosition.x + elem.width + transX > boundary.left + boundary.width) {
                        transX = boundary.right - elem.width - this.naturalPosition.x;
                        this.constrainedX = true;
                    }

                    // check to constrain in the y direction
                    if ((!boundsResponse.top && boundsResponse.bottom && this.clientMoving.y <= 0) ||
                        this.naturalPosition.y + transY < boundary.top) {
                        transY = boundary.top - this.naturalPosition.y;
                        this.tempTrans.y = transY;
                        this.constrainedY = true;
                    } else if ((boundsResponse.top && !boundsResponse.bottom && this.clientMoving.y >= 0) ||
                        this.naturalPosition.y + elem.height + transY > boundary.top + boundary.height) {
                        transY = boundary.bottom - elem.height - this.naturalPosition.y;
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

            // set up the translation property
            const value = `translate(${transX}px, ${transY}px)`;
            this.curTrans.x = transX;
            this.curTrans.y = transY;
            this.renderer.setStyle(this.el.nativeElement, "transform", value);
            this.renderer.setStyle(this.el.nativeElement, "-webkit-transform", value);
            this.renderer.setStyle(this.el.nativeElement, "-ms-transform", value);
            this.renderer.setStyle(this.el.nativeElement, "-moz-transform", value);
            this.renderer.setStyle(this.el.nativeElement, "-o-transform", value);

            // emit the output of the bounds check
            if (boundsResponse) {
                this.edge.emit(boundsResponse);
            }

            // emit the current translation
            this.moved.emit({
                target: this.el.nativeElement,
                position: this.curTrans,
            } as IMoveEvent);
        }
    }

    /**
     * Picks up the element so it can be moved.
     */
    private pickUp(): void {
        // get old z-index and position:
        this.oldZIndex = this.el.nativeElement.style.zIndex ? this.el.nativeElement.style.zIndex : "";
        this.oldPosition = this.el.nativeElement.style.position ? this.el.nativeElement.style.position : "";

        // always make sure our constrain flags are clear when we start
        this.constrainedX = this.constrainedY = false;

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

        // setup default position:
        let position = "relative";

        // check if old position is draggable:
        if (this.oldPosition && (
            this.oldPosition === "absolute" ||
            this.oldPosition === "fixed" ||
            this.oldPosition === "relative")
        ) {
            position = this.oldPosition;
        }

        this.renderer.setStyle(this.el.nativeElement, "position", position);
        this.renderer.setStyle(this.el.nativeElement, "z-index", "99999");

        if (!this.moving) {
            this.started.emit({
                target: this.el.nativeElement,
                position: this.curTrans,
            } as IMoveEvent);
            this.moving = true;

            // add the ng-dragging class to the element we're interacting with
            const element = this.handle ? this.handle : this.el.nativeElement;
            this.renderer.addClass(element, "ng-dragging");
        }

        if (!this.naturalPosition) {
            this.naturalPosition = {
                x: this.el.nativeElement.getBoundingClientRect().left,
                y: this.el.nativeElement.getBoundingClientRect().top,
            } as IPosition;
        }
    }

    /**
     * Uses defined boundary elements to check that the positioning is within the appropriate bounds.
     */
    private boundsCheck(): IBounds {
        // don"t perform the bounds checking if the user has not requested it
        if (!this.bounds) {
            return null;
        }

        const boundary = this.bounds.getBoundingClientRect();
        const elem = this.el.nativeElement.getBoundingClientRect();
        return {
            top: boundary.top < elem.top,
            right: boundary.right > elem.right,
            bottom: boundary.bottom > elem.bottom,
            left: boundary.left < elem.left,
        } as IBounds;
    }

    /**
     * Puts the element back in the position it belongs.
     */
    private putBack(): void {
        if (this.oldZIndex) {
            this.renderer.setStyle(this.el.nativeElement, "z-index", this.oldZIndex);
        } else {
            this.el.nativeElement.style.removeProperty("z-index");
        }

        if (this.moving) {
            // emit that we have stopped moving
            this.stopped.emit({
                target: this.el.nativeElement,
                position: this.curTrans,
            } as IMoveEvent);

            // if the user wants bounds checking, do a check and emit the boundaries
            if (this.bounds) {
                this.edge.emit(this.boundsCheck());
            }

            this.moving = false;

            // remove the ng-dragging class to the element we're interacting with
            const element = this.handle ? this.handle : this.el.nativeElement;
            this.renderer.removeClass(element, "ng-dragging");

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
     * This function resets the state of the DOM element that ngDraggable was set on. This will reset all
     * of the private globals necessary for calculating placement but will not reset the current state of
     * the ngDraggable flag passed in by the user.
     */
    public reset(): void {
        this.moving = false;
        this.constrainedX = false;
        this.constrainedY = false;
        this.clientMoving = {x: 0, y: 0} as IPosition;
        this.oldClientPosition = null;
        this.original = null;
        this.naturalPosition = null;
        this.oldTrans = {x: 0, y: 0} as IPosition;
        this.tempTrans = {x: 0, y: 0} as IPosition;
        this.oldZIndex = "";
        this.oldPosition = "";
        this.curTrans = {x: 0, y: 0} as IPosition;

        // reset the transform value on the nativeElement
        this.renderer.setStyle(this.el.nativeElement, "transform", "");
        this.renderer.setStyle(this.el.nativeElement, "-webkit-transform", "");
        this.renderer.setStyle(this.el.nativeElement, "-ms-transform", "");
        this.renderer.setStyle(this.el.nativeElement, "-moz-transform", "");
        this.renderer.setStyle(this.el.nativeElement, "-o-transform", "");
    }

}

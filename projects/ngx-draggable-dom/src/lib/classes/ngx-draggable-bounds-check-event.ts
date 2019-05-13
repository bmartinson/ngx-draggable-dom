/**
 * This object class represents a boundary check event that can be emitted by the directive indicating to the consumer
 * which edges are intersecting with the boundary defined to constrain the draggable element.
 */
export class NgxDraggableBoundsCheckEvent {

    public top: boolean;
    public right: boolean;
    public bottom: boolean;
    public left: boolean;

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

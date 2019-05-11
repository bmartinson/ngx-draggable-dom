export class NgxDraggableMoveEvent {

    private _target: HTMLElement;
    private _position: DOMPoint;

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
     * @return The position of the target element as a DOMPoint.
     */
    public get position(): DOMPoint {
        return this._position;
    }

    constructor(target: HTMLElement, position: DOMPoint) {
        if (!!target) {
            this._target = target;
        }

        if (!!position) {
            this._position = position;
        }
    }

}

import { NgxDraggablePoint } from '../classes/ngx-draggable-point';

export type NgxResizeAnchor = 'tl' | 'tm' | 'tr' | 'rm' | 'br' | 'bm' | 'bl' | 'lm';
export type NgxResizeSource = 'mouse' | 'touch' | 'wheel';

export class NgxDraggableDomResizeEvent {
  public constructor(
    public readonly target: HTMLElement,
    public readonly anchor: NgxResizeAnchor | 'center',
    public readonly width: number,
    public readonly height: number,
    public readonly center: NgxDraggablePoint,
    public readonly source: NgxResizeSource
  ) {}
}

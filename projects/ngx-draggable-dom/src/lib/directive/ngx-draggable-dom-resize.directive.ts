import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  Renderer2,
  inject,
} from '@angular/core';

import { NgxDraggablePoint } from '../classes/ngx-draggable-point';
import { NgxDraggableDomResizeEvent, NgxResizeAnchor, NgxResizeSource } from '../events/ngx-draggable-dom-resize-event';
import { NgxDraggableMath } from '../helpers/ngx-draggable-dom-math';
import { NgxDraggableDomUtilities } from '../helpers/ngx-draggable-dom-utilities';
import { NgxDraggableDomDirective } from './ngx-draggable-dom.directive';

interface ResizeGeometry {
  width: number;
  height: number;
  center: NgxDraggablePoint;
}

interface ResizeSession {
  anchor: NgxResizeAnchor;
  source: 'mouse' | 'touch';
  touchId?: number;
  pointer: NgxDraggablePoint;
  center: NgxDraggablePoint;
  width: number;
  height: number;
  rotation: number;
}

@Directive({
  selector: '[ngxDraggableDomResize]',
  standalone: true,
})
export class NgxDraggableDomResizeDirective implements AfterViewInit, OnDestroy {
  private static readonly anchors: readonly NgxResizeAnchor[] = ['tl', 'tm', 'tr', 'rm', 'br', 'bm', 'bl', 'lm'];

  @Output() public readonly resizeStarted = new EventEmitter<NgxDraggableDomResizeEvent>();
  @Output() public readonly resized = new EventEmitter<NgxDraggableDomResizeEvent>();
  @Output() public readonly resizeStopped = new EventEmitter<NgxDraggableDomResizeEvent>();

  @Input() public constrainAspectRatio = true;

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);
  private readonly draggable = inject(NgxDraggableDomDirective, { optional: true, self: true });
  private overlay?: HTMLElement;
  private observer?: ResizeObserver;
  private session?: ResizeSession;
  private handles: readonly NgxResizeAnchor[] = NgxDraggableDomResizeDirective.anchors;
  private enabled = true;
  private wheelEnabled = false;
  private minimumWidth = 20;
  private minimumHeight = 20;
  private maximumWidth = Infinity;
  private maximumHeight = Infinity;
  private wheelFactor = 0.1;
  private offsetX = 0;
  private offsetY = 0;
  private initialTranslateX = '0px';
  private initialTranslateY = '0px';
  private initialTranslateZ = '';
  private contentWidthOffset = 0;
  private contentHeightOffset = 0;
  private overlayUpdate?: number;

  @Input()
  public set ngxDraggableDomResize(value: boolean | null | undefined) {
    const enabled = value !== false;
    if (enabled === this.enabled) {
      return;
    }
    this.enabled = enabled;
    if (!this.enabled) {
      this.finishResize();
    }
    this.syncHandles();
  }

  @Input()
  public set resizeHandles(value: readonly NgxResizeAnchor[]) {
    if (!Array.isArray(value) || value.some(anchor => !NgxDraggableDomResizeDirective.anchors.includes(anchor))) {
      throw new TypeError('resizeHandles must be an array of tl, tm, tr, rm, br, bm, bl, lm');
    }
    const handles = [...new Set(value)];
    if (handles.length === this.handles.length && handles.every((anchor, index) => anchor === this.handles[index])) {
      return;
    }
    this.handles = handles;
    this.syncHandles();
  }

  @Input()
  public set minWidth(value: number) {
    const minimum = this.validateSize(value, 'minWidth', Number.MIN_VALUE);
    if (minimum > this.maximumWidth) {
      throw new RangeError('minWidth cannot exceed maxWidth');
    }
    this.minimumWidth = minimum;
  }

  @Input()
  public set minHeight(value: number) {
    const minimum = this.validateSize(value, 'minHeight', Number.MIN_VALUE);
    if (minimum > this.maximumHeight) {
      throw new RangeError('minHeight cannot exceed maxHeight');
    }
    this.minimumHeight = minimum;
  }

  @Input()
  public set maxWidth(value: number) {
    this.maximumWidth = this.validateSize(value, 'maxWidth', this.minimumWidth);
  }

  @Input()
  public set maxHeight(value: number) {
    this.maximumHeight = this.validateSize(value, 'maxHeight', this.minimumHeight);
  }

  @Input()
  public set wheelResize(value: boolean) {
    this.wheelEnabled = value === true;
  }

  @Input()
  public set wheelStep(value: number) {
    this.wheelFactor = this.validateSize(value, 'wheelStep', Number.MIN_VALUE);
  }

  public ngAfterViewInit(): void {
    if (typeof document === 'undefined') {
      return;
    }

    const overlay = this.renderer.createElement('div') as HTMLElement;
    this.renderer.addClass(overlay, 'ngx-resize-overlay');
    this.renderer.setStyle(overlay, 'position', 'fixed');
    this.renderer.setStyle(overlay, 'pointer-events', 'none');
    this.renderer.setStyle(overlay, 'z-index', '16777272');
    this.renderer.setStyle(overlay, 'transform-origin', 'center');
    this.renderer.appendChild(document.body, overlay);
    this.overlay = overlay;
    this.syncHandles();

    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(() => this.positionOverlay());
      this.observer.observe(this.element);
    }
    document.addEventListener('scroll', this.positionOverlay, true);
    document.addEventListener('mousemove', this.scheduleOverlayUpdate);
    document.addEventListener('touchmove', this.scheduleOverlayUpdate);
    window.addEventListener('resize', this.positionOverlay);
    window.addEventListener('blur', this.onBlur);
    this.element.addEventListener('ngx-draggable-dom-position-change', this.positionOverlay);
    this.element.addEventListener('wheel', this.onWheel, { passive: false });
    this.positionOverlay();
  }

  public ngOnDestroy(): void {
    this.finishResize();
    this.observer?.disconnect();
    if (this.overlayUpdate !== undefined) {
      cancelAnimationFrame(this.overlayUpdate);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('scroll', this.positionOverlay, true);
      document.removeEventListener('mousemove', this.scheduleOverlayUpdate);
      document.removeEventListener('touchmove', this.scheduleOverlayUpdate);
      window.removeEventListener('resize', this.positionOverlay);
      window.removeEventListener('blur', this.onBlur);
      this.element.removeEventListener('ngx-draggable-dom-position-change', this.positionOverlay);
      this.element.removeEventListener('wheel', this.onWheel);
    }
    if (this.overlay) {
      this.renderer.removeChild(this.overlay.parentNode, this.overlay);
    }
  }

  private validateSize(value: number, name: string, minimum: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum) {
      throw new RangeError(`${name} must be a finite number of at least ${minimum}`);
    }
    return value;
  }

  private syncHandles(): void {
    if (!this.overlay) {
      return;
    }
    this.finishResize();
    while (this.overlay.firstChild) {
      this.renderer.removeChild(this.overlay, this.overlay.firstChild);
    }
    this.renderer.setStyle(this.overlay, 'display', this.enabled && this.handles.length ? 'block' : 'none');
    if (!this.enabled) {
      return;
    }
    for (const anchor of this.handles) {
      const handle = this.renderer.createElement('button') as HTMLButtonElement;
      handle.type = 'button';
      handle.setAttribute('aria-label', `Resize ${anchor}`);
      this.renderer.addClass(handle, 'ngx-resize-handle');
      this.renderer.addClass(handle, `ngx-resize-handle-${anchor}`);
      this.renderer.setStyle(handle, 'pointer-events', 'auto');
      this.renderer.setStyle(handle, 'touch-action', 'none');
      this.renderer.listen(handle, 'mousedown', (event: MouseEvent) => this.startResize(event, anchor));
      this.renderer.listen(handle, 'touchstart', (event: TouchEvent) => this.startResize(event, anchor));
      this.renderer.appendChild(this.overlay, handle);
    }
    this.positionOverlay();
  }

  private readonly positionOverlay = (): void => {
    if (!this.overlay || !this.enabled) {
      return;
    }
    const bounds = this.element.getBoundingClientRect();
    const width = this.element.offsetWidth;
    const height = this.element.offsetHeight;
    this.renderer.setStyle(this.overlay, 'display', width && height && this.handles.length ? 'block' : 'none');
    this.renderer.setStyle(this.overlay, 'width', `${width}px`);
    this.renderer.setStyle(this.overlay, 'height', `${height}px`);
    this.renderer.setStyle(this.overlay, 'left', `${bounds.left + bounds.width / 2 - width / 2}px`);
    this.renderer.setStyle(this.overlay, 'top', `${bounds.top + bounds.height / 2 - height / 2}px`);
    this.renderer.setStyle(
      this.overlay,
      'transform',
      `rotate(${NgxDraggableDomUtilities.getTotalRotationForElement(this.element)}deg)`
    );
  };

  private readonly scheduleOverlayUpdate = (): void => {
    if (this.overlayUpdate !== undefined || !this.enabled) {
      return;
    }
    this.overlayUpdate = requestAnimationFrame(() => {
      this.overlayUpdate = undefined;
      this.positionOverlay();
    });
  };

  private readonly onWheel = (event: WheelEvent): void => {
    if (!this.enabled || !this.wheelEnabled) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (this.session) {
      return;
    }
    const width = this.element.offsetWidth;
    const height = this.element.offsetHeight;
    if (width <= 0 || height <= 0 || event.deltaY === 0) {
      return;
    }
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
    if (!Number.isFinite(delta)) {
      return;
    }
    const factor = Math.exp(Math.max(-5, Math.min(5, (-delta / 100) * this.wheelFactor)));
    const scale = Math.max(
      Math.max(this.minimumWidth / width, this.minimumHeight / height),
      Math.min(factor, Math.min(this.maximumWidth / width, this.maximumHeight / height))
    );
    if (!Number.isFinite(scale) || Math.abs(scale - 1) < 0.000001) {
      return;
    }
    const center = this.getCenter();
    const constrained = this.constrainToDragBounds(
      { width, height, center },
      { width: width * scale, height: height * scale, center }
    );
    if (constrained.width === width && constrained.height === height) {
      return;
    }
    this.captureStyles();
    this.emit(this.resizeStarted, 'center', 'wheel');
    this.applySize(constrained.width, constrained.height, constrained.center);
    this.emit(this.resized, 'center', 'wheel');
    this.emit(this.resizeStopped, 'center', 'wheel');
  };

  private startResize(event: MouseEvent | TouchEvent, anchor: NgxResizeAnchor): void {
    if (!this.enabled || this.session || ('button' in event && event.button !== 0)) {
      return;
    }
    const touch = 'changedTouches' in event ? event.changedTouches[0] : undefined;
    if ('changedTouches' in event && (!touch || event.touches.length > 1)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const pointer = 'changedTouches' in event ? touch : event;
    if (!pointer) {
      return;
    }
    this.captureStyles();
    this.session = {
      anchor,
      source: touch ? 'touch' : 'mouse',
      touchId: touch?.identifier,
      pointer: new NgxDraggablePoint(pointer.clientX, pointer.clientY),
      center: this.getCenter(),
      width: this.element.offsetWidth,
      height: this.element.offsetHeight,
      rotation: NgxDraggableDomUtilities.getTotalRotationForElement(this.element),
    };
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('touchmove', this.onTouchMove, { passive: false });
    document.addEventListener('touchend', this.onTouchEnd);
    document.addEventListener('touchcancel', this.onTouchEnd);
    this.emit(this.resizeStarted, anchor, this.session.source);
  }

  private readonly onMouseMove = (event: MouseEvent): void => {
    if (this.session?.source !== 'mouse') {
      return;
    }
    event.preventDefault();
    this.resizeFromPointer(event.clientX, event.clientY);
  };

  private readonly onBlur = (): void => this.finishResize();

  private readonly onMouseUp = (event: MouseEvent): void => {
    if (this.session?.source === 'mouse') {
      event.preventDefault();
      this.finishResize();
    }
  };

  private readonly onTouchMove = (event: TouchEvent): void => {
    if (this.session?.source !== 'touch') {
      return;
    }
    const touch = Array.from(event.changedTouches).find(item => item.identifier === this.session?.touchId);
    if (!touch) {
      return;
    }
    event.preventDefault();
    this.resizeFromPointer(touch.clientX, touch.clientY);
  };

  private readonly onTouchEnd = (event: TouchEvent): void => {
    if (
      this.session?.source === 'touch' &&
      Array.from(event.changedTouches).some(t => t.identifier === this.session?.touchId)
    ) {
      this.finishResize();
    }
  };

  private resizeFromPointer(x: number, y: number): void {
    const session = this.session;
    if (!session) {
      return;
    }
    const horizontal = session.anchor.includes('l') ? -1 : session.anchor.includes('r') ? 1 : 0;
    const vertical = session.anchor.includes('t') ? -1 : session.anchor.includes('b') ? 1 : 0;
    const delta = NgxDraggableMath.rotatePoint(
      new NgxDraggablePoint(x - session.pointer.x, y - session.pointer.y),
      new NgxDraggablePoint(0, 0),
      -session.rotation
    );
    let width = horizontal
      ? Math.max(this.minimumWidth, Math.min(this.maximumWidth, session.width + horizontal * delta.x))
      : session.width;
    let height = vertical
      ? Math.max(this.minimumHeight, Math.min(this.maximumHeight, session.height + vertical * delta.y))
      : session.height;
    if (horizontal && vertical && this.constrainAspectRatio && session.width > 0 && session.height > 0) {
      const minimumScale = Math.max(this.minimumWidth / session.width, this.minimumHeight / session.height);
      const maximumScale = Math.min(this.maximumWidth / session.width, this.maximumHeight / session.height);
      if (minimumScale > maximumScale) {
        return;
      }
      const projectedScale =
        1 +
        (horizontal * delta.x * session.width + vertical * delta.y * session.height) /
          (session.width * session.width + session.height * session.height);
      const scale = Math.max(minimumScale, Math.min(maximumScale, projectedScale));
      width = session.width * scale;
      height = session.height * scale;
    }
    const displacement = NgxDraggableMath.rotatePoint(
      new NgxDraggablePoint((horizontal * (width - session.width)) / 2, (vertical * (height - session.height)) / 2),
      new NgxDraggablePoint(0, 0),
      session.rotation
    );
    const constrained = this.constrainToDragBounds(
      { width: session.width, height: session.height, center: session.center },
      {
        width,
        height,
        center: new NgxDraggablePoint(session.center.x + displacement.x, session.center.y + displacement.y),
      }
    );
    this.applySize(constrained.width, constrained.height, constrained.center);
    this.emit(this.resized, session.anchor, session.source);
  }

  private constrainToDragBounds(start: ResizeGeometry, end: ResizeGeometry): ResizeGeometry {
    const bounds = this.draggable?.constrainByBounds ? this.draggable.bounds : undefined;
    if (!bounds) {
      return end;
    }
    const boundsRect = bounds.getBoundingClientRect();
    const boundsCenter = new NgxDraggablePoint(
      boundsRect.left + boundsRect.width / 2,
      boundsRect.top + boundsRect.height / 2
    );
    const boundsRotation = NgxDraggableDomUtilities.getTotalRotationForElement(bounds);
    const elementRotation = NgxDraggableDomUtilities.getTotalRotationForElement(this.element);
    const relativeAngle = ((elementRotation - boundsRotation) * Math.PI) / 180;
    const cosine = Math.abs(Math.cos(relativeAngle));
    const sine = Math.abs(Math.sin(relativeAngle));
    const inside = (geometry: ResizeGeometry): boolean => {
      const center = NgxDraggableMath.rotatePoint(geometry.center, boundsCenter, -boundsRotation);
      const horizontalExtent = (geometry.width * cosine + geometry.height * sine) / 2;
      const verticalExtent = (geometry.width * sine + geometry.height * cosine) / 2;
      // Keep the edge inside despite integer offsetWidth rounding and subpixel CSS positioning.
      return (
        Math.abs(center.x - boundsCenter.x) + horizontalExtent <= bounds.offsetWidth / 2 - 1 &&
        Math.abs(center.y - boundsCenter.y) + verticalExtent <= bounds.offsetHeight / 2 - 1
      );
    };
    if (inside(end)) {
      return end;
    }
    if (!inside(start)) {
      return start;
    }
    let low = 0;
    let high = 1;
    for (let i = 0; i < 24; i++) {
      const fraction = (low + high) / 2;
      const candidate: ResizeGeometry = {
        width: start.width + (end.width - start.width) * fraction,
        height: start.height + (end.height - start.height) * fraction,
        center: new NgxDraggablePoint(
          start.center.x + (end.center.x - start.center.x) * fraction,
          start.center.y + (end.center.y - start.center.y) * fraction
        ),
      };
      if (inside(candidate)) {
        low = fraction;
      } else {
        high = fraction;
      }
    }
    return {
      width: start.width + (end.width - start.width) * low,
      height: start.height + (end.height - start.height) * low,
      center: new NgxDraggablePoint(
        start.center.x + (end.center.x - start.center.x) * low,
        start.center.y + (end.center.y - start.center.y) * low
      ),
    };
  }

  private captureStyles(): void {
    const computed = window.getComputedStyle(this.element);
    const contentWidth = parseFloat(computed.width);
    const contentHeight = parseFloat(computed.height);
    if (!Number.isFinite(contentWidth) || !Number.isFinite(contentHeight)) {
      throw new Error('ngxDraggableDomResize requires an element with measurable CSS width and height');
    }
    const translated = computed.translate === 'none' ? ['0px', '0px'] : computed.translate.split(' ');
    this.initialTranslateX = translated[0];
    this.initialTranslateY = translated[1] ?? '0px';
    this.initialTranslateZ = translated[2] ?? '';
    this.offsetX = 0;
    this.offsetY = 0;
    this.contentWidthOffset = this.element.offsetWidth - contentWidth;
    this.contentHeightOffset = this.element.offsetHeight - contentHeight;
  }

  private applySize(width: number, height: number, center: NgxDraggablePoint): void {
    this.renderer.setStyle(this.element, 'width', `${Math.max(0, width - this.contentWidthOffset)}px`);
    this.renderer.setStyle(this.element, 'height', `${Math.max(0, height - this.contentHeightOffset)}px`);
    const current = this.getCenter();
    const parentRotation = NgxDraggableDomUtilities.getTotalRotationForElement(this.element.parentElement);
    const correction = NgxDraggableMath.rotatePoint(
      new NgxDraggablePoint(center.x - current.x, center.y - current.y),
      new NgxDraggablePoint(0, 0),
      -parentRotation
    );
    this.offsetX += correction.x;
    this.offsetY += correction.y;
    this.renderer.setStyle(
      this.element,
      'translate',
      `calc(${this.initialTranslateX} + ${this.offsetX}px) calc(${this.initialTranslateY} + ${this.offsetY}px)${this.initialTranslateZ ? ` ${this.initialTranslateZ}` : ''}`
    );
    this.positionOverlay();
  }

  private getCenter(): NgxDraggablePoint {
    const bounds = this.element.getBoundingClientRect();
    return new NgxDraggablePoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
  }

  private emit(
    emitter: EventEmitter<NgxDraggableDomResizeEvent>,
    anchor: NgxResizeAnchor | 'center',
    source: NgxResizeSource
  ): void {
    emitter.emit(
      new NgxDraggableDomResizeEvent(
        this.element,
        anchor,
        this.element.offsetWidth,
        this.element.offsetHeight,
        this.getCenter(),
        source
      )
    );
  }

  private finishResize(): void {
    if (!this.session) {
      return;
    }
    const { anchor, source } = this.session;
    this.session = undefined;
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('touchmove', this.onTouchMove);
    document.removeEventListener('touchend', this.onTouchEnd);
    document.removeEventListener('touchcancel', this.onTouchEnd);
    this.emit(this.resizeStopped, anchor, source);
  }
}

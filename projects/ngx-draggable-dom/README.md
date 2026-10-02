# ngx-draggable-dom

Standalone Angular directives for dragging and resizing DOM elements.

## Table of contents

1. [About This Package](#about-this-package)
2. [What\'s New!?](#whats-new)
3. [Installation](#installation)
4. [Usage](#usage)
5. [API: Dragging](#api-dragging)
6. [API: Resizing](#api-resizing)
7. [CSS](#css)

## About This Package

This package provides standalone Angular directives for dragging and resizing DOM elements. This project began as a fork of the [angular2-draggable](https://github.com/xieziyu/angular2-draggable) directive by [xieziyu](https://github.com/xieziyu). The initial fork was known as ng2-draggable-dom and was deprecated in favor of this package.

## What's New!? 📜

- ⚠️ `NgxDraggableDomModule` is no longer exported. Replace imports of that module with `NgxDraggableDomDirective` in each component that uses the directive.
- 🔥 v22.1 introduces a handful of long-requested enhancements!
  - Resize DOM elements with a brand new additional directive, `ngxDraggableDomResize` - [#44](https://github.com/bmartinson/ngx-draggable-dom/issues/44)
  - Detect the DOM elements that you drop the draggable element on top of - [#31](https://github.com/bmartinson/ngx-draggable-dom/issues/31)
  - Set initial x/y positions for DOM elements - [#24](https://github.com/bmartinson/ngx-draggable-dom/issues/24)

## Installation

`npm install ngx-draggable-dom --save`

The package declares `@angular/core >=14.0.0` as a peer dependency; this repository builds its library and sample with Angular 22.

## Usage

Import `ngx-draggable-dom/styles/ngx-draggable-dom.scss` in your application's global styles or add it to `angular.json` to display and position resize handles. The same stylesheet provides optional drag cursor and transition styles. Handle styles must be global because the resize overlay is attached to `document.body`, outside component-scoped styles.

Explore the API of inputs and outputs to customize dragging and resizing, or run the sample app to try the examples.

## API: Dragging

Import the standalone `NgxDraggableDomDirective` directly into the component that uses it:

```typescript
import { Component } from '@angular/core';
import { NgxDraggableDomDirective, NgxDraggableDomMoveEvent } from 'ngx-draggable-dom';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [NgxDraggableDomDirective],
  template: '<div [ngxDraggableDom]="true" (stopped)="onStopped($event)">Drag me!</div>',
})
export class ExampleComponent {
  onStopped(event: NgxDraggableDomMoveEvent): void {
    const dropZone = event.dropTarget?.closest('.drop-zone');
    console.log('Dragged:', event.target, 'Dropped on:', dropZone);
  }
}
```

### Input Properties

`ngxDraggableDom` {boolean}

- `true`: The element can be dragged.
- `false`: The element cannot be dragged.

`ngxDraggableDomPositionX`, `ngxDraggableDomPositionY` {number}

- Optional initial **visual bounding-box** left (`X`) and top (`Y`) in document CSS pixels, including page scroll. Set either or both; an omitted axis retains its original rendered coordinate. Zero and negative values are valid; non-finite values are rejected.
- Coordinates are applied after the first render using a transform, not CSS `left`/`top`, so existing element rotation and layout positioning are preserved. Later binding changes do not reposition the element until `reset()` is called; the latest values become the reset target.

  ```html
  <img [ngxDraggableDom]="true" [ngxDraggableDomPositionX]="200" [ngxDraggableDomPositionY]="300" />
  ```

`handle` {HTMLElement}

- A child of the draggable element used as the selectable region to drag. Interactions must start directly on that element (not one of its children).

`bounds` {HTMLElement}

- The element that represents the region the entire draggable element should be kept within. Note, by setting this property you are not forcing it to be constrained within the bounds.

`constrainByBounds` {boolean}

- `true`: If `bounds` is set, the draggable element will be constrained by that HTMLElement.
- `false` (default): If `bounds` is set, the draggable element will just report which boundary edge has been passed by in the `edge` output emitter.

`requireMouseOver` {boolean}

- `true`: The draggable element will be put back down as soon as the mouse leaves the HTMLElement.
- `false` (default): The draggable element will always follow the mouse position as long as the mouse is held down.

`requireMouseOverBounds` {boolean}

- `true`: The draggable element will not move when it is constrained by a bounds edge and the mouse position is outside of the bounds.
- `false` (default): The draggable element can still move in an unconstrained direction while it is being constrained in another and the mouse position is outside of the bounds.

`ignoreMultiTouchEvents` {boolean}

- `true`: Ignore a multi-touch start and cancel an active drag without a `stopped` event if a second touch appears during movement.
- `false` (default): Additional touches do not cancel an active drag; only the touch that started it controls movement and release.

### Output Emitters

`started` {[NgxDraggableDomMoveEvent](#ngxdraggabledommoveevent)}

- This event is fired when an end user starts dragging the element.

`stopped` {[NgxDraggableDomMoveEvent](#ngxdraggabledommoveevent)}

- This event is fired when an end user stops dragging the element and releases it. Its `dropTarget` is the deepest element under the release pointer, excluding the dragged element and its children. See `onStopped` above for finding a containing drop zone.

`moved` {[NgxDraggableDomMoveEvent](#ngxdraggabledommoveevent)}

- This event is fired for every movement the end user makes while dragging the element.

`edge` {[NgxDraggableDomBoundsCheckEvent](#ngxdraggabledomboundscheckevent)}

- If `bounds` is set, this event reports the element's relationship to its bounds during movement and when dragging stops, including when no edge is breached.

### Events

#### NgxDraggableDomMoveEvent

- `target` {HTMLElement}
  - The element that is being dragged (not the drop destination).
- `position` {NgxDraggablePoint}
  - The current translation of the referenced element.
- `dropTarget` {Element | null}
  - On `stopped`, the deepest element underneath the pointer after excluding the dragged element and descendants (and resize handles). Use `closest()` to find a containing drop zone. `null` if only the page background is underneath or the pointer is outside the document. `started` and `moved` always have `null`. Mouse and touch release use release coordinates; a mouseleave stop uses the last recorded pointer position.

#### NgxDraggableDomBoundsCheckEvent

- `top` {boolean}
  - If the element collided with the top edge of the bounds, this will be set to `true`.
- `right` {boolean}
  - If the element collided with the right edge of the bounds, this will be set to `true`.
- `bottom` {boolean}
  - If the element collided with the bottom edge of the bounds, this will be set to `true`.
- `left` {boolean}
  - If the element collided with the left edge of the bounds, this will be set to `true`.
- `constrainedCenter` {NgxDraggablePoint}
  - The calculated position of the element's center point as it should be constrained when interacting with the bounds, if available.
- `translation` {NgxDraggablePoint}
  - The calculated overall translation that the element should have applied to its transformation matrix.
- `isConstrained` {boolean}
  - `true` when the element has been constrained after colliding with the bounds.

### Public Functions

`reset()` {void}

- Ends an active drag without emitting `stopped` and resets its translation. With position inputs, returns the element to the latest document-space X/Y targets; omitted axes return to their original rendered coordinates. The element retains its current size after resizing and keeps its original rotation. Without position inputs, the original transform-clearing reset behavior applies. The resize directive has no separate `reset()` method.

## API: Resizing

Import `NgxDraggableDomResizeDirective` into a standalone component and include the packaged stylesheet in global styles to display and position its handles. The handles are placed in an overlay outside the host, so this also works on images:

```scss
@use 'ngx-draggable-dom/styles/ngx-draggable-dom.scss';
```

```typescript
import { Component } from '@angular/core';
import { NgxDraggableDomResizeDirective, NgxDraggableDomResizeEvent } from 'ngx-draggable-dom';

@Component({
  selector: 'app-resizable',
  standalone: true,
  imports: [NgxDraggableDomResizeDirective],
  template: `
    <img
      src="example.png"
      alt="Resizable example"
      [ngxDraggableDomResize]="true"
      [resizeHandles]="['tl', 'tr', 'br', 'bl']"
      [minWidth]="60"
      [maxWidth]="800"
      [wheelResize]="true"
      (resized)="onResized($event)" />
  `,
})
export class ResizableComponent {
  onResized(event: NgxDraggableDomResizeEvent): void {
    console.log(event.width, event.height);
  }
}
```

### Input Properties

`ngxDraggableDomResize` {boolean}

- `true` (default): The element can be resized using its enabled handles or, if configured, the wheel.
- `false`: Hide the handles and disable resizing; any active handle interaction stops.

`resizeHandles` {readonly NgxResizeAnchor[]}

- The enabled handles; defaults to all eight: `tl` (top left), `tm` (top middle), `tr` (top right), `rm` (right middle), `br` (bottom right), `bm` (bottom middle), `bl` (bottom left), `lm` (left middle). An empty array hides all handles without disabling wheel resizing. Invalid names are rejected.
- Corners change width and height; midpoints change one dimension. The opposite corner or edge stays fixed, including when the element or its ancestors are rotated.
- When combined with `NgxDraggableDomDirective` on the same element, resizing respects its `bounds` if `constrainByBounds` is `true`. Handle and wheel resizing stop at the bounds, including after dragging has moved the element and when the bounds are rotated. Without constrained drag bounds, resize size limits still apply independently.

`constrainAspectRatio` {boolean}

- `true` (default): Corner handles preserve the element's width-to-height ratio as it was when the drag began. The opposite corner stays fixed and both dimensions respect their minimum and maximum limits. If those limits cannot accommodate the ratio, dragging leaves the size unchanged.
- `false`: Corner handles resize width and height independently. Midpoint handles always resize only their own axis; wheel resizing remains proportional regardless of this input.

`minWidth`, `minHeight` {number}

- Minimum rendered width and height in pixels (default: `20` each). Values must be positive, finite numbers and cannot exceed their respective maximum.

`maxWidth`, `maxHeight` {number}

- Maximum rendered width and height in pixels (no limit by default). Provided values must be finite numbers and cannot be below their respective minimum.

`wheelResize` {boolean}

- `true`: Scrolling the wheel over the element resizes both dimensions proportionally, keeping its center fixed. Wheel events are consumed even at a size limit or during a handle drag, so the page does not scroll; such events do not emit resize events when the size is unchanged.
- `false` (default): Wheel events do not resize the element; normal page scrolling is unaffected.

`wheelStep` {number}

- Positive, finite zoom factor for wheel resizing (default: `0.1`); it scales the exponential response to the wheel delta, not a fixed number of pixels.

### Output Emitters

`resizeStarted` {[NgxDraggableDomResizeEvent](#ngxdraggabledomresizeevent)}

- Fired when a handle interaction starts, or before each wheel event that changes the size.

`resized` {[NgxDraggableDomResizeEvent](#ngxdraggabledomresizeevent)}

- Fired for handle movements that can be processed (even when clamped at a size limit) and for wheel resizes, reporting the resulting dimensions. Incompatible aspect-ratio limits prevent handle resizing and do not emit this event.

`resizeStopped` {[NgxDraggableDomResizeEvent](#ngxdraggabledomresizeevent)}

- Fired when a handle interaction ends, is disabled, or is interrupted; each wheel event that changes the size emits it after `resized`.

### Events

#### NgxDraggableDomResizeEvent

- `target` {HTMLElement}
  - The element being resized.
- `anchor` {NgxResizeAnchor | 'center'}
  - The active handle (`tl`, `tm`, `tr`, `rm`, `br`, `bm`, `bl`, or `lm`), or `center` for wheel resizing.
- `width`, `height` {number}
  - The element's current layout-box dimensions (`offsetWidth`, `offsetHeight`) in CSS pixels, before any visual expansion from rotation.
- `center` {NgxDraggablePoint}
  - The element's current center in viewport coordinates (`x`, `y`).
- `source` {NgxResizeSource}
  - The interaction source: `mouse`, `touch`, or `wheel`.

### Public Functions

The resize directive has no public methods. Configure it through inputs and observe it through outputs.

## CSS

When `ngxDraggableDom` is enabled on some element, the `ngx-draggable` class is automatically assigned to it. When the user is actively dragging the element, the class `ngx-dragging` is applied to the element (or the specified handle). If you include the provided `ngx-draggable-dom.scss` styles into your project from `node_modules/ngx-draggable-dom/styles/ngx-draggable-dom.scss`, you will receive native styling and support for turning off CSS transitions while interacting with the element. You can override these to customize the look and feel for when you are interacting with the element. For example, change the cursor style for draggable elements in your page by doing the following:

```css
.ngx-draggable {
  cursor: move;
}

.ngx-dragging {
  cursor: grabbing !important;
}
```

For resizing, the packaged stylesheet positions subtle circular handles using `.ngx-resize-handle` and the per-anchor classes `.ngx-resize-handle-tl`, `.ngx-resize-handle-tm`, `.ngx-resize-handle-tr`, `.ngx-resize-handle-rm`, `.ngx-resize-handle-br`, `.ngx-resize-handle-bm`, `.ngx-resize-handle-bl`, and `.ngx-resize-handle-lm`. Override these classes or set `--ngx-resize-handle-size`, `--ngx-resize-handle-border`, and `--ngx-resize-handle-background` on `:root` or `.ngx-resize-overlay` to customize them. Host-element custom properties do not inherit into the body-attached overlay. Dragging and resizing can be applied to the same host; handle interactions do not start dragging.

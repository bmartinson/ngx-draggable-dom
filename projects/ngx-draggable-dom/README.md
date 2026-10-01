# ngx-draggable-dom

Angular attribute directive that causes any element to become a draggable element.

## Table of contents

1. [About This Package](#about-this-package)
2. [Latest News](#latest-news)
3. [Installation](#installation)
4. [Usage](#usage)
5. [API: Dragging](#api-dragging)
6. [API: Resizing](#api-resizing)
7. [CSS](#css)

## About This Package

This package provides a directive for Angular that makes any DOM element draggable. This project began as a fork of the [angular2-draggable](https://github.com/xieziyu/angular2-draggable) directive by [xieziyu](https://github.com/xieziyu) and was created to provide a more robust set of features and to keep package releases on the bleeding edge. The initial fork was known as ng2-draggable-dom and was deprecated in favor of this package that runs using the latest Angular dependencies and tools for libraries.

## Installation

`npm install ngx-draggable-dom --save`

Requires Angular 14 or newer.

## Usage

⚠️ `NgxDraggableDomModule` is no longer exported. Replace imports of that module with `NgxDraggableDomDirective` in each component that uses the directive.

For the provided drag cursor styles, optionally import `ngx-draggable-dom/styles/ngx-draggable-dom.scss` in your application's styles or add it to `angular.json`.

Explore the API of inputs and outputs to customize dragging and resizing, or run the sample app to try the examples.

## API: Dragging

Import the standalone `NgxDraggableDomDirective` directly into the component that uses it:

```typescript
import { Component } from '@angular/core';
import { NgxDraggableDomDirective } from 'ngx-draggable-dom';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [NgxDraggableDomDirective],
  template: '<div [ngxDraggableDom]="true">Drag me!</div>',
})
export class ExampleComponent {}
```

### Input Properties

`ngxDraggableDom` {boolean}

- `true`: The element can be dragged.
- `false`: The element cannot be dragged.

`handle` {HTMLElement}

- The element that should be used as the selectable region to drag.

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
- `false`: The draggable element can still move in an unconstrained direction while it is being constrained in another and the mouse position is outside of the bounds.

`ignoreMultiTouchEvents` {boolean}

- `true`: The object will not move for multi touch gestures, allowing you to support a single touch for movement and multi-touch for other functionality at the same time.
- `false`: The object will move for any type of touch event that interacts with it, whether a single touch or multi-touch gesture.

### Output Emitters

`started` {[NgxDraggableDomMoveEvent](#NgxDraggableDomMoveEvent)}

- This event is fired when an end user starts dragging the element.

`stopped` {[NgxDraggableDomMoveEvent](#NgxDraggableDomMoveEvent)}

- This event is fired when an end user stops dragging the element and releases it.

`moved` {[NgxDraggableDomMoveEvent](#NgxDraggableDomMoveEvent)}

- This event is fired for every movement the end user makes while dragging the element.

`edge` {[NgxDraggableDomBoundsCheckEvent](#NgxDraggableDomBoundsCheckEvent)}

- If `bounds` is set, this event will be fired defining the state of the interaction between the element and the bounds constraints. This event will be fired for every movement that collides with the bounds when constraining and when the end user stops dragging.

### Events

#### NgxDraggableDomMoveEvent

- `target` {HTMLElement}
  - The element that is being dragged.
- `position` {NgxDraggablePoint}
  - The current translation of the referenced element.

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
  - The calculated position of the element's center point as it should be constrained when interacting with the bounds.
- `translation` {NgxDraggablePoint}
  - The calculated overall translation that the element should have applied to its transformation matrix.
- `isConstrained` {boolean}
  - If the element has being constrained after colliding with the bounds, this will be set to `true`.

### Public Functions

`reset()` {void}

- Call this function on a reference to the directive in TypeScript code to request that the directive be reset to a default state. This is useful for when the draggable element has its location programmatically adjusted such that subsequent drags should not remember past translations that may affect future placement.


## API: Resizing

Import `NgxDraggableDomResizeDirective` into a standalone component and include the packaged stylesheet to display its handles. The handles are placed in an overlay outside the host, so this also works on images:

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

`minWidth`, `minHeight` {number}

- Minimum rendered width and height in pixels (default: `20` each). Values must be positive, finite numbers and cannot exceed their respective maximum.

`maxWidth`, `maxHeight` {number}

- Maximum rendered width and height in pixels (no limit by default). Provided values must be finite numbers and cannot be below their respective minimum.

`wheelResize` {boolean}

- `true`: Scrolling the wheel over the element resizes both dimensions proportionally, keeping its center fixed.
- `false` (default): Wheel events do not resize the element.

`wheelStep` {number}

- Positive, finite zoom factor for wheel resizing (default: `0.1`); it scales the exponential response to the wheel delta, not a fixed number of pixels.

### Output Emitters

`resizeStarted` {[NgxDraggableDomResizeEvent](#ngxdraggabledomresizeevent)}

- Fired when a handle interaction starts, or once for each handled wheel event before the size changes.

`resized` {[NgxDraggableDomResizeEvent](#ngxdraggabledomresizeevent)}

- Fired for each handled handle movement or wheel resize, reporting the new dimensions.

`resizeStopped` {[NgxDraggableDomResizeEvent](#ngxdraggabledomresizeevent)}

- Fired when a handle interaction ends, is disabled, or is interrupted; each handled wheel event emits it after `resized`.

### Events

#### NgxDraggableDomResizeEvent

- `target` {HTMLElement}
  - The element being resized.
- `anchor` {NgxResizeAnchor | 'center'}
  - The active handle (`tl`, `tm`, `tr`, `rm`, `br`, `bm`, `bl`, or `lm`), or `center` for wheel resizing.
- `width`, `height` {number}
  - The element's current rendered dimensions in pixels.
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

For resizing, the packaged stylesheet positions subtle circular handles using `.ngx-resize-handle` and the per-anchor classes `.ngx-resize-handle-tl`, `.ngx-resize-handle-tm`, `.ngx-resize-handle-tr`, `.ngx-resize-handle-rm`, `.ngx-resize-handle-br`, `.ngx-resize-handle-bm`, `.ngx-resize-handle-bl`, and `.ngx-resize-handle-lm`. Override these classes or `--ngx-resize-handle-size`, `--ngx-resize-handle-border`, and `--ngx-resize-handle-background` to customize them. The overlay is attached to the document body, not nested inside the resizable element. Dragging and resizing can be applied to the same host; handle interactions do not start dragging.

# ngx-draggable-dom

Angular attribute directive that causes any element to become a draggable element.

## Table of contents
1. [About This Package](#about-this-package)
2. [Latest News](#latest-news)
3. [Installation](#installation)
4. [Usage](#usage)
5. [API](#api)

## About This Package
This package provides a directive for Angular 7+ that makes any DOM element draggable. This project began as a fork of the [angular2-draggable](https://github.com/xieziyu/angular2-draggable) directive by [xieziyu](https://github.com/xieziyu) and was created to provide a more robust set of features and to keep package releases on the bleeding edge. The initial fork was known as ng2-draggable-dom and was deprecated in favor of this package that runs using the latest Angular dependencies and tools for libraries.

## Installation
```npm install ngx-draggable-dom --save```

## Usage
1. Import `NgxDraggableDomModule` in your app module (or other Angular module) and place it in your imports section:

    ```typescript
    import { NgxDraggableDomModule } from "ngx-draggable-dom";

    @NgModule({
       imports: [
         ...,
         NgxDraggableDomModule,
       ],
       ...
    })
    export class AppModule { }
	  ```

2. Use the `ngxDraggableDom` directive to make a DOM element draggable.

	```html
	<div ngxDraggableDom="true">Drag me!</div>
	```

3. Import `ngx-draggable-dom.scss` to your application's styles or add it to your `angular.json` if you use the CLI tools.

4. Explore the API of inputs and outputs to help make your element drag just the way you would like, or run the wrapper project to test it out with some pre-designed examples!

## API

### Input Properties

`ngxDraggableDom` {boolean}
+ `true`: The element can be dragged.
+ `false`: The element cannot be dragged.

`handle` {HTMLElement}
+ The element that should be used as the selectable region to drag.

`bounds` {HTMLElement}
+ The element that represents the region the entire draggable element should be kept within. Note, by setting this property you are not forcing it to be constrained within the bounds.

`constrainByBounds` {boolean}
+ `true`: If `bounds` is set, the draggable element will be constrained by that HTMLElement.
+ `false` (default): If `bounds` is set, the draggable element will just report which boundary edge has been passed by in the `edge` output emitter.

`requireMouseOver` {boolean}
+ `true`: The draggable element will be put back down as soon as the mouse leaves the HTMLElement.
+ `false` (default): The draggable element will always follow the mouse position as long as the mouse is held down.

`requireMouseOverBounds` {boolean}
+ `true`: The draggable element will not move when it is constrained by a bounds edge and the mouse position is outside of the bounds.
+ `false`: The draggable element can still move in an unconstrained direction while it is being constrained in another and the mouse position is outside of the bounds.

### Output Emitters

`started` {[NgxDraggableDomMoveEvent](#NgxDraggableDomMoveEvent)}
+ This event is fired when an end user starts dragging the element.

`stopped` {[NgxDraggableDomMoveEvent](#NgxDraggableDomMoveEvent)}
+ This event is fired when an end user stops dragging the element and releases it.

`moved` {[NgxDraggableDomMoveEvent](#NgxDraggableDomMoveEvent)}
+ This event is fired for every movement the end user makes while dragging the element.

`edge` {[NgxDraggableDomBoundsCheckEvent](#NgxDraggableDomBoundsCheckEvent)}
+ If `bounds` is set, this event will be fired defining the state of the interaction between the element and the bounds constraints. This event will be fired for every movement that collides with the bounds when constraining and when the end user stops dragging.

### Events

#### NgxDraggableDomMoveEvent
+ `target` {HTMLElement}
  + The element that is being dragged.
+ `position` {NgxDraggablePoint}
  + The current translation of the referenced element.

#### NgxDraggableDomBoundsCheckEvent
+ `top` {boolean}
  + If the element collided with the top edge of the bounds, this will be set to `true`.
+ `right` {boolean}
  + If the element collided with the right edge of the bounds, this will be set to `true`.
+ `bottom` {boolean}
  + If the element collided with the bottom edge of the bounds, this will be set to `true`.
+ `left` {boolean}
  + If the element collided with the left edge of the bounds, this will be set to `true`.
+ `constrainedCenter` {NgxDraggablePoint}
  + The calculated position of the element's center point as it should be constrained when interacting with the bounds.
+ `translation` {NgxDraggablePoint}
  + The calculated overall translation that the element should have applied to its transformation matrix.
+ `isConstrained` {boolean}
  + If the element has being constrained after colliding with the bounds, this will be set to `true`.

### Public Functions

`reset()` {void}
+ Call this function on a reference to the directive in TypeScript code to request that the directive be reset to a default state. This is useful for when the draggable element has its location programmatically adjusted such that subsequent drags should not remember past translations that may affect future placement.

###  CSS
When `ngxDraggableDom` is enabled on some element, the `ngx-draggable` class is automatically assigned to it. When the user is actively dragging the element, the class `ngx-dragging` is applied to the element (or the specified handle). If you include the provided `ngx-draggable-dom.scss` styles into your project, you will receive native styling and support for turning off CSS transitions while interacting with the element. You can override these to customize the look and feel for when you are interacting with the element. For example, change the cursor style for draggable elements in your page by doing the following:

```css
.ngx-draggable {
  cursor: move;
}

.ngx-dragging {
  cursor: grabbing !important;
}
```

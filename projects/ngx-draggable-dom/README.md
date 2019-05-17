# ngx-draggable-dom [![npm version](https://badge.fury.io/js/ngx-draggable-dom.svg)](http://badge.fury.io/js/ngx-draggable-dom) [![npm downloads](https://img.shields.io/npm/dm/ngx-draggable-dom.svg)](https://npmjs.org/ngx-draggable-dom)

Angular attribute directive that causes any element to become a draggable element.

## Table of contents
1. [About This Package](#about-this-package)
2. [Latest News](#latest-news)
3. [Installation](#installation)
4. [Usage](#usage)
5. [API](#api)

## About This Package
This package provides a directive for Angular 7+ that makes any DOM element draggable. This project began as a fork of the [angular2-draggable](https://github.com/xieziyu/angular2-draggable) directive by [xieziyu](https://github.com/xieziyu) and was created to provide a more robust set of features and to keep package releases on the bleeding edge. The initial fork was known as ng2-draggable-dom and was deprecated in favor of this package that runs using the latest Angular dependencies and tools for libraries.

## Latest News
Always check the [CHANGELOG](https://github.com/bmartinson/ngx-draggable-dom/blob/master/CHANGELOG.md) for more detailed information about what's brand new. See the top of this README to see what the current version of this module is.

### 2019.05.15:
+ Version 1.1.1 has been released that fixes a number of issues with the library, most importantly allowing the directive to operate on an unlimited number of elements in the DOM and in varying rotated contexts.

### 2019.05.02:
+ Updated to use the latest node packages to resolve vulnerability issues with dev dependencies.

## Installation
```npm install ngx-draggable-dom --save```

## Usage
1. Import `NgxDraggableDomModule` in your app module (or other Angular module) and place it in your imports section:

    ```typescript
    import { NgxDraggableDomModule } from "NgxDraggableDomLibrary";

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

### Output Emitters

#### `started` {NgxDraggableMoveEvent}

This event is fired when an end user starts dragging the element.

#### `stopped` {NgxDraggableMoveEvent}

This event is fired when an end user stops dragging the element and releases it.

#### `moved` {NgxDraggableMoveEvent}

This event is fired for every movement the end user makes while dragging the element.

#### `edge` {NgxDraggableBoundsCheckEvent}

If `bounds` is set, this event will be fired defining the state of the interaction between the element and the bounds constraints. This event will be fired for every movement that collides with the bounds when constraining and when the end user stops dragging.

### Events

#### NgxDraggableMoveEvent
+ `target` {HTMLElement}
  + The element that is being dragged.
+ `position` {DOMPoint}
  + The current translation of the referenced element.

#### NgxDraggableBoundsCheckEvent
+ `top` {boolean}
  + If the element collided with the top edge of the bounds, this will be set to `true`.
+ `right` {boolean}
  + If the element collided with the right edge of the bounds, this will be set to `true`.
+ `bottom` {boolean}
  + If the element collided with the bottom edge of the bounds, this will be set to `true`.
+ `left` {boolean}
  + If the element collided with the left edge of the bounds, this will be set to `true`.
+ `constrainedCenter` {DOMPoint}
  + The calculated position of the element's center point as it should be constrained when interacting with the bounds.
+ `translation` {DOMPoint}
  + The calculated overall translation that the element should have applied to its transformation matrix.
+ `isConstrained` {boolean}
  + If the element has being constrained after colliding with the bounds, this will be set to `true`.

### Public Functions

#### `reset()` {void}
+ Call this function on a reference to the directive in TypeScript code to request that the directive be reset to a default state. This is useful for when the draggable element has its location programmatically adjusted such that subsequent drags should not remember past translations that may affect future placement.

####  CSS
When `ngxDraggableDom` is enabled on some element, the `ngx-draggable` class is automatically assigned to it. When the user is actively dragging the element, the class `ngx-dragging` is applied to the element (or the specified handle). If you include the provided `ngx-draggable-dom.scss` styles into your project, you will receive native styling and support for turning off CSS transitions while interacting with the element. You can override these to customize the look and feel for when you are interacting with the element. For example, change the cursor style for draggable elements in your page by doing the following:

```css
.ngx-draggable {
  cursor: move;
}

.ngx-dragging {
  cursor: grabbing !important;
}
```

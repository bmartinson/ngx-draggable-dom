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

### 2019.02.15:
+ Added the automatic addition and removal of the `ng-dragging` class while the user is interacting with the element.

### 2019.02.14:
+ Updated the project to use the latest Angular 7 tools.

### 2019.02.13:
+ Released the first release candidate for the Ng7 supported directive.

## Installation
```npm install ngx-draggable-dom --save```

## Usage
1. Import `NgxDraggableDomModule` in your app module (or other proper angular module) and place it in your imports section:

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
	<div ngxDraggableDom>Drag me!</div>
	```

3. Explore the API of inputs and outputs to help make your element drag just the way you would like!

## API

### Input Properties

`ngxDraggableDom` {boolean}
+ `true`: the element can be dragged.
+ `false`: the element cannot be dragged.

`handle` {HTMLElement}
+ `{HTMLElement}`: The element that should be used as the selectable region to drag.

`bounds` {HTMLElement}
+ `{HTMLElement}`: The element that represents the region the entire draggable element should be kept within. Note, by setting this property you are not forcing it to be constrained within the bounds.

`constrainByBounds` {boolean}
+ `true`: if `bounds` is set, the draggable element will be constrained by that HTMLElement.
+ `false` (default): if `bounds` is set, the draggable element will just report which boundary edge has been passed by in the `edge` output emitter.

### Output Emitters

`started` {target: nativeElement, position: IPosition} as {IMoveEvent} (exported interface):
+ Emits the nativeElement that is being dragged in `$event.target`.
+ Emits the current translation in `$event.position` as an `IPosition {x, y}`.

`stopped` {target: nativeElement, position: IPosition} as {IMoveEvent} (exported interface):
+ Emits the nativeElement that is being dragged in `$event.target`.
+ Emits the current translation in `$event.position` as an `IPosition {x, y}`.

`moved` {target: nativeElement, position: IPosition} as {IMoveEvent} (exported interface):
+ Emits the nativeElement that is being dragged in `$event.target`.
+ Emits the current translation in `$event.position` as an `IPosition {x, y}`.

`edge` {top: boolean, right: boolean, bottom: boolean, left: boolean} as IBounds (exported interface):
+ If `bounds` is set, this output will emit an object defining the state of constraint for each edge of the HTMLElement defined by `bounds`.

### Public Functions

`reset()` {void}:
+ Call this function on a reference to the directive in TypeScript code to request that the directive be reset to a default state. This is useful for when the draggable element has its location programmatically adjusted such that subsequent drags should not remember past translations that may affect future placement.

####  CSS
When `ngxDraggableDom` is enabled on some element, the `ng-draggable` class is automatically assigned to it. When the user is actively dragging the element, the class `ng-dragging` is applied to the element (or the specified handle). You can use these to customize the look and feel for when you are interacting with the element. For example, change the cursor style for draggable elements in your page by doing the following:

```css
.ng-draggable {
  cursor: move;
}

.ng-dragging {
  cursor: grabbing !important;
}
```


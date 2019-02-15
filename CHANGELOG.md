# Change History For ngx-draggable-dom

<a name="1.0.0"></a>
## [1.0.0](https://github.com/bmartinson/ngx-draggable-dom/compare/0.0.1...bmartinson:1.0.0) (2019-02-14)

#### Overview
+ This is the first official release of the ngx-draggable-dom directive built with the latest Ng7 dependencies using the Angular CLI.

<a name="0.0.1"></a>
## 0.0.1 (2019-02-14)

#### Overview
+ This is the initial release candidate of the ngx-draggable-dom. This library has been developed using the Ng7 CLI tools for generating libraries and upgrades the old ng2-draggable-dom codebase to be based on the latest Ng7 dependencies.

# Change History for ng2-draggable-dom

<a name="ng2-1.2.4"></a>
## ng2-1.2.3 (2019-02-14)

#### Overview
+ This publishes the npm package as the same state it was in when 1.2.1 was released, the last completely stable version

#### Bug Fixes
+ Fixed a dependency injection issue that caused the module to not load properly.

<a name="ng2-1.2.2"></a>
## ng2-1.2.2 (2019-02-13)

#### Overview
+ This revision releases package updates, some cleaner TypeDefs, and allows touch events to propagate.
+ Please note that this is not stable and will likely not compile.

#### Enhancements
+ Cleaned up some type definitions and moved property instantiation to within the constructor.
+ Updated the packages associated with the directive for the latest Angular release.

#### Bug Fixes
+ Previously, when trying to touch a button (with a touch event on mobile, for example) that is part of the content of an element that has the directive added to it, the touch event would be completely consumed by the directive and interaction lost. Now, touch events work.

<a name="ng2-1.2.1"></a>
## ng2-1.2.1 (2018-01-11)

#### Overview
+ This revision is to complete GitHub and NPM account migration updates. There are no functional differences between package versions 1.2.0 and 1.2.1.

<a name="ng2-1.2.0"></a>
## ng2-1.2.0 (2017-12-13)

#### Overview
+ This minor release provides a new public helper function that allows a user to request that the directive reset its state to be back to default.

#### Enhancements
+ Adding a new public helper function `reset()` that allows a developer to request that the state of the directive be set back to its initial state. This is useful for when the draggable element has its location manually adjusted so subsequent drags will not remember past translations that may affect future placement. To make use of this function you can do the following:

```typescript
// define a ViewChild reference as a private global
@ViewChild(DraggableDomDirective) draggableDom: DraggableDomDirective;

private resetFunction(): void {
  // reset the directive's state when we call this resetFunction
  this.draggableDom.reset();
}
```

<a name="ng2-1.1.2"></a>
## ng2-1.1.2 (2017-12-13)

#### Overview
+ This revision releases some refinement on bounds constraining to ensure that the element does not get jumpy on multiple drags.

#### Bug Fixes
+ Previously, when performing a second or subsequent drag, the element could jump or behave unpredictably.

<a name="ng2-1.1.1"></a>
## ng2-1.1.1 (2017-12-13)

#### Overview
+ This revision releases a key bug fix for a run time error when dragging a second time.

#### Bug Fixes
+ Previously, you could get a null pointer reference when performing a drag event because we were not storing the initial element position for calculating mouse movement.

<a name="ng2-1.1.0"></a>
## ng2-1.1.0 (2017-12-13)

#### Overview
+ This release adds a new output so each movement can be tracked in real time and also provides bug fixes for `(stopped)` breaking in release 1.0.0.

#### Enhancements
+ `(moved)` is a new output that emits an `IMoveEvent` object.

#### Bug Fixes
+ `(stopped)` emits again.

<a name="ng2-1.0.0"></a>
## ng2-1.0.0 (2017-12-13)

#### Overview
+ This release stabilizes the new enhancements for managing bounds constraining and also upgrades the response from each `(started)` and `(stopped)` output emitters to include the current translation location so a parent component doesn't have to do checking on the style property that the directive sets on the dom element that is draggable.

#### Enhancements
+ `IPosition` is now an exported interface.
+ `IMoveEvent` is now an exported interface.
+ `(started)` and `(stopped)` now emit `IMoveEvent` objects for more robust output.
+ Internally, we now know the distance each individual mouse drag event is covering in both directions.

#### Bug Fixes
+ `constrainByBounds` now works correctly for all mouse events and directions.

<a name="ng2-1.0.0-rc4"></a>
## ng2-1.0.0-rc4 (2017-12-12)

#### Overview
+ This release adds fixes for bounds constraining.

#### Bug Fixes
+ Don't stick to the edges! Previously, if you used `constrainByBounds`, when you dragged to an edge, you'd permanently get stuck there.

<a name="ng2-1.0.0-rc3"></a>
## ng2-1.0.0-rc3 (2017-12-12)

### Overview
+ This is the first release to establish actual bounds constraining.

#### Enhancements
+ Adding a new input, `constrainByBounds` to actually prevent dragging outside the defined `bounds` HTMLElement.
+ IBounds is now an exported interface for the object response emitted by `(edge)`.

#### Misc. Changes
+ Adding new TS lint guidelines for working with the project.
+ Code cleanup to adhere to more strict coding standards.
+ Better documentation in an updated README.

<a name="ng2-1.0.0-rc2"></a>
## ng2-1.0.0-rc2 (2017-12-12)

#### Overview
+ This release fixes run time errors that existed in the master codebase of the [angular2-draggable](https://github.com/xieziyu/angular2-draggable) codebase.

#### Bug Fixes
+ Make sure that when `bounds` is not set, `checkBounds()` is not called and `(edge)` is not emitted. Previously, if a user did not have `bounds` set, they would crash when they stopped moving.

<a name="ng2-1.0.0-rc1"></a>
## ng2-1.0.0-rc1 (2017-12-12)

#### Overview
+ RC1 is a release of the current state of the master branch for the [angular2-draggable](https://github.com/xieziyu/angular2-draggable) with a new name, `ng2-draggable-dom` to be published at [npmjs.com](https://www.npmjs.com/~bmartinson).

#### Misc. Changes
+ No changes from master.
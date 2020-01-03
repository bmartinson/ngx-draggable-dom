# Change History For ngx-draggable-dom

<a name="1.5.2"></a>
## [1.5.2](https://github.com/bmartinson/ngx-draggable-dom/compare/1.5.1...1.5.2) (2020-01-03)

#### Overview
+ This update makes sure that all of the latest package dependencies are being used.

<a name="1.5.1"></a>
## [1.5.1](https://github.com/bmartinson/ngx-draggable-dom/compare/1.5.0...1.5.1) (2019-07-16)

#### Overview
+ This update fixes a bug where text input and other controls could not be properly focused that were child nodes to a node using the directive.

#### Bug Fixes
+ `event.preventDefault()` is only called for mouse and touch events that are performed on elements that are instances of `HTMLImageElement` to ensure that we only block default browser image dragging behavior when an image is part of the `ngx-draggable-dom` element and we don't prevent the focusing of other controls.

<a name="1.5.0"></a>
## [1.5.0](https://github.com/bmartinson/ngx-draggable-dom/compare/1.4.0...1.5.0) (2019-07-02)

#### Overview
+ This update is meant to provide a wider range of browser support by removing use of `DOMRect` in favor of a custom rect implementation that implements `ClientRect` and is not exported for use outside of the module. Any interaction with these new rectangles are performed as a `ClientRect`. Note this is a breaking change if you are using the exported helper function `getBoundingBox` in your application as it will no longer be a `DOMRect` that is returned but rather `ClientRect`.

#### Bug Fixes
+ `DOMPoint` is no longer used as it is experimental and not standard ES. We will instead use a custom implementation specific to the directive to ensure maximum browser compatibility.

<a name="1.4.0"></a>
## [1.4.0](https://github.com/bmartinson/ngx-draggable-dom/compare/1.3.1...1.4.0) (2019-07-02)

#### Overview
+ This update is meant to provide a wider range of browser support by removing use of `DOMPoint` in favor of a custom point implementation.

#### Bug Fixes
+ `DOMPoint` is no longer used as it is experimental and not standard ES. We will instead use a custom implementation specific to the directive to ensure maximum browser compatibility.

<a name="1.3.1"></a>
## [1.3.1](https://github.com/bmartinson/ngx-draggable-dom/compare/1.3.0...1.3.1) (2019-06-29)

#### Overview
+ This update includes some dependency package updates. No functional changes for the directive itself.

#### Enhancements
+ Updated packages.

<a name="1.3.0"></a>
## [1.3.0](https://github.com/bmartinson/ngx-draggable-dom/compare/1.2.1...1.3.0) (2019-06-10)

#### Overview
+ This update supports Ng8, updates some naming conventions, and fixes security vulnerabilities.

#### Enhancements
+ Patched security vulnerabilities in dependencies.
+ Added support for Ng8.
+ Updated naming schemes.

<a name="1.2.1"></a>
## [1.2.1](https://github.com/bmartinson/ngx-draggable-dom/compare/1.2.0...1.2.1) (2019-05-17)

#### Overview
+ This update modifies the math used to convert transform matrix rotation values to degrees.

#### Bug Fixes
+ Fixed the angle calculation for transform matrices so that we properly calculate the rotation in all cases.

<a name="1.2.0"></a>
## [1.2.0](https://github.com/bmartinson/ngx-draggable-dom/compare/1.1.1...1.2.0) (2019-05-17)

#### Overview
+ This update provides some improvements to the way element positioning and bounding are calculated and adds a new configurable property.

#### Enhancements
+ You can disable the put back of the element when the mouse is no longer hovering over the HTMLElement while dragging by using `requireMouseOver`.
+ You can disable any movement of the element when bounds constraining is turned on and the element is constrained and the user's mouse is outside of the bounds by using `requireMouseOverBounds`.
+ `NgxDraggableBoundsCheckEvent` now has an additional property that describes the translation that is needed to achieve the constrained center point position.

#### Bug Fixes
+ Boundary and element position calculations are more accurate now in all rotated contexts so constrained points don't collide with the bounds in a different direction.

<a name="1.1.1"></a>
## [1.1.1](https://github.com/bmartinson/ngx-draggable-dom/compare/1.1.0...1.1.1) (2019-05-15)

#### Overview
+ This update provides fixes for issue [#2](https://github.com/bmartinson/ngx-draggable-dom/issues/2) so the directive works on various parent positions of elements (relative, absolute, etc.). It also provides support for OnPush component usage and updates the wrapper project.

#### Enhancements
+ The directive now invokes change detection manually so the directive can be used on elements that are used in OnPush components.

#### Bug Fixes
+ Document scroll position is factored in so we can handle bounding in absolutely positioned contexts as well as relatively positioned ones.

<a name="1.1.0"></a>
## [1.1.0](https://github.com/bmartinson/ngx-draggable-dom/compare/1.0.2...1.1.0) (2019-05-15)

#### Overview
+ This update introduces a major re-working of the library, including breaking changes from the previous version, in order to fix a handful of issues. It also introduces an example playground as the wrapper project that you can use to test the library and explore its features.

#### Enhancements
+ Wrapper project is now a working Angular project that presents a sample playground for testing the directive.

#### Bug Fixes
+ The directive can now be used on unlimited elements in the DOM, where previously incorrect event host bindings led to only one element being able to properly use the directive.
+ Transformations that are not translations are maintained while dragging.
+ The directive can now be used on elements that have a rotation applied to them.
+ The directive can now be used on elements that have parent nodes that have rotation transformations applied to them.
+ CSS classes that are autmoatially injected and removed from the element using the directive have a new name `ngx-draggable` and `ngx-dragging`.
+ A new SCSS style is included as part of the library that gives default cursor styling and prevents the element using the directive from looking highlighted in the page.
+ Events and bounds data no longer are generic objects that adhere to interfaces. All custom interfaces have been removed and strongly typed class objects are now used for events.

<a name="1.0.2"></a>
## [1.0.2](https://github.com/bmartinson/ngx-draggable-dom/compare/1.0.1...1.0.2) (2019-05-02)

#### Overview
+ This update uses the latest node packages to resolve vulnerability issues with dev dependencies.

<a name="1.0.1"></a>
## [1.0.1](https://github.com/bmartinson/ngx-draggable-dom/compare/1.0.0...1.0.1) (2019-02-15)

#### Overview
+ This update makes it so the class `ng-dragging` is added to the element that the user is interacting with (the directed element or the set handle) as they are moving and removed when they stop. This was you can more easily style movement classes.

#### Enhancements
+ When you interact with an element that is using the directive, the `ng-dragging` class is added to the element. It is then removed when the user stops dragging the element. You may use this class style name along with the already existing `ng-draggable` to style your elements interactivity how you want.

<a name="1.0.0"></a>
## [1.0.0](https://github.com/bmartinson/ngx-draggable-dom/compare/0.0.1...1.0.0) (2019-02-14)

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

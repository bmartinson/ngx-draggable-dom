import { NgxDraggablePoint } from '../classes/ngx-draggable-point';
import { NgxDraggableRect } from '../classes/ngx-draggable-rect';

/**
 * Exported functions that are used to help with various mathematical calculations.
 */

/* * * * * Related Enums * * * * */

export enum ElementHandle {
  TL = 'tl',
  TR = 'tr',
  BL = 'bl',
  BR = 'br',
  L = 'ml',
  R = 'mr',
  T = 'mt',
  B = 'mb',
}

/* * * * * Helper Functions * * * * */

/**
 * Determines if a given point resides inside of the bounds rectangle that is also provided. This determination is
 * calculated within a zero degree orientation coordinate space, therefore, the bounds rectangle that is provided
 * should already be in a normalized size when provided.
 *
 * Also, please note that this logic will treat the one pixel edge of the bounds rectangle as being outside of the
 * boundaries for the purpose of analyzing boundaries.
 *
 * @param point The point to check.
 * @param bounds The boundaries that define where we want to check where the point resides.
 * @return True if the point resides within the bounds.
 */
export function isPointInsideBounds(point: NgxDraggablePoint, bounds: ClientRect): boolean {
  return (point.x > bounds.left && point.x < bounds.left + bounds.width &&
    point.y > bounds.top && point.y < bounds.top + bounds.height);
}

/**
 * Rotates a given NgxDraggablePoint around another pivot NgxDraggablePoint.
 *
 * @param point The point to be rotated.
 * @param pivot The pivot point that we are rotating the NgxDraggablePoint, point, around.
 * @param angle The angle at which we want to rotate the NgxDraggablePoint, point, around the pivot point.
 */
export function rotatePoint(point: NgxDraggablePoint, pivot: NgxDraggablePoint, angle: number): NgxDraggablePoint {
  const radians: number = angle * (Math.PI / 180);
  const rotatedX: number = Math.cos(radians) * (point.x - pivot.x) - Math.sin(radians) * (point.y - pivot.y) + pivot.x;
  const rotatedY: number = Math.sin(radians) * (point.x - pivot.x) + Math.cos(radians) * (point.y - pivot.y) + pivot.y;

  return new NgxDraggablePoint(rotatedX, rotatedY);
}

/**
 * Calculates the linear distance between two provided points.
 *
 * @param p0 The first point.
 * @param p1 The second point.
 */
export function getDistanceBetweenPoints(p0: NgxDraggablePoint, p1: NgxDraggablePoint): number {
  return Math.sqrt(
    ((p1.x - p0.x) * (p1.x - p0.x)) +
    ((p1.y - p0.y) * (p1.y - p0.y))
  );
}

/**
 * Find the coordinate point of the bounding box as defined by w and h and rotated by rotation degrees around point p0.
 *
 * @param p0 The center point of origin we are rotating around.
 * @param w The width of the bounding box we are calculating.
 * @param h The height of the bounding box we are calculating.
 * @param rotation The degrees of rotation being applied to the box.
 * @param coordinate The coordinate you would like "tl", "t", "tr", "r", "br", "b", "bl", "l"
 * @return The requested point.
 */
export function getTransformedCoordinate(
  p0: NgxDraggablePoint,
  w: number,
  h: number,
  rotation: number,
  coordinate: ElementHandle = ElementHandle.TL,
): NgxDraggablePoint {
  let newP: NgxDraggablePoint = new NgxDraggablePoint(p0.x - (w / 2), p0.y - (h / 2));

  let p: NgxDraggablePoint;
  if (coordinate === ElementHandle.TL) {
    p = new NgxDraggablePoint(newP.x, newP.y);
  } else if (coordinate === ElementHandle.TR) {
    p = new NgxDraggablePoint(newP.x + w, newP.y);
  } else if (coordinate === ElementHandle.BL) {
    p = new NgxDraggablePoint(newP.x, newP.y + h);
  } else if (coordinate === ElementHandle.BR) {
    p = new NgxDraggablePoint(newP.x + w, newP.y + h);
  } else if (coordinate === ElementHandle.L) {
    p = new NgxDraggablePoint(newP.x, newP.y + (h / 2));
  } else if (coordinate === ElementHandle.R) {
    p = new NgxDraggablePoint(newP.x + w, newP.y + (h / 2));
  } else if (coordinate === ElementHandle.T) {
    p = new NgxDraggablePoint(newP.x + (w / 2), newP.y);
  } else if (coordinate === ElementHandle.B) {
    p = new NgxDraggablePoint(newP.x + (w / 2), newP.y + h);
  } else {
    return null;
  }

  const theta: number = rotation * Math.PI / 180;

  // calculate the new coordinate point with rotation applied
  const p0p: NgxDraggablePoint = new NgxDraggablePoint(newP.x + (w / 2), newP.y + (h / 2));
  newP = new NgxDraggablePoint(
    ((p.x - p0p.x) * Math.cos(theta)) - ((p.y - p0p.y) * Math.sin(theta)) + p0p.x,
    ((p.x - p0p.x) * Math.sin(theta)) + ((p.y - p0p.y) * Math.cos(theta)) + p0p.y,
  );

  return newP;
}

/**
 * Calculates the bounding box for a given element defined by a center point, width, height, and rotation.
 *
 * @param p0 The center of the object that we need to find the bounding box for.
 * @param w The width of the rectangle.
 * @param h The height of the rectangle.
 * @param rotation The rotation of the defined rectangle.
 * @return The bounding box rectangle.
 */
export function getBoundingBox(p0: NgxDraggablePoint, w: number, h: number, rotation: number): ClientRect {
  // get the non rotated top left corner of the object
  const pTL: NgxDraggablePoint = new NgxDraggablePoint(p0.x - (w / 2), p0.y - (h / 2));

  // get the transformed points around the center point
  const tl1: NgxDraggablePoint = getTransformedCoordinate(p0, w, h, rotation, ElementHandle.TL);
  const tr1: NgxDraggablePoint = getTransformedCoordinate(p0, w, h, rotation, ElementHandle.TR);
  const br1: NgxDraggablePoint = getTransformedCoordinate(p0, w, h, rotation, ElementHandle.BR);
  const bl1: NgxDraggablePoint = getTransformedCoordinate(p0, w, h, rotation, ElementHandle.BL);

  // calculate the horizontal and vertical translation to center the object back
  const pTransX: number = (tl1.x - pTL.x);
  const pTransY: number = (tl1.y - pTL.y);

  // calculate the rotated corners by factoring in the translations
  const tl2: NgxDraggablePoint = new NgxDraggablePoint(tl1.x - pTransX, tl1.y - pTransY);
  const tr2: NgxDraggablePoint = new NgxDraggablePoint(tr1.x - pTransX, tr1.y - pTransY);
  const br2: NgxDraggablePoint = new NgxDraggablePoint(br1.x - pTransX, br1.y - pTransY);
  const bl2: NgxDraggablePoint = new NgxDraggablePoint(bl1.x - pTransX, bl1.y - pTransY);

  // calculate the bounding box top left and bottom right points
  const bbPTL: NgxDraggablePoint = new NgxDraggablePoint(Number.MAX_VALUE, Number.MAX_VALUE);
  const bbPBR: NgxDraggablePoint = new NgxDraggablePoint(Number.MIN_VALUE, Number.MIN_VALUE);
  const pArr: NgxDraggablePoint[] = [tl2, tr2, br2, bl2];
  for (const curP of pArr) {
    if (curP.x < bbPTL.x) {
      bbPTL.x = curP.x;
    }
    if (curP.x > bbPBR.x) {
      bbPBR.x = curP.x;
    }

    if (curP.y < bbPTL.y) {
      bbPTL.y = curP.y;
    }
    if (curP.y > bbPBR.y) {
      bbPBR.y = curP.y;
    }
  }

  return new NgxDraggableRect(bbPTL.x, bbPTL.y, bbPBR.x - bbPTL.x, bbPBR.y - bbPTL.y);
}

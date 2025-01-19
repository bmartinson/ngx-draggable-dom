/**
 * Helper functions that are used to traverse the DOM and perform other helpful tasks.
 */

export class NgxDraggableDomUtilities {
  /**
   * Calculates the computed transform matrix for a given element.
   *
   * @param el The html element that we want to find the computed transform matrix for.
   * @return The computed transform matrix as an array of numbers.
   */
  public static getTransformMatrixForElement(el: HTMLElement): number[] {
    // create the numerical matrix we will use
    const matrix: number[] = [1, 0, 0, 1, 0, 0];

    if (window) {
      // get the computed transform style
      let transform: string = window.getComputedStyle(el, null).getPropertyValue('transform');

      // strip non matrix values from the string
      transform = transform
        .replace(/matrix/g, '')
        .replace(/\(/g, '')
        .replace(/\)/g, '')
        .replace(/ /g, '');

      // if we have a transform set, convert the string matrix to a numerical one
      if (transform !== 'none') {
        // split the string based on commas
        let transformMatrix: string[] | null = transform.split(',');

        // convert the values of the matrix to numbers and add to our numerical matrix
        for (let i = 0; i < transformMatrix.length; i++) {
          matrix[i] = +transformMatrix[i];
        }
        transformMatrix = null;
      }
    }

    return matrix;
  }

  /**
   * Calculates the current rotation (in degrees) for a given HTMLElement using the computed transform style.
   *
   * @param el The HTMLElement to find the current rotation for.
   */
  public static getRotationForElement(el: HTMLElement): number {
    if (!el) {
      return 0;
    }

    // get the computed transform style matrix
    const matrix: number[] = NgxDraggableDomUtilities.getTransformMatrixForElement(el);

    // calculate the rotation in degrees based on the transform matrix
    return (Math.atan2(matrix[1], matrix[0]) * 180) / Math.PI;
  }

  /**
   * Finds the overall computed rotation of the element including parent nodes so we can get an accurate
   * reading on the visual rotation of the element so we can appropriately adjust matrix translation
   * adjustments.
   *
   * @return The overall rotation of all parent nodes.
   */
  public static getTotalRotationForElement(node: HTMLElement | null, rotation = 0): number {
    // if we can't calculate the computed style or we have no node to analyze, return the current calculated rotation
    if (!node || !window) {
      return rotation;
    }

    // if we have reached the body, stop processing beyond here
    if (node.nodeName === 'BODY') {
      return rotation + NgxDraggableDomUtilities.getRotationForElement(node);
    }

    // search up the DOM tree calculating the rotation
    return NgxDraggableDomUtilities.getTotalRotationForElement(
      node.parentElement,
      rotation + NgxDraggableDomUtilities.getRotationForElement(node)
    );
  }
}

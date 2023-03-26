/**
 * Adds an element to an array and returns the element's index.
 * @param array 
 * @param element 
 * @param checkDuplicates 
 * @returns 
 * @private
 */
function addToArray<T>(array: T[], element: T, checkDuplicates = false) : number {
  if (checkDuplicates) {
    const index = array.indexOf(element);
    if (index >= 0) {
      return index;
    }
  }

  array.push(element);

  return array.length - 1;
}

export default addToArray;

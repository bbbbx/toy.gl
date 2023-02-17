/**
 * @public
 */
export default function defined(value): boolean {
  if (value === undefined || value === null) {
    return false;
  }
  return true;
}

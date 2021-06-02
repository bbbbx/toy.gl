// see https://stackoverflow.com/questions/24048547/checking-if-an-object-is-array-like
function isArrayLike(item) {
  return (
    Array.isArray(item) || 
    (!!item &&
      typeof item === "object" &&
      typeof (item.length) === "number" && 
      (item.length === 0 ||
        (item.length > 0 && 
        (item.length - 1) in item)
      )
    )
  );
}

export default isArrayLike;

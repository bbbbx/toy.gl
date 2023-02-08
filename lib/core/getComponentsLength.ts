import PixelFormat from "./PixelFormat";

function getComponentsLength(pixelFormat: PixelFormat): number {
switch (pixelFormat) {
    case PixelFormat.RGBA:
    return 4;
    case PixelFormat.RGB:
    return 3;
    case PixelFormat.LUMINANCE_ALPHA:
    return 2;
    case PixelFormat.LUMINANCE:
    case PixelFormat.ALPHA:
    return 1;
    default:
    return 1;
}
}
export default getComponentsLength;
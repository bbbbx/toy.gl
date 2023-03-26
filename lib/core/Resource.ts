import Uri from "urijs";
import defined from "./defined";
import defaultValue from "./defaultValue";
import getAbsoluteUri from "./getAbsoluteUri";

const dataUriRegex = /^data:/i;
function isDataUri(uri: string): boolean {
  return dataUriRegex.test(uri);
}

class Resource {
  _url: string;
  _queryParameters: { [key: string] : string };

  public get url() : string { return this._url; }
  public get isDataUri() : boolean { return isDataUri(this._url); }

  constructor(options?: string | {
    url?: string,
    header?,
    queryParameters?,
  }) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    if (typeof options === 'string') {
      options = {
        url: options,
      };
    }

    this._queryParameters = defaultValue(options.queryParameters, {});

    const uri = new Uri(options.url);

    // Remove the fragment as it's not sent with a request
    uri.fragment('');

    parseQuery(uri, this, true, true);

    this._url = uri.toString();
  }

  clone(result = new Resource({
    url: this._url
  })): Resource {

    result._url = this._url;

    return result;
  }

  /**
   * Returns the url, optional with the query string and processed by a proxy.
   * @param query - If true, the query string is included.
   * @param proxy - If true, the url is processed by the proxy object, if defined.
   * @returns 
   */
  getUrlComponent(query: boolean, proxy: boolean) {
    if (this.isDataUri) {
      return this._url;
    }

    const uri = new Uri(this._url);

    if (query) {
      stringifyQuery(uri, this);
    }

    // objectToQuery escapes the placeholders.  Undo that.
    const url = uri.toString().replace(/%7B/g, '{').replace(/%7D/g, '}');

    // templateValues
    // proxy

    return url;
  }

  fetchArrayBuffer() {
    return fetch(this._url).then(response => response.arrayBuffer());
  }

  fetchImage(options: {
    preferImageBitmap?: boolean,
    preferBlob?: boolean,
    flipY?: boolean,
    skipColorSpaceConversion?: boolean,
  }) {
    const preferImageBitmap = defaultValue(options.preferImageBitmap, false);
    const preferBlob = defaultValue(options.preferBlob, false);
    const flipY = defaultValue(options.flipY, false);
    const skipColorSpaceConversion = defaultValue(options.skipColorSpaceConversion, false);

    return fetchImage({
      resource: this,
      flipY: flipY,
      skipColorSpaceConversion: skipColorSpaceConversion,
      preferImageBitmap: preferImageBitmap,
    });
  }

  getDerivedResource(options: {
    url?: string,
    preserveQueryParameters?: boolean,
    queryParameters?,
  }) {
    const derivedResource = this.clone();

    if (defined(options.url)) {
      const uri = new Uri(options.url);

      const preserveQueryParameters = defaultValue(options.preserveQueryParameters, false);
      parseQuery(uri, derivedResource, true, preserveQueryParameters);

      // Remove the fragment as it's not sent with a request
      uri.fragment('');

      if (uri.scheme() !== '') {
        derivedResource._url = uri.toString();
      } else {
        derivedResource._url = uri
          .absoluteTo(new Uri(getAbsoluteUri(this._url)))
          .toString();
      }
    }

    return derivedResource;
  }

  static fetchArrayBuffer(options: ConstructorParameters<typeof Resource>[0]) {
    const resource = new Resource(options);
    return resource.fetchArrayBuffer();
  }

  static createImageBitmapFromBlob(blob: Blob, options: {
    flipY: boolean,
    premultiplyAlpha: boolean,
    skipColorSpaceConversion: boolean,
  }) {
    return createImageBitmap(blob, {
      // FIXME: restoring "none" for the short term
      // See https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/1507
      imageOrientation: options.flipY ? 'flipY' : 'none' as ImageOrientation,
      premultiplyAlpha: options.premultiplyAlpha ? 'premultiply' : 'none',
      colorSpaceConversion: options.skipColorSpaceConversion ? 'none' : 'default',
    });
  }

  static createIfNeeded(resource: Resource | string) {
    if (resource instanceof Resource) {
      return resource.getDerivedResource({

      });
    }

    if (typeof resource !== 'string') {
      return resource;
    }

    return new Resource({
      url: resource,
    });
  }

  /**
   * A helper function to check whether createImageBitmap supports passing ImageBitmapOptions.
   */
  static supportsImageBitmapOptions() : Promise<boolean> {
    if (defined(supportsImageBitmapOptionsPromise)) {
      return supportsImageBitmapOptionsPromise;
    }

    if (typeof createImageBitmap !== 'function') {
      supportsImageBitmapOptionsPromise = Promise.resolve(true);
      return supportsImageBitmapOptionsPromise;
    }

    throw new Error("supportsImageBitmapOptions: To be implemented");
  }
}

let supportsImageBitmapOptionsPromise;

function fetchImage(options: {
  resource: Resource,
  flipY: boolean,
  skipColorSpaceConversion: boolean,
  preferImageBitmap: boolean,
}) : Promise<ImageBitmap> {
  const resource = options.resource;
  const flipY = options.flipY;
  const skipColorSpaceConversion = options.skipColorSpaceConversion;
  const preferImageBitmap = options.preferImageBitmap;

  return fetch(resource._url)
    .then(r => r.blob())
    .then(function (blob) {
      return Resource.createImageBitmapFromBlob(blob, {
        flipY: flipY,
        skipColorSpaceConversion: skipColorSpaceConversion,
        premultiplyAlpha: false,
      });
    });
}

function parseQuery(uri: Uri, resource: Resource, merge: boolean, preserveQueryParameters: boolean) {
  const queryString = uri.query();
  if (queryString.length === 0) {
    return {};
  }

  // TODO:
  throw new Error("parseQuery: To be implemented");
}

function stringifyQuery(uri: Uri, resource: Resource) {
  const queryObject = resource._queryParameters;
  const keys = Object.keys(queryObject);

  // We have 1 key with an undefined value, so this is just a string, not key/value pairs
  if (keys.length === 1 && !defined(queryObject[keys[0]])) {
    uri.search(keys[0]);
  } else {
    throw new Error("stringifyQuery: To be implemented");
    // uri.search(objectToQuery(queryObject))
  }
}

export default Resource;

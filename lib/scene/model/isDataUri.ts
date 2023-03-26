const dataUriRegex = /^data:/i;

function isDataUri(uri: string) : boolean {
  return dataUriRegex.test(uri);
}

export default isDataUri;

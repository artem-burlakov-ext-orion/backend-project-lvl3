const getImageLocalSrc = (url, src) => join(getBaseDirPath(url), getImageFilePath(src));
const getImageFullPath = (url, dir, src) => join(dir, getBaseDirPath(url), getImageFilePath(src));
const getImageFilePath = (src) => {
  const arr = src.split('/');
  return arr[arr.length - 1];
};
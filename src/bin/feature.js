const getResources = ($) => {
  const resources = [];
  const tags = { 
    link: 'href',
    script: 'src',
  };
  Object.entries(tags).reduce((acc, [key, value]) => {
    $(`${key}[${value}]`).attr(value, (i, elem) => {
      const data = new URL(elem, url);
      if (!isLocalResource(data, urlData.origin)) {
        return elem;
      }
      const localHref = getResourceRelativePath(data.href);
      const source = data.href;
      const target = getResourceFullPath(dir, localHref);
      return href.replace(/.*/, localHref)
      return [...acc, { source, target }];
    })
  }, []);
  const resourceHrefs = $('link[href]');
  resourceHrefs.attr('href', (i, href) => {
    const data = new URL(href, url);
    if (!isLocalResource(data, urlData.origin)) {
      return href;
    }
    const localHref = getResourceRelativePath(data.href);
    const source = data.href;
    const target = getResourceFullPath(dir, localHref);
    resources.push({
      source,
      target,
    });
    return href.replace(/.*/, localHref);
  });

}
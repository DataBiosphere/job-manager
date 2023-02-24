(window.opener || window.parent).postMessage(
  location.hash || "#" + location.search,
  location.origin
);

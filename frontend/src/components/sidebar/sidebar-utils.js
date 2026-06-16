export function isNavItemActive(pathname, path) {
  if (path === '/' || path === '/admin/dashboard') {
    return pathname === '/' || pathname === '/admin/dashboard';
  }
  if (path === '/leads') return pathname === '/leads';
  return pathname === path || pathname.startsWith(`${path}/`);
}

function matchesQuery(text, query) {
  return text?.toLowerCase().includes(query);
}

export function filterNavItemsBySearch(items, query) {
  const q = query?.trim().toLowerCase();
  if (!q) return items;

  return items.reduce((acc, item) => {
    if (item.section) {
      return acc;
    }

    if (item.children) {
      const groupMatch = matchesQuery(item.label, q);
      const filteredChildren = item.children.filter((c) => matchesQuery(c.label, q));
      if (groupMatch || filteredChildren.length) {
        acc.push({
          ...item,
          children: groupMatch ? item.children : filteredChildren,
        });
      }
      return acc;
    }

    if (matchesQuery(item.label, q)) {
      acc.push(item);
    }
    return acc;
  }, []);
}

export function injectSectionHeaders(items) {
  const result = [];
  let lastSection = null;

  for (const item of items) {
    if (item.section && item.section !== lastSection) {
      result.push({ type: 'section', label: item.section });
      lastSection = item.section;
    }
    result.push(item);
  }

  return result;
}

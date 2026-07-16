function idOf(doc) {
  return doc?._id?.toString?.() || doc?.id || null;
}

function baseDoc(doc = {}) {
  return {
    id: idOf(doc),
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  };
}

function applyAllowed(target, body, allowed = []) {
  for (const key of allowed) {
    if (body[key] !== undefined) target[key] = body[key];
  }
  return target;
}

module.exports = { idOf, baseDoc, applyAllowed };

function resolvePackageReference(packageId) {
  if (!packageId) return null;
  const id = String(packageId);
  return /^[a-fA-F0-9]{24}$/.test(id) ? id : null;
}

module.exports = { resolvePackageReference };

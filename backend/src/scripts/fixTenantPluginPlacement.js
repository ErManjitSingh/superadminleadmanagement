const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../models');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));

for (const file of files) {
  const fp = path.join(dir, file);
  let content = fs.readFileSync(fp, 'utf8');
  if (!content.includes('tenantPlugin')) continue;

  const mainSchemaMatch = content.match(/const (\w+Schema) = new mongoose\.Schema\([\s\S]*?\n\);/g);
  if (!mainSchemaMatch) continue;

  const lastSchemaDef = mainSchemaMatch[mainSchemaMatch.length - 1];
  const mainVarMatch = lastSchemaDef.match(/const (\w+) = new mongoose\.Schema/);
  if (!mainVarMatch) continue;
  const mainSchemaVar = mainVarMatch[1];

  content = content.replace(/\n\w+Schema\.plugin\(tenantPlugin\);;?\n/g, '\n');
  content = content.replace(/\n\w+Schema\.plugin\(tenantPlugin\);\n/g, '\n');

  if (!content.includes(`${mainSchemaVar}.plugin(tenantPlugin)`)) {
    const exportIdx = content.indexOf('module.exports = mongoose.model');
    const before = content.slice(0, exportIdx).trimEnd();
    content = `${before}\n\n${mainSchemaVar}.plugin(tenantPlugin);\n\n${content.slice(exportIdx)}`;
  }

  content = content.replace(/\.plugin\(tenantPlugin\);;/g, '.plugin(tenantPlugin);');
  fs.writeFileSync(fp, content);
  console.log('fixed', file, '->', mainSchemaVar);
}

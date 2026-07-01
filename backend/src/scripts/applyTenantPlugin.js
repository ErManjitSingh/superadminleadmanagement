const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../models');
const pluginImport = "const { tenantPlugin } = require('../config/tenantPlugin');";
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));
let patched = 0;

for (const file of files) {
  const fp = path.join(dir, file);
  let content = fs.readFileSync(fp, 'utf8');
  if (content.includes('tenantPlugin')) continue;

  const schemaMatch = content.match(/const (\w+) = new mongoose\.Schema\(/);
  if (!schemaMatch) continue;
  const schemaVar = schemaMatch[1];
  if (!content.includes('module.exports = mongoose.model')) continue;

  if (!content.includes(pluginImport)) {
    const marker = "const mongoose = require('mongoose');";
    const idx = content.indexOf(marker);
    if (idx === -1) continue;
    const insertAt = idx + marker.length + 1;
    content = `${content.slice(0, insertAt)}\n${pluginImport}${content.slice(insertAt)}`;
  }

  const exportIdx = content.indexOf('module.exports = mongoose.model');
  const beforeExport = content.slice(0, exportIdx).trimEnd();
  const pluginLine = `${schemaVar}.plugin(tenantPlugin);`;
  if (!beforeExport.includes(pluginLine)) {
    content = `${beforeExport}\n\n${pluginLine};\n\n${content.slice(exportIdx)}`;
  }

  fs.writeFileSync(fp, content);
  patched += 1;
  console.log('patched', file);
}

console.log('total patched:', patched);

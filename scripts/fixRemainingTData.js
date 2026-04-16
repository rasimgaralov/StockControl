const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    const p = path.join(__dirname, '../', filePath);
    if (!fs.existsSync(p)) return;
    let content = fs.readFileSync(p, 'utf-8');
    let changed = false;
    for (const [search, replace] of replacements) {
        if (content.includes(search)) {
            content = content.split(search).join(replace);
            changed = true;
        }
    }
    if (changed) {
        fs.writeFileSync(p, content, 'utf-8');
        console.log(`✅ Updated ${filePath}`);
    }
}

replaceInFile('app/transferler/page.js', [
  ["tData(getDeptName(tItem.fromDeptId), 'departments')", "getDeptName(tItem.fromDeptId, lang)"],
  ["tData(getDeptName(tItem.toDeptId), 'departments')", "getDeptName(tItem.toDeptId, lang)"],
  ["tData(d.name, 'departments')", "(d[`name_${lang}`] || d.name_en)"],
  ["tData(p.unit, 'units')", "(p[`unit_${lang}`] || p.unit_en)"]
]);

replaceInFile('app/fire-zayi/page.js', [
  ["tData(getDeptName(w.deptId), 'departments')", "getDeptName(w.deptId, lang)"],
  ["tData(w.reason, 'reasons')", "(w[`reason_${lang}`] || w.reason_en)"],
  ["tData(p.unit, 'units')", "(p[`unit_${lang}`] || p.unit_en)"],
  ["tData(d.name, 'departments')", "(d[`name_${lang}`] || d.name_en)"]
]);

replaceInFile('app/alarmlar/page.js', [
  ["tData(product?.unit, 'units')", "(product?.[`unit_${lang}`] || product?.unit_en)"],
  ["tData(editingProduct.unit, 'units')", "(editingProduct[`unit_${lang}`] || editingProduct.unit_en)"]
]);

replaceInFile('app/departmanlar/page.js', [
  ["tData(selectedDeptData.name, 'departments')", "(selectedDeptData[`name_${lang}`] || selectedDeptData.name_en)"],
  ["tData(p.unit, 'units')", "(p[`unit_${lang}`] || p.unit_en)"]
]);

const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    const p = path.join(__dirname, '../', filePath);
    if (!fs.existsSync(p)) return;
    let content = fs.readFileSync(p, 'utf-8');
    let changed = false;
    for (const [search, replace] of replacements) {
        if (content.includes(search)) {
            content = content.replaceAll(search, replace);
            changed = true;
        }
    }
    if (changed) {
        fs.writeFileSync(p, content, 'utf-8');
        console.log(`✅ Updated ${filePath}`);
    }
}

// 1. app/urunler/page.js
replaceInFile('app/urunler/page.js', [
    ["const { t, tData } = useLanguage();", "const { t, lang } = useLanguage();"],
    ["{tData(p.unit, 'units')}", "{p[`unit_${lang}`] || p.unit_en}"],
    ["{tData(p.supplier, 'suppliers')}", "{p[`supplier_${lang}`] || p.supplier_en}"],
    ["{tData(getDeptName(p.deptId), 'departments')}", "{getDeptName(p.deptId, lang)}"],
    ["{getDeptName(filterDept)}", "{getDeptName(filterDept, lang)}"],
    // the `<option>` uses d.name
    ["{d.icon} {d.name}", "{d.icon} {d[`name_${lang}`] || d.name_en}"],
    // The Add/Edit Modal
    ["value={formData.unit}", "value={formData.unit_en}"],
    ["setFormData({ ...formData, unit: e.target.value })", "setFormData({ ...formData, unit_en: e.target.value, unit_ar: e.target.value })"],
    ["value={formData.supplier}", "value={formData.supplier_en}"],
    ["setFormData({ ...formData, supplier: e.target.value })", "setFormData({ ...formData, supplier_en: e.target.value, supplier_ar: e.target.value })"]
]);

// 2. app/transferler/page.js
replaceInFile('app/transferler/page.js', [
    ["const { t, tData } = useLanguage();", "const { t, lang } = useLanguage();"],
    ["tData(getDeptName(t.fromDeptId), 'departments')", "getDeptName(t.fromDeptId, lang)"],
    ["tData(getDeptName(t.toDeptId), 'departments')", "getDeptName(t.toDeptId, lang)"],
    ["{d.icon} {d.name}", "{d.icon} {d[`name_${lang}`] || d.name_en}"]
]);

// 3. app/departmanlar/page.js
replaceInFile('app/departmanlar/page.js', [
    ["const { t, tData } = useLanguage();", "const { t, lang } = useLanguage();"],
    ["tData(dept.name, 'departments')", "(dept[`name_${lang}`] || dept.name_en)"],
    ["{tData(product.unit, 'units')}", "{product[`unit_${lang}`] || product.unit_en}"]
]);

// 4. app/fire-zayi/page.js
replaceInFile('app/fire-zayi/page.js', [
    ["const { t, tData } = useLanguage();", "const { t, lang } = useLanguage();"],
    ["tData(log.reason, 'reasons')", "(log[`reason_${lang}`] || log.reason_en)"],
    ["tData(getDeptName(log.deptId), 'departments')", "getDeptName(log.deptId, lang)"],
    ["tData(product.unit, 'units')", "product[`unit_${lang}`] || product.unit_en"],
    ["{d.icon} {d.name}", "{d.icon} {d[`name_${lang}`] || d.name_en}"],
    ["value={formData.reason}", "value={formData.reason_en}"],
    ["setFormData({ ...formData, reason: e.target.value })", "setFormData({ ...formData, reason_en: e.target.value, reason_ar: e.target.value })"]
]);

// 5. app/alarmlar/page.js
replaceInFile('app/alarmlar/page.js', [
    ["const { t, tData } = useLanguage();", "const { t, lang } = useLanguage();"],
    ["tData(getDeptName(product.deptId), 'departments')", "getDeptName(product.deptId, lang)"],
    ["tData(product.unit, 'units')", "product[`unit_${lang}`] || product.unit_en"]
]);


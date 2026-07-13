const fs = require('fs');
const path = require('path');
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            results.push(fullPath);
        }
    });
    return results;
}

walk('d:/sop-po-tool/src').forEach(f => {
    let c = fs.readFileSync(f, 'utf8');
    let orig = c;
    c = c.replace(/autoClose:/g, 'duration:');
    c = c.replace(/toast\.POSITION\.TOP_RIGHT/g, '"top-right"');
    c = c.replace(/toast\.POSITION\.TOP_CENTER/g, '"top-center"');
    c = c.replace(/toast\.POSITION\.BOTTOM_RIGHT/g, '"bottom-right"');
    c = c.replace(/toast\.POSITION\.BOTTOM_LEFT/g, '"bottom-left"');
    if (c !== orig) {
        fs.writeFileSync(f, c);
        console.log('Updated ' + f);
    }
});

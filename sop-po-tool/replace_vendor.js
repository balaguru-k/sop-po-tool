const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'src', 'views');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    if (!content.includes('<pre>{vendorName || ""}</pre>')) return;

    const originalContent = content;

    // Replace global
    content = content.replace(/<pre>\{vendorName\s*\|\|\s*""\}<\/pre>/g, '<VendorAvatar name={vendorName} />');

    if (content !== originalContent) {
        if (!content.includes('VendorAvatar')) {
            const importStmt = "import VendorAvatar from '../components/VendorAvatar';\n";
            const lastImportIndex = content.lastIndexOf('import ');
            if (lastImportIndex !== -1) {
                const endOfLastImport = content.indexOf('\n', lastImportIndex) + 1;
                content = content.slice(0, endOfLastImport) + importStmt + content.slice(endOfLastImport);
            } else {
                content = importStmt + content;
            }
        }
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Modified ${filePath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (file.endsWith('.jsx')) {
            processFile(fullPath);
        }
    }
}

walkDir(viewsDir);

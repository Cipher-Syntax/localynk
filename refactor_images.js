const fs = require('fs');
const path = require('path');

const dirsToProcess = ['app', 'components'];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Check if file contains 'Image' import from 'react-native'
    // This regex accounts for multiline imports and single/double quotes
    const rnImportRegex = /import\s+([^;]*?from\s+['"]react-native['"])/g;
    
    let hasImageImport = false;
    
    content = content.replace(rnImportRegex, (match, p1) => {
        const braceMatch = match.match(/\{([^}]*)\}/);
        if (braceMatch) {
            const inner = braceMatch[1];
            // Split by comma, but handle potential newlines and spaces
            const items = inner.split(',').map(s => s.trim()).filter(s => s.length > 0);
            const imageIndex = items.indexOf('Image');
            
            if (imageIndex !== -1) {
                hasImageImport = true;
                items.splice(imageIndex, 1);
                
                if (items.length > 0) {
                    // Reconstruct the import
                    return match.replace(inner, ' ' + items.join(', ') + ' ');
                } else {
                    // No items left in braces
                    if (match.includes(',')) {
                        // Default import still exists, e.g., import React, { Image } from 'react-native'
                        return match.replace(/,\s*\{[^}]*\}\s*/, ' ');
                    } else {
                        // Remove the whole import
                        return '';
                    }
                }
            }
        }
        return match;
    });

    if (hasImageImport) {
        // Add expo-image import at the top (after any "use client" if it exists, but generally just at the top)
        // It's safer to put it at the very top.
        content = `import { Image } from 'expo-image';\n` + content;
        
        // Replace resizeMode= with contentFit= within <Image tags
        // Handle potentially multiline tags
        content = content.replace(/(<Image[\s>][^>]*?)resizeMode=/g, '$1contentFit=');

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

function traverseDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            processFile(fullPath);
        }
    }
}

dirsToProcess.forEach(dir => {
    traverseDir(path.join(__dirname, dir));
});
console.log('Refactoring complete.');

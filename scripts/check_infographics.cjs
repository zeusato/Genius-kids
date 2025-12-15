const fs = require('fs');
const path = require('path');

const animalsPath = path.join(__dirname, '../src/data/evolution/animals.ts');
const fileContent = fs.readFileSync(animalsPath, 'utf8');

// Function to loosely parse the objects to find IDs and check for infographicUrl
function checkInfographics(content) {
    const lines = content.split('\n');
    let missingInfographics = [];
    let currentId = null;
    let hasInfographic = false;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Very basic parsing logic
        // Find id
        const idMatch = line.match(/^\s*id:\s*'([^']+)'/);
        if (idMatch) {
            // If we were tracking an ID, check if it had an infographic before moving to next
            // Note: This simple logic is flawed for nested objects because a new ID means a child,
            // but the parent might not have finished.
            // A better way is to regex split the whole file by "id:" and check the content block?

            // Let's use a cleaner regex approach on the whole file string for each object block
        }
    }

    // Alternative: Regex all IDs, then manually check proximity?
    // Let's try to just find all occurrences of "id: '...'" and see if "infographicUrl" appears before the next "id:" or "}," at the same indentation?
    // Actually, "simpler" is to use the fact that I read the file and can just process it in text.

    // Let's iterate line by line.
    // If we see `id: 'foo'`, we store 'foo'.
    // If we see `infographicUrl:`, we mark the *current scope* as having it.
    // But scopes are nested.

    // Stack-based approach
    let stack = [];
    // Stack items: { id: string, hasInfographic: boolean, indent: number }

    lines.forEach((line, index) => {
        const indent = line.search(/\S|$/); // First non-whitespace
        const trimmed = line.trim();

        if (trimmed.startsWith("id: '")) {
            const id = trimmed.match(/id: '([^']+)'/)[1];
            // push new node
            stack.push({ id, hasInfographic: false, line: index + 1 });
        }

        if (trimmed.startsWith("infographicUrl:")) {
            if (stack.length > 0) {
                // The current active node (top of stack) has an infographic
                // Wait, if we are in a child node, the top of stack is the child.
                // This assumes infographicUrl comes *after* id, which is true in my edits.
                stack[stack.length - 1].hasInfographic = true;
            }
        }

        // Use indentation or braces to detect end of node?
        // In the format, `},` or `}` usually closes a node.
        // But `children: [` starts a new block.
        // The structure is:
        // {
        //   id: ...
        //   children: [
        //      { ... }
        //   ]
        // }
        // The closing brace `}` matches the opening brace.

        // Let's just use strict regex on the file content.
        // Find all text blocks that look like an object definition.
        // This is hard with regex. 

        // Let's just output the lines with "id:" and whether "infographicUrl" is in the next few lines?
        // No, let's use the valid JS nature.
        // I will copy the file content, remove lines with "import" and "export", remove ": EvolutionNode", and eval it.
    });
}

// Strategy 2: Text processing to valid JS
let jsContent = fileContent;
jsContent = jsContent.replace(/import .*/g, '');
jsContent = jsContent.replace(/export const animalia: EvolutionNode =/, 'const animalia =');
jsContent = jsContent.replace(/: [A-Z][a-zA-Z]+/g, ''); // Remove type annotations like ": string" if any?
// The file has very few type annotations other than EvolutionNode.
// But wait, the keys don't have quotes? JS objects keys don't need quotes.
// The values are strings.
// Comments // need to be preserved or ignored.

// Let's try to eval it.
try {
    // Remove type annotation on the export line
    let cleanCode = fileContent
        .replace(/import .*?;/g, '')
        .replace(/export const animalia: EvolutionNode/, 'module.exports =')
        .replace(/id: string;/g, '') // remove interface if present? No, it imports types.
        ;

    // There are no type annotations inside the object literal in this file, except maybe implicit ones?
    // Actually, I saw `type: 'kingdom'`, that is valid JS.
    // I did NOT see explicit types like `id: string`. 
    // So stripping the first few lines is enough.

    const animalia = (() => {
        // We need to handle the module format.
        // Let's just wrap it.
        const module = {};
        // Strip the import
        let code = fileContent
            .replace(/import\s+.*?;/s, '')
            .replace(/export\s+const\s+animalia\s*:\s*EvolutionNode\s*=\s*/, 'return ')
            .replace(/;$/, ''); // Remove trailing semicolon

        // One catch: `era: 'Devonian (365 triệu năm trước)'` etc are fine.
        // `color: '#f43f5e', // Rose` comments are fine.

        // Dangerous eval, but local file:
        return new Function(code)();
    })();

    // Now traverse
    const missing = [];
    function traverse(node) {
        if (!node.infographicUrl) {
            missing.push({ id: node.id, label: node.label });
        }
        if (node.children) {
            node.children.forEach(traverse);
        }
    }

    traverse(animalia);

    console.log("Missing Infographics:");
    if (missing.length === 0) {
        console.log("None! All nodes have infographics.");
    } else {
        missing.forEach(m => console.log(`- ID: ${m.id} (${m.label})`));
    }

} catch (e) {
    console.error("Eval failed:", e.message);
    // Fallback?
}

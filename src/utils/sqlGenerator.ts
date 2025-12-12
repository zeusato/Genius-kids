import { EvolutionNode } from '@/src/data/evolutionData';

/**
 * Generates SQL INSERT statements from the recursive EvolutionNode data structure.
 * Useful for populating the database when the feature is ready for production.
 */
export const generateEvolutionSQL = (rootNode: EvolutionNode): string => {
    let sqlOutput = '-- Evolution Tree Data Migration\n\n';

    // Recursive function to traverse and generate SQL
    const traverse = (node: EvolutionNode, parentId: string | null = null) => {
        // Escape single quotes for SQL
        const safeLabel = node.label.replace(/'/g, "''");
        const safeDesc = node.description.replace(/'/g, "''");
        const safeEra = node.era.replace(/'/g, "''");
        const safeTraits = JSON.stringify(node.traits).replace(/'/g, "''");

        // 1. Insert Node
        sqlOutput += `
INSERT INTO evolution_nodes (id, parent_id, label, type, description, era, image_url, color, traits) 
VALUES ('${node.id}', ${parentId ? `'${parentId}'` : 'NULL'}, '${safeLabel}', '${node.type}', '${safeDesc}', '${safeEra}', ${node.imageUrl ? `'${node.imageUrl}'` : 'NULL'}, '${node.color}', '${safeTraits}');`;

        // 2. Insert Milestone if exists
        if (node.milestone) {
            const safeMilestoneLabel = node.milestone.label.replace(/'/g, "''");
            const safeMilestoneDesc = (node.milestone.description || '').replace(/'/g, "''");
            sqlOutput += `
INSERT INTO evolution_milestones (node_id, label, year, description)
VALUES ('${node.id}', '${safeMilestoneLabel}', '${node.milestone.year}', '${safeMilestoneDesc}');`;
        }

        sqlOutput += '\n';

        // 3. Recurse children
        if (node.children) {
            node.children.forEach(child => traverse(child, node.id));
        }
    };

    traverse(rootNode);
    return sqlOutput;
};

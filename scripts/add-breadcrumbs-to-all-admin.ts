/**
 * Add AdminBreadcrumb to all admin pages
 * Automatically updates all admin pages that don't have breadcrumbs yet
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const adminDir = path.join(process.cwd(), 'app', 'admin');

// Find all page.tsx files in admin directory
const pageFiles = glob.sync('**/page.tsx', { cwd: adminDir, absolute: true });

console.log(`🔍 Found ${pageFiles.length} admin page files\n`);

let updatedCount = 0;
let skippedCount = 0;

for (const filePath of pageFiles) {
  // Skip the main admin/page.tsx (dashboard)
  if (filePath.endsWith('app\\admin\\page.tsx') || filePath.endsWith('app/admin/page.tsx')) {
    console.log(`⏭️  Skipped: ${path.relative(adminDir, filePath)} (dashboard page)`);
    skippedCount++;
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if already has AdminBreadcrumb import
  if (content.includes('AdminBreadcrumb')) {
    console.log(`✓ Already has breadcrumb: ${path.relative(adminDir, filePath)}`);
    skippedCount++;
    continue;
  }

  let modified = false;

  // Add import if not present
  if (!content.includes('@/components/admin/AdminBreadcrumb')) {
    // Find last import statement
    const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
    if (importLines.length > 0) {
      const lastImportLine = importLines[importLines.length - 1];
      content = content.replace(
        lastImportLine,
        lastImportLine + '\nimport AdminBreadcrumb from \'@/components/admin/AdminBreadcrumb\';'
      );
      modified = true;
    }
  }

  // Add component to JSX - look for common container patterns
  const patterns = [
    { 
      search: /(<div className="(?:container|max-w|p-8).*?">\s*)(\/\* Header \*\/)/,
      replace: '$1<AdminBreadcrumb />\n        $2'
    },
    {
      search: /(<div className="(?:container|max-w|p-8).*?">\s*)(<div className="mb-8">)/,
      replace: '$1<AdminBreadcrumb />\n        $2'
    },
    {
      search: /(<div className="(?:container|max-w|p-8).*?">\s*)(<h1)/,
      replace: '$1<AdminBreadcrumb />\n        $2'
    }
  ];

  for (const pattern of patterns) {
    if (pattern.search.test(content)) {
      content = content.replace(pattern.search, pattern.replace);
      modified = true;
      break;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${path.relative(adminDir, filePath)}`);
    updatedCount++;
  } else {
    console.log(`⚠️  Could not update: ${path.relative(adminDir, filePath)} (pattern not found)`);
    skippedCount++;
  }
}

console.log(`\n✨ Done!`);
console.log(`   Updated: ${updatedCount} files`);
console.log(`   Skipped: ${skippedCount} files`);


/**
 * Fix all admin API endpoints to use new permission system
 * Replaces old isAdmin(email) pattern with checkPermission
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const apiAdminDir = path.join(process.cwd(), 'app', 'api', 'admin');
const routeFiles = glob.sync('**/route.ts', { cwd: apiAdminDir, absolute: true });

console.log(`🔍 Found ${routeFiles.length} admin API route files\n`);

let fixedCount = 0;
let skippedCount = 0;

for (const filePath of routeFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Skip if already uses checkPermission
  if (content.includes('checkPermission')) {
    console.log(`✓ Already using new auth: ${path.relative(apiAdminDir, filePath)}`);
    skippedCount++;
    continue;
  }

  // Skip if doesn't use old pattern
  if (!content.includes('isAdmin(')) {
    console.log(`⏭️  No auth needed: ${path.relative(apiAdminDir, filePath)}`);
    skippedCount++;
    continue;
  }

  // Replace imports
  content = content.replace(
    /import \{ auth \} from ['"]@\/lib\/auth['"];?\s*/g,
    ''
  );
  content = content.replace(
    /import \{ isAdmin \} from ['"]@\/lib\/auth-admin['"];?\s*/g,
    ''
  );
  content = content.replace(
    /import \{ headers \} from ['"]next\/headers['"];?\s*/g,
    ''
  );

  // Add checkPermission import if not present
  if (!content.includes("from '@/lib/permissions'")) {
    const firstImport = content.indexOf('import');
    const endOfFirstImport = content.indexOf(';', firstImport) + 1;
    content = content.slice(0, endOfFirstImport) + 
              "\nimport { checkPermission } from '@/lib/permissions';" +
              content.slice(endOfFirstImport);
  }

  // Determine permission name based on path
  let permissionName = 'Dashboard';
  if (filePath.includes('b2b')) permissionName = 'B2B';
  else if (filePath.includes('returns')) permissionName = 'Returns';
  else if (filePath.includes('translations')) permissionName = 'Translations';
  else if (filePath.includes('analytics')) permissionName = 'Analytics';

  // Replace auth checks - pattern 1: with session variable
  content = content.replace(
    /const session = await auth\.api\.getSession\(\{[^}]+\}\);?\s+if \(!session\?\.user\) \{[^}]+\}\s+if \(!isAdmin\(session\.user\.email\)\) \{[^}]+\}/gs,
    `const permissionCheck = await checkPermission(request, '${permissionName}', 'read');
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.message },
        { status: 403 }
      );
    }`
  );

  // Replace auth checks - pattern 2: combined
  content = content.replace(
    /const session = await auth\.api\.getSession\(\{[^}]+\}\);?\s+if \(!session \|\| !isAdmin\(session\.user\.email\)\) \{[^}]+\}/gs,
    `const permissionCheck = await checkPermission(request, '${permissionName}', 'read');
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.message },
        { status: 403 }
      );
    }`
  );

  // Remove session references in audit logs
  content = content.replace(/session\.user\.(id|email)/g, 'permissionCheck.user.$1');
  content = content.replace(/admin_email: session\?\.user\?\.email/g, '');
  
  // Check if modified
  if (content !== fs.readFileSync(filePath, 'utf8')) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${path.relative(apiAdminDir, filePath)}`);
    fixedCount++;
    modified = true;
  }

  if (!modified) {
    console.log(`⚠️  No changes: ${path.relative(apiAdminDir, filePath)}`);
    skippedCount++;
  }
}

console.log(`\n✨ Done!`);
console.log(`   Fixed: ${fixedCount} files`);
console.log(`   Skipped: ${skippedCount} files`);
console.log(`\n🔄 Restart your dev server for changes to take effect`);


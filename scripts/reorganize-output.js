const fs = require('fs-extra');
const path = require('path');

async function reorganizeOutput() {
  const outDir = path.join(__dirname, '../out');
  const tempDir = path.join(__dirname, '../temp-out');
  const assetsDir = path.join(outDir, 'assets');

  // Create temporary directory
  await fs.ensureDir(tempDir);

  // Create assets directory structure
  await fs.ensureDir(path.join(assetsDir, 'css'));
  await fs.ensureDir(path.join(assetsDir, 'js'));
  await fs.ensureDir(path.join(assetsDir, 'images'));
  await fs.ensureDir(path.join(assetsDir, 'fonts'));

  // Move static files to appropriate directories
  try {
    // Move CSS files
    await fs.copy(
      path.join(outDir, '_next/static/css'),
      path.join(assetsDir, 'css'),
      { overwrite: true }
    );

    // Move JS files
    const jsFiles = path.join(outDir, '_next/static/chunks');
    if (await fs.pathExists(jsFiles)) {
      await fs.copy(jsFiles, path.join(assetsDir, 'js'), { overwrite: true });
    }

    // Move media files
    const mediaDir = path.join(outDir, '_next/static/media');
    if (await fs.pathExists(mediaDir)) {
      await fs.copy(mediaDir, path.join(assetsDir, 'images'), { overwrite: true });
    }

    // Update HTML files to use new paths
    const htmlFiles = await fs.readdir(outDir);
    for (const file of htmlFiles) {
      if (file.endsWith('.html')) {
        let htmlContent = await fs.readFile(path.join(outDir, file), 'utf8');
        
        // Update paths
        htmlContent = htmlContent.replace(
          /_next\/static\/css\//g,
          'assets/css/'
        );
        htmlContent = htmlContent.replace(
          /_next\/static\/chunks\//g,
          'assets/js/'
        );
        htmlContent = htmlContent.replace(
          /_next\/static\/media\//g,
          'assets/images/'
        );

        await fs.writeFile(path.join(outDir, file), htmlContent);
      }
    }

    // Clean up
    await fs.remove(path.join(outDir, '_next'));
    console.log('Output directory reorganized successfully!');
  } catch (err) {
    console.error('Error reorganizing output:', err);
    process.exit(1);
  }
}

reorganizeOutput();

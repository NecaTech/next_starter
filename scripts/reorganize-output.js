const fs = require('fs-extra');
const path = require('path');

async function reorganizeOutput() {
  const outDir = path.join(__dirname, '../out');
  const assetsDir = path.join(outDir, 'assets');

  // Create assets directory structure
  await fs.ensureDir(path.join(assetsDir, 'css'));
  await fs.ensureDir(path.join(assetsDir, 'js'));
  await fs.ensureDir(path.join(assetsDir, 'images'));
  await fs.ensureDir(path.join(assetsDir, 'fonts'));

  try {
    // Move and rename static files
    const nextStaticDir = path.join(outDir, '_next/static');
    if (await fs.pathExists(nextStaticDir)) {
      // Move CSS files
      const cssDir = path.join(nextStaticDir, 'css');
      if (await fs.pathExists(cssDir)) {
        await fs.copy(cssDir, path.join(assetsDir, 'css'), { overwrite: true });
      }

      // Move JS files
      const chunksDir = path.join(nextStaticDir, 'chunks');
      if (await fs.pathExists(chunksDir)) {
        await fs.copy(chunksDir, path.join(assetsDir, 'js'), { overwrite: true });
      }

      // Move media files
      const mediaDir = path.join(nextStaticDir, 'media');
      if (await fs.pathExists(mediaDir)) {
        await fs.copy(mediaDir, path.join(assetsDir, 'images'), { overwrite: true });
      }

      // Copy build manifest and other necessary files
      const buildId = await fs.readdir(path.join(outDir, '_next/static'));
      for (const id of buildId) {
        if (id !== 'chunks' && id !== 'css' && id !== 'media') {
          const manifestDir = path.join(nextStaticDir, id);
          if (await fs.pathExists(manifestDir)) {
            await fs.copy(manifestDir, path.join(assetsDir, 'js'), { overwrite: true });
          }
        }
      }
    }

    // Update HTML files
    const processHtmlFile = async (filePath) => {
      let htmlContent = await fs.readFile(filePath, 'utf8');
      
      // Update paths in HTML
      htmlContent = htmlContent
        .replace(/\/_next\/static\/css\//g, '/assets/css/')
        .replace(/\/_next\/static\/chunks\//g, '/assets/js/')
        .replace(/\/_next\/static\/media\//g, '/assets/images/')
        .replace(/\/_next\/static\/[^/]+\//g, '/assets/js/')
        .replace(/="\/assets\//g, '="./assets/');

      await fs.writeFile(filePath, htmlContent);
    };

    // Process all HTML files recursively
    const processDirectory = async (dirPath) => {
      const items = await fs.readdir(dirPath);
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          await processDirectory(fullPath);
        } else if (item.endsWith('.html')) {
          await processHtmlFile(fullPath);
        }
      }
    };

    await processDirectory(outDir);

    // Clean up
    await fs.remove(path.join(outDir, '_next'));
    console.log('Output directory reorganized successfully!');
  } catch (err) {
    console.error('Error reorganizing output:', err);
    process.exit(1);
  }
}

reorganizeOutput();

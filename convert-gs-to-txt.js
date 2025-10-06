const fs = require('fs');
const path = require('path');

function convertGsToTxt(folderPath) {
  fs.readdir(folderPath, { withFileTypes: true }, (err, entries) => {
    if (err) {
      console.error('Failed to read folder: ' + folderPath, err);
      return;
    }

    entries.forEach((entry) => {
      const fullPath = path.join(folderPath, entry.name);

      if (entry.isDirectory()) {
        convertGsToTxt(fullPath);
      } else if (entry.isFile() && path.extname(entry.name) === '.gs') {
        fs.readFile(fullPath, 'utf8', (err, data) => {
          if (err) {
            console.error('Failed to read file: ' + fullPath, err);
            return;
          }

          const txtPath = fullPath.replace(/\.gs$/, '.txt');
          fs.writeFile(txtPath, data, 'utf8', (err) => {
            if (err) {
              console.error('Failed to write file: ' + txtPath, err);
              return;
            }

            console.log('Converted: ' + fullPath + ' → ' + txtPath);
          });
        });
      }
    });
  });
}

const rootFolder = process.argv[2] || 'src';
convertGsToTxt(rootFolder);

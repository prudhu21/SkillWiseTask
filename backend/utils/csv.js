const fs = require('fs');
const csv = require('csv-parser');

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv({ skipLines: 0, mapHeaders: ({ header }) => header.trim() }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

module.exports = { parseCSV };

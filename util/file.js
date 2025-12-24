const fs = require("fs");
const path = require("path");

const deleteFile = (filePath) => {
  // convert to absolute
  const fullPath = path.join(__dirname, "..", filePath);
  console.log(fullPath);
  fs.unlink(fullPath, (err) => {
    if (err) {
      console.log(" Delete failed! File not found", fullPath);
      return;
    }
    console.log(" File deleted", fullPath);
  });
};

module.exports = deleteFile;

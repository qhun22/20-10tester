const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(path.join(root, "css"), path.join(root, "public", "css"));
copyDir(path.join(root, "img"), path.join(root, "public", "img"));

console.log("Synced css/ and img/ into public/");

const fs = require("fs");
const path = require("path");

const version = require("../package.json").version;
const stamp = Date.now().toString().slice(-6); // short timestamp
const token = `${version}.${stamp}`;

const htmlFiles = ["index.html", "cart.html"];

for (const file of htmlFiles) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) continue;
  let content = fs.readFileSync(p, "utf8");
  // Replace existing query params for product_loader / cart / styles
  // Only match in src= or href= attributes
  content = content
    .replace(/(src=["'])product_loader(?:\.min)?\.js(?:\?v=[^"']+)?/g, `$1product_loader.min.js?v=${token}`)
    .replace(/(src=["'])cart(?:\.min)?\.js(?:\?v=[^"']+)?/g, `$1cart.min.js?v=${token}`)
    .replace(/(href=["'])styles(?:\.min)?\.css(?:\?v=[^"']+)?/g, `$1styles.min.css?v=${token}`);
  fs.writeFileSync(p, content, "utf8");
  console.log(`Cache bust updated in ${file}`);
}

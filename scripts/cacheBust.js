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
  content = content
    .replace(/product_loader(?:\.min)?\.js(\?v=[^"']+)?/g, `product_loader.min.js?v=${token}`)
    .replace(/cart(?:\.min)?\.js(\?v=[^"']+)?/g, `cart.min.js?v=${token}`)
    .replace(/styles(?:\.min)?\.css(\?v=[^"']+)?/g, `styles.min.css?v=${token}`);
  fs.writeFileSync(p, content, "utf8");
  console.log(`Cache bust updated in ${file}`);
}

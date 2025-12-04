/**
 * Visual Category Navigation Component
 * Dynamically reads categories from product data
 * Displays Cookies first with subcategory tiles, then other categories
 * Clean, professional image-based browsing (NO EMOJIS)
 */

// Cache DOM elements
let navContainer = null;
let productData = [];

// Cookie subcategories for featured section
const COOKIE_SUBCATEGORIES = ["simple", "fancy", "complex"];

// Images that are known to be missing (will use placeholder or skip)
const MISSING_IMAGES = ["apple-pie.jpg", "peach-pie.jpg"];

/**
 * Check if an image path refers to a missing image
 */
function isImageMissing(imagePath) {
  if (!imagePath) return true;
  const filename = imagePath.replace(/\\/g, "/").split("/").pop();
  return MISSING_IMAGES.includes(filename);
}

/**
 * Get the best product to use for category thumbnail
 * Prioritizes products with images that actually exist
 */
function getBestImageProduct(products) {
  // First, try to find a product with an image that's not in the missing list
  const productWithGoodImage = products.find((p) => p.image && !isImageMissing(p.image));
  if (productWithGoodImage) return productWithGoodImage;

  // Fallback to first product with any image
  const productWithAnyImage = products.find((p) => p.image);
  if (productWithAnyImage) return productWithAnyImage;

  // Last resort: first product
  return products[0];
}

/**
 * Pluralize a category name for display
 */
function pluralize(word) {
  if (!word) return word;
  const lower = word.toLowerCase();

  // Already plural or uncountable
  if (lower.endsWith("s") || lower === "candy" || lower === "bread") {
    return word;
  }

  // Special cases
  if (lower === "pastry") return "Pastries";
  if (lower === "cookie") return "Cookies";
  if (lower === "brownie") return "Brownies";
  if (lower === "pie") return "Pies";
  if (lower === "muffin") return "Muffins";
  if (lower === "cupcake") return "Cupcakes";
  if (lower === "cake") return "Cakes";

  // Default: add 's'
  return word + "s";
}

/**
 * Normalize category name for comparison
 */
function normalizeCategory(cat) {
  if (!cat) return "";
  return cat.toLowerCase().replace(/s$/, ""); // Remove trailing 's' for comparison
}

/**
 * Get unique categories from product data
 */
function getUniqueCategories() {
  const categoryMap = new Map();

  for (const product of productData) {
    if (!product.category) continue;
    const normalized = normalizeCategory(product.category);
    // Store original category name (first occurrence)
    if (!categoryMap.has(normalized)) {
      categoryMap.set(normalized, product.category);
    }
  }

  return categoryMap;
}

/**
 * Check if a category is the cookies category
 */
function isCookiesCategory(category) {
  const normalized = normalizeCategory(category);
  return normalized === "cookie";
}

/**
 * Initialize the visual navigation component
 */
function initVisualCategoryNav(products) {
  productData = products;
  navContainer = document.getElementById("visualCategoryNav");

  if (!navContainer) {
    console.error("Visual nav container not found");
    return;
  }

  renderVisualNav();
}

/**
 * Render the complete visual navigation
 */
function renderVisualNav() {
  navContainer.innerHTML = "";

  const categories = getUniqueCategories();

  // Find and render cookies section first (if exists)
  let cookiesKey = null;
  for (const [normalized, original] of categories) {
    if (isCookiesCategory(original)) {
      cookiesKey = normalized;
      const cookiesSection = renderFeaturedCookies(original);
      navContainer.appendChild(cookiesSection);
      break;
    }
  }

  // Render other categories
  const otherCategories = renderOtherCategories(categories, cookiesKey);
  if (otherCategories.children.length > 0) {
    navContainer.appendChild(otherCategories);
  }
}

/**
 * Render the featured cookies section with subcategories
 */
function renderFeaturedCookies(originalCategoryName) {
  const section = document.createElement("div");
  section.className = "visual-nav-featured";

  // Header with badge
  const header = document.createElement("div");
  header.className = "visual-nav-header";
  header.innerHTML = `
    <span class="nav-badge">Award-Winning</span>
    <h2>${pluralize(originalCategoryName)}</h2>
  `;
  section.appendChild(header);

  // Subcategory tiles
  const tilesContainer = document.createElement("div");
  tilesContainer.className = "visual-nav-tiles";

  for (const subcat of COOKIE_SUBCATEGORIES) {
    const tile = createCategoryTile(originalCategoryName, subcat, true);
    tilesContainer.appendChild(tile);
  }

  section.appendChild(tilesContainer);
  return section;
}

/**
 * Render other category tiles (dynamically from data)
 */
function renderOtherCategories(categories, excludeKey) {
  const section = document.createElement("div");
  section.className = "visual-nav-other";

  const tilesContainer = document.createElement("div");
  tilesContainer.className = "visual-nav-tiles-small";

  for (const [normalized, original] of categories) {
    // Skip the featured cookies category
    if (normalized === excludeKey) continue;

    const tile = createCategoryTile(original, null, false);
    tilesContainer.appendChild(tile);
  }

  section.appendChild(tilesContainer);
  return section;
}

/**
 * Create a single category tile
 */
function createCategoryTile(category, subcategory, isFeatured) {
  const tile = document.createElement("div");
  tile.className = `visual-nav-tile ${isFeatured ? "featured" : "standard"}`;
  tile.dataset.category = category;
  if (subcategory) tile.dataset.subcategory = subcategory;

  // Get representative products for this category
  const products = getProductsForCategory(category, subcategory);
  const imageProduct = getBestImageProduct(products);
  const imageUrl = imageProduct?.image?.replaceAll("\\", "/") || "images/placeholder.svg";

  // Build tile HTML
  tile.innerHTML = `
    <div class="tile-image-wrapper">
      <img src="${imageUrl}" alt="${getDisplayLabel(category, subcategory)}" class="tile-image" loading="lazy" onerror="this.src='images/placeholder.svg'">
      <div class="tile-overlay">
        <span class="tile-count">${products.length} item${products.length === 1 ? "" : "s"}</span>
      </div>
    </div>
    <div class="tile-label">
      <h3>${getDisplayLabel(category, subcategory)}</h3>
      ${isFeatured ? `<span class="tile-price">${getPriceRange(products)}</span>` : ""}
    </div>
  `;

  // Click handler
  tile.addEventListener("click", () => handleCategoryClick(category, subcategory));

  return tile;
}

/**
 * Get products for a specific category/subcategory
 */
function getProductsForCategory(category, subcategory) {
  const targetNormalized = normalizeCategory(category);

  return productData.filter((product) => {
    const productNormalized = normalizeCategory(product.category);
    const matchesCategory = productNormalized === targetNormalized;

    if (!subcategory) return matchesCategory;

    // Check subcategory field (simple/fancy/complex for cookies)
    const productSubcat = (product.subcategory || "").toLowerCase();
    return matchesCategory && productSubcat === subcategory.toLowerCase();
  });
}

/**
 * Get display label for category (pluralized)
 */
function getDisplayLabel(category, subcategory) {
  if (subcategory) {
    // Capitalize first letter of subcategory
    return subcategory.charAt(0).toUpperCase() + subcategory.slice(1);
  }
  return pluralize(category);
}

/**
 * Get price range for products
 */
function getPriceRange(products) {
  if (products.length === 0) return "";

  const prices = products
    .map((p) => {
      const sizes = p.sizePrice || {};
      const priceValues = Object.values(sizes).filter((val) => typeof val === "number" && val > 0);
      return priceValues.length > 0 ? Math.min(...priceValues) : 0;
    })
    .filter((price) => price > 0);

  if (prices.length === 0) return "";

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) return `$${min}`;
  return `$${min} - $${max}`;
}

/**
 * Handle category tile click
 */
function handleCategoryClick(category, subcategory) {
  // Trigger filter event for existing product grid
  const filterEvent = new CustomEvent("categoryFilter", {
    detail: { category, subcategory },
  });
  document.dispatchEvent(filterEvent);

  // Update active state
  updateActiveState(category, subcategory);

  // Scroll to the product grid so user sees the filtered results
  const productsGrid = document.getElementById("productsGrid");
  if (productsGrid) {
    productsGrid.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/**
 * Update active state on tiles
 */
function updateActiveState(category, subcategory) {
  const tiles = navContainer.querySelectorAll(".visual-nav-tile");
  for (const tile of tiles) {
    const matches =
      tile.dataset.category === category &&
      (!subcategory || tile.dataset.subcategory === subcategory);
    tile.classList.toggle("active", matches);
  }
}

// Export functions for use in product_loader.js
globalThis.initVisualCategoryNav = initVisualCategoryNav;

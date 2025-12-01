/**
 * Visual Category Navigation Component
 * Displays award-winning cookies first with subcategory tiles
 * Clean, professional image-based browsing (NO EMOJIS)
 *
 * Hierarchy:
 * 1. Featured: Award-Winning Cookies (Simple/Fancy/Complex)
 * 2. Other Categories: Cakes, Pies, Candy, Bread, etc.
 */

// Cache DOM elements
let navContainer = null;
let productData = [];

// Category configuration with display order
const CATEGORIES = {
  cookies: {
    name: "Cookies",
    featured: true,
    subcategories: ["simple", "fancy", "complex"],
    badge: "Award-Winning",
  },
  cakes: { name: "Cakes", featured: false },
  pies: { name: "Pies", featured: false },
  candy: { name: "Candy", featured: false },
  bread: { name: "Bread", featured: false },
  brownies: { name: "Brownies", featured: false },
  muffins: { name: "Muffins", featured: false },
  pastries: { name: "Pastries", featured: false },
};

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

  // Render featured cookies section first
  const cookiesSection = renderFeaturedCookies();
  navContainer.appendChild(cookiesSection);

  // Render other categories
  const otherCategories = renderOtherCategories();
  navContainer.appendChild(otherCategories);
}

/**
 * Render the featured cookies section with subcategories
 */
function renderFeaturedCookies() {
  const section = document.createElement("div");
  section.className = "visual-nav-featured";

  // Header with badge
  const header = document.createElement("div");
  header.className = "visual-nav-header";
  header.innerHTML = `
    <span class="nav-badge">Award-Winning</span>
    <h2>Cookies</h2>
  `;
  section.appendChild(header);

  // Subcategory tiles
  const tilesContainer = document.createElement("div");
  tilesContainer.className = "visual-nav-tiles";

  for (const subcat of CATEGORIES.cookies.subcategories) {
    const tile = createCategoryTile("cookies", subcat, true);
    tilesContainer.appendChild(tile);
  }

  section.appendChild(tilesContainer);
  return section;
}

/**
 * Render other category tiles
 */
function renderOtherCategories() {
  const section = document.createElement("div");
  section.className = "visual-nav-other";

  const tilesContainer = document.createElement("div");
  tilesContainer.className = "visual-nav-tiles-small";

  for (const [key, config] of Object.entries(CATEGORIES)) {
    if (!config.featured) {
      const tile = createCategoryTile(key, null, false);
      tilesContainer.appendChild(tile);
    }
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
  const imageUrl = products.length > 0 ? products[0].image : "/images/placeholder.jpg";

  // Build tile HTML
  tile.innerHTML = `
    <div class="tile-image-wrapper">
      <img src="${imageUrl}" alt="${getCategoryLabel(category, subcategory)}" class="tile-image" loading="lazy">
      <div class="tile-overlay">
        <span class="tile-count">${products.length} items</span>
      </div>
    </div>
    <div class="tile-label">
      <h3>${getCategoryLabel(category, subcategory)}</h3>
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
  return productData.filter((product) => {
    // Handle category name variations (Cookie vs Cookies, Cake vs Cakes)
    const productCat = (product.category || "").toLowerCase();
    const targetCat = category.toLowerCase();
    const matchesCategory =
      productCat === targetCat || productCat === targetCat + "s" || productCat + "s" === targetCat;
    if (!subcategory) return matchesCategory;
    // Check subcategory field (simple/fancy/complex for cookies)
    const productSubcat = (product.subcategory || "").toLowerCase();
    return matchesCategory && productSubcat === subcategory.toLowerCase();
  });
}

/**
 * Get display label for category
 */
function getCategoryLabel(category, subcategory) {
  if (subcategory) {
    return subcategory.charAt(0).toUpperCase() + subcategory.slice(1);
  }
  return CATEGORIES[category]?.name || category;
}

/**
 * Get price range for products
 */
function getPriceRange(products) {
  if (products.length === 0) return "";

  const prices = products
    .map((p) => {
      // Handle different price field names
      const sizes = p.sizePrice || p.sizes || p.item_sizes || {};
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

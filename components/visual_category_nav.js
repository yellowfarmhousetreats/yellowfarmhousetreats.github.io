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
    name: 'Cookies',
    featured: true,
    subcategories: ['simple', 'fancy', 'complex'],
    badge: 'Award-Winning'
  },
  cakes: { name: 'Cakes', featured: false },
  pies: { name: 'Pies', featured: false },
  candy: { name: 'Candy', featured: false },
  bread: { name: 'Bread', featured: false },
  brownies: { name: 'Brownies', featured: false },
  muffins: { name: 'Muffins', featured: false },
  pastries: { name: 'Pastries', featured: false }
};

/**
 * Initialize the visual navigation component
 */
function initVisualCategoryNav(products) {
  productData = products;
  navContainer = document.getElementById('visualCategoryNav');
  
  if (!navContainer) {
    console.error('Visual nav container not found');
    return;
  }
  
  renderVisualNav();
}

/**
 * Render the complete visual navigation
 */
function renderVisualNav() {
  navContainer.innerHTML = '';
  
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
  const section = document.createElement('div');
  section.className = 'visual-nav-featured';
  
  // Header with badge
  const header = document.createElement('div');
  header.className = 'visual-nav-header';
  header.innerHTML = `
    <span class="nav-badge">Award-Winning</span>
    <h2>Cookies</h2>
  `;
  section.appendChild(header);
  
  // Subcategory tiles
  const tilesContainer = document.createElement('div');
  tilesContainer.className = 'visual-nav-tiles';
  
  CATEGORIES.cookies.subcategories.forEach(subcat => {
    const tile = createCategoryTile('cookies', subcat, true);
    tilesContainer.appendChild(tile);
  });
  
  section.appendChild(tilesContainer);
  return section;
}

/**
 * Render other category tiles
 */
function renderOtherCategories() {
  const section = document.createElement('div');
  section.className = 'visual-nav-other';
  
  const tilesContainer = document.createElement('div');
  tilesContainer.className = 'visual-nav-tiles-small';
  
  Object.entries(CATEGORIES).forEach(([key, config]) => {
    if (!config.featured) {
      const tile = createCategoryTile(key, null, false);
      tilesContainer.appendChild(tile);
    }
  });
  
  section.appendChild(tilesContainer);
  return section;
}

/**
 * Create a single category tile
 */
function createCategoryTile(category, subcategory, isFeatured) {
  const tile = document.createElement('div');
  tile.className = `visual-nav-tile ${isFeatured ? 'featured' : 'standard'}`;
  tile.dataset.category = category;
  if (subcategory) tile.dataset.subcategory = subcategory;
  
  // Get representative products for this category
  const products = getProductsForCategory(category, subcategory);
  const imageUrl = products.length > 0 ? products[0].image : '/images/placeholder.jpg';
  
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
      ${isFeatured ? `<span class="tile-price">${getPriceRange(products)}</span>` : ''}
    </div>
  `;
  
  // Click handler
  tile.addEventListener('click', () => handleCategoryClick(category, subcategory));
  
  return tile;
}

/**
 * Get products for a specific category/subcategory
 */
function getProductsForCategory(category, subcategory) {
  return productData.filter(product => {
    const matchesCategory = product.category?.toLowerCase() === category;
    if (!subcategory) return matchesCategory;
    return matchesCategory && product.complexity?.toLowerCase() === subcategory;
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
  if (products.length === 0) return '';
  
  const prices = products.map(p => {
    const sizes = p.sizes || p.item_sizes || {};
    return Math.min(...Object.values(sizes).filter(val => typeof val === 'number'));
  }).filter(price => price > 0);
  
  if (prices.length === 0) return '';
  
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  
  if (min === max) return `$${min}`;
  return `$${min} - $${max}`;
}

/**
 * Handle category tile click
 */
function handleCategoryClick(category, subcategory) {
  console.log(`Category clicked: ${category}${subcategory ? `/${subcategory}` : ''}`);
  
  // Trigger filter event for existing product grid
  const filterEvent = new CustomEvent('categoryFilter', {
    detail: { category, subcategory }
  });
  document.dispatchEvent(filterEvent);
  
  // Update active state
  updateActiveState(category, subcategory);
}

/**
 * Update active state on tiles
 */
function updateActiveState(category, subcategory) {
  const tiles = navContainer.querySelectorAll('.visual-nav-tile');
  tiles.forEach(tile => {
    const matches = tile.dataset.category === category && 
                   (!subcategory || tile.dataset.subcategory === subcategory);
    tile.classList.toggle('active', matches);
  });
}

// Export functions for use in product_loader.js
window.initVisualCategoryNav = initVisualCategoryNav;
/*
═══════════════════════════════════════════════════════════════════════════════
  IMPLEMENTATION SPEC FOR OPUS
═══════════════════════════════════════════════════════════════════════════════

📋 TASK: Implement Visual Category Navigation System

🎯 REQUIREMENTS:

1. CREATE CSS FILE: /styles/visual_category_nav.css
   ────────────────────────────────────────────────────
   - .visual-nav-featured: Featured cookies section
     • Max-width: 1200px, margin: 0 auto
     • Padding: 2rem
     • Background: subtle cream/off-white (#FAF8F5)
     • Border-radius: 12px
   
   - .visual-nav-header: Header with badge
     • Display: flex, align-items: center, gap: 1rem
     • Margin-bottom: 1.5rem
   
   - .nav-badge: "Award-Winning" badge
     • Background: linear-gradient(135deg, #C9A961 0%, #D4B976 100%)
     • Color: white
     • Padding: 0.5rem 1rem
     • Border-radius: 24px
     • Font-size: 0.875rem
     • Font-weight: 600
     • Text-transform: uppercase
     • Letter-spacing: 0.5px
   
   - .visual-nav-tiles: 3-column grid for cookie subcategories
     • Display: grid
     • Grid-template-columns: repeat(3, 1fr)
     • Gap: 1.5rem
     • Mobile: grid-template-columns: 1fr (stacked)
   
   - .visual-nav-tile.featured: Large featured tiles
     • Border-radius: 12px
     • Overflow: hidden
     • Box-shadow: 0 4px 12px rgba(0,0,0,0.1)
     • Transition: all 0.3s ease
     • Cursor: pointer
     • Background: white
   
   - .visual-nav-tile.featured:hover:
     • Transform: translateY(-4px)
     • Box-shadow: 0 8px 24px rgba(0,0,0,0.15)
   
   - .visual-nav-tile.active:
     • Border: 3px solid #C9A961 (golden)
     • Box-shadow: 0 0 0 4px rgba(201,169,97,0.2)
   
   - .tile-image-wrapper: Image container with overlay
     • Position: relative
     • Aspect-ratio: 4/3
     • Overflow: hidden
   
   - .tile-image:
     • Width: 100%
     • Height: 100%
     • Object-fit: cover
     • Transition: transform 0.3s ease
   
   - .visual-nav-tile:hover .tile-image:
     • Transform: scale(1.05)
   
   - .tile-overlay: Hover overlay with item count
     • Position: absolute
     • Bottom: 0, left: 0, right: 0
     • Background: linear-gradient(to top, rgba(0,0,0,0.7), transparent)
     • Padding: 1rem
     • Color: white
     • Opacity: 0
     • Transition: opacity 0.3s
   
   - .visual-nav-tile:hover .tile-overlay:
     • Opacity: 1
   
   - .tile-label: Text label below image
     • Padding: 1rem
     • Text-align: center
   
   - .tile-label h3:
     • Font-size: 1.25rem
     • Font-weight: 600
     • Margin: 0 0 0.5rem 0
     • Color: #4A3F35
   
   - .tile-price:
     • Color: #8B7355
     • Font-size: 1rem
   
   - .visual-nav-other: Other categories section
     • Margin-top: 3rem
   
   - .visual-nav-tiles-small: Grid for other categories
     • Display: grid
     • Grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))
     • Gap: 1rem
     • Max-width: 1200px
     • Margin: 0 auto
   
   - .visual-nav-tile.standard: Smaller tiles for other categories
     • Same styling as .featured but smaller aspect-ratio (1/1)
     • Slightly smaller padding and fonts


2. UPDATE index.html
   ────────────────────────────────────────────────────
   FIND: Line ~126 <!-- CATEGORY FILTER CHIPS -->
   
   REPLACE WITH:
   <div id="visualCategoryNav" class="visual-category-nav-container"></div>
   
   REMOVE: The old category pill buttons (they're generated dynamically now)
   KEEP: Search bar and dietary filters below
   
   ADD SCRIPT TAG before </body>:
   <script src="/components/visual_category_nav.js"></script>


3. UPDATE product_loader.js
   ────────────────────────────────────────────────────
   FIND: Function that loads products (likely `loadProducts()` or similar)
   
   ADD AFTER products are loaded:
   ```javascript
   // Initialize visual category navigation
   if (typeof initVisualCategoryNav === 'function') {
     initVisualCategoryNav(products);
   }
   ```
   
   ADD EVENT LISTENER for custom category filter events:
   ```javascript
   document.addEventListener('categoryFilter', (event) => {
     const { category, subcategory } = event.detail;
     filterProductsByCategory(category, subcategory);
   });
   ```


4. REMOVE ALL EMOJIS
   ────────────────────────────────────────────────────
   SEARCH index.html and product_loader.js for:
   - 🍪 🎂 🥧 🍬 🍞 🧁 🥐 etc.
   - Replace with nothing (delete them)
   
   KEEP: The category names without emojis


5. TEST CHECKLIST
   ────────────────────────────────────────────────────
   ✓ Featured cookies section shows at top with 3 tiles (Simple/Fancy/Complex)
   ✓ "Award-Winning" badge displays on cookies section  
   ✓ Other categories display in smaller grid below
   ✓ Clicking a tile filters products correctly
   ✓ Active state highlights selected category
   ✓ Hover effects work (scale, overlay, shadow)
   ✓ Mobile responsive (tiles stack on small screens)
   ✓ No emojis anywhere in navigation
   ✓ Images load from product_data.json
   ✓ Price ranges display correctly on featured tiles


6. MOBILE BREAKPOINTS
   ────────────────────────────────────────────────────
   @media (max-width: 768px) {
     - .visual-nav-tiles: 1 column
     - .visual-nav-tiles-small: 2 columns
     - Reduce padding and font sizes by 10-15%
     - Touch targets minimum 44px
   }

═══════════════════════════════════════════════════════════════════════════════
*/


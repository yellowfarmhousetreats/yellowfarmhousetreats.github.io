// ========== PRODUCT DATA LOADER ==========
let menuItems = [];

async function loadProducts() {
  try {
    const response = await fetch("products.json");
    if (!response.ok) {
      throw new Error("Failed to load products");
    }
    menuItems = await response.json();
    return menuItems;
  } catch (error) {
    console.error("Error loading products:", error);
    return [];
  }
}

// ========== INITIALIZE PRODUCTS ==========
async function initializeProducts() {
  await loadProducts();

  const grid = document.getElementById("productsGrid");
  if (!grid) return;

  grid.innerHTML = "";

  // Group products by category
  const productsByCategory = {};
  for (const item of menuItems) {
    if (!productsByCategory[item.category]) {
      productsByCategory[item.category] = [];
    }
    productsByCategory[item.category].push(item);
  }

  let globalIndex = 0;

  for (const category of Object.keys(productsByCategory)) {
    // Create category section
    const section = document.createElement("div");
    section.className = "category-section";

    const title = document.createElement("h2");
    title.className = "category-title";
    title.textContent = category;
    section.appendChild(title);

    const categoryGrid = document.createElement("div");
    categoryGrid.className = "products-grid";

    for (const item of productsByCategory[category]) {
      const defaultPrice = item.basePrice || item.sizePrice[item.sizes[0]];

      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        ${item.image ? `<div class="product-image"><img src="${item.image}" alt="${item.name}"></div>` : ''}
        <div class="product-header">
          <div class="product-name">${item.name}</div>
          <div class="product-price">from $${defaultPrice.toFixed(2)}</div>
        </div>
        <div class="product-form">
          <div class="form-group">
            <label>Size:</label>
            <select id="size-${globalIndex}" class="size-select" onchange="updatePrice(${globalIndex})">
              ${item.sizes
                .map((size) => `<option value="${size}">${size}</option>`)
                .join("")}
            </select>
          </div>
          ${
            item.flavors && item.flavors.length > 0
              ? `
            <div class="form-group">
              <label>Flavor:</label>
              <select id="flavor-${globalIndex}" class="flavor-select" onchange="updateDietaryOptions(${globalIndex})">
                ${item.flavors
                  .map((flavor) => `<option value="${flavor}">${flavor}</option>`)
                  .join("")}
              </select>
            </div>
          `
              : ""
          }
          ${
            item.flavorNotes
              ? `
            <div class="form-group">
              <label>Flavor Notes:</label>
                <input type="text" id="notes-${globalIndex}" class="flavor-notes" placeholder="Optional flavor preferences">
              </div>
          `
              : ""
          }
          <div class="form-group">
            <label>Quantity:</label>
            <input type="number" id="qty-${globalIndex}" class="quantity-input" min="1" value="1">
          </div>
          <div class="dietary-section" id="dietary-${globalIndex}">
            <div class="dietary-checkboxes">
              <div class="dietary-option" id="gluten-option-${globalIndex}">
                <input type="checkbox" id="gluten-${globalIndex}" class="gluten-checkbox">
                <label for="gluten-${globalIndex}">Gluten Free</label>
              </div>
              <div class="dietary-option" id="sugar-option-${globalIndex}">
                <input type="checkbox" id="sugar-${globalIndex}" class="sugar-checkbox">
                <label for="sugar-${globalIndex}">Sugar Free</label>
              </div>
            </div>
          </div>
          <button class="add-to-cart-btn" onclick="addToCart(${globalIndex})">Add to Cart</button>
        </div>
      `;
      categoryGrid.appendChild(card);
      updateDietaryOptions(globalIndex);
      globalIndex++;
    }

    section.appendChild(categoryGrid);
    grid.appendChild(section);
  }

  // Removed dietary filtering as dietary tags are no longer in JSON
}

function updatePrice(index) {
  const item = menuItems[index];
  const cards = document.querySelectorAll(".product-card");
  const card = cards[index];
  const sizeSelect = card.querySelector(".size-select");
  const priceDisplay = card.querySelector(".product-price");

  const selectedSize = sizeSelect.value;
  const price = item.sizePrice[selectedSize] || item.basePrice;
  priceDisplay.textContent = `from $${price.toFixed(2)}`;
}

function updateDietaryOptions(index) {
  const item = menuItems[index];
  const dietarySection = document.getElementById(`dietary-${index}`);
  const glutenOption = document.getElementById(`gluten-option-${index}`);
  const sugarOption = document.getElementById(`sugar-option-${index}`);
  
  if (item.canGlutenfree) {
    glutenOption.classList.remove('hidden');
  } else {
    glutenOption.classList.add('hidden');
  }
  
  if (item.canSugarfree) {
    sugarOption.classList.remove('hidden');
  } else {
    sugarOption.classList.add('hidden');
  }
  
  if (item.canGlutenfree || item.canSugarfree) {
    dietarySection.classList.remove('hidden');
  } else {
    dietarySection.classList.add('hidden');
  }
}

// ========== DIETARY FILTERING ==========
function updateDietaryFilters() {
  // Removed as dietary tags are no longer in JSON
}

function filterProducts() {
  // Removed as dietary tags are no longer in JSON
}

// ========== INITIALIZE ON PAGE LOAD ==========
document.addEventListener("DOMContentLoaded", initializeProducts);

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
  console.log("Initializing products...");
  const spinner = document.getElementById("loadingSpinner");
  spinner.classList.remove("hidden");

  const products = await loadProducts();
  console.log("Loaded products:", products.length);

  spinner.style.display = "none";
  displayProducts(products);

  // Add event listeners - header controls will call filterAndDisplay
  console.log("Products initialized");
}

function generateCategoryTabs() {
  // Category tabs removed - using header dropdown only
}

function setActiveTab(event) {
  for (const btn of document.querySelectorAll(".tab-button")) {
    btn.classList.remove("active");
  }
  event.target.classList.add("active");
  // Sync select
  const category = event.target.dataset.category;
  const select = document.getElementById("categorySelect");
  if (select) select.value = category;
  filterAndDisplay();
}

function getCurrentCategory() {
  const activeBtn = document.querySelector(".filter-cat-btn.active");
  return activeBtn && activeBtn.dataset ? activeBtn.dataset.filterCategory : "all";
}

function displayProducts(products, skipCategoryHeaders = false) {
  console.log("Displaying products:", products ? products.length : 0);
  const grid = document.getElementById("productsGrid");
  console.log("Grid found:", !!grid);
  if (!grid) {
    console.error("Products grid not found");
    return;
  }
  if (!products || products.length === 0) {
    grid.innerHTML = '<div class="empty-items">No products found</div>';
    return;
  }
  grid.innerHTML = "";

  if (skipCategoryHeaders) {
    // Just display all products in a flat grid without category sections
    const flatGrid = document.createElement("div");
    flatGrid.className = "products-grid product-grid";
    
    for (let i = 0; i < products.length; i++) {
      const card = createProductCard(products[i], i);
      flatGrid.appendChild(card);
    }
    
    grid.appendChild(flatGrid);
    console.log("Products displayed (flat)");
    return;
  }

  // Group by category
  const productsByCategory = {};
  for (const item of products) {
    if (!productsByCategory[item.category]) productsByCategory[item.category] = [];
    productsByCategory[item.category].push(item);
  }

  // Sort categories with Cookie first
  const categoryOrder = ["Cookie"];
  const otherCategories = Object.keys(productsByCategory)
    .filter((cat) => cat !== "Cookie")
    .sort((a, b) => a.localeCompare(b));
  const sortedCategories = [...categoryOrder, ...otherCategories];

  let globalIndex = 0;

  for (const category of sortedCategories) {
    const items = productsByCategory[category];
    if (items && items.length > 0) {
      const sectionResult = createCategorySection(category, items, globalIndex);
      grid.appendChild(sectionResult.node);
      globalIndex = sectionResult.nextIndex;
    }
  }
  console.log("Products displayed");
}

function createCategorySection(category, items, startIndex) {
  if (category === "Cookie") {
    return createCookieSections(items, startIndex);
  }

  // Normal category
  const section = document.createElement("div");
  section.className = "category-section";

  const title = document.createElement("h2");
  title.className = "category-title";
  title.textContent = category;
  section.appendChild(title);

  const categoryGrid = document.createElement("div");
  categoryGrid.className = "products-grid product-grid";

  let index = startIndex;
  for (const item of items) {
    const card = createProductCard(item, index);
    categoryGrid.appendChild(card);
    index++;
  }

  section.appendChild(categoryGrid);
  return { node: section, nextIndex: index };
}

function createCookieSections(items, startIndex) {
  const section = document.createElement("div");
  section.className = "category-section";

  const title = document.createElement("h2");
  title.className = "category-title";
  title.textContent = "Cookies";
  section.appendChild(title);

  const subcategories = ["simple", "fancy", "complex"];
  let index = startIndex;
  for (const sub of subcategories) {
    const subItems = items.filter((item) => item.subcategory === sub);
    if (subItems.length > 0) {
      const subTitle = document.createElement("h3");
      subTitle.className = "subcategory-title";
      subTitle.textContent = `${sub.charAt(0).toUpperCase() + sub.slice(1)} Cookies`;
      section.appendChild(subTitle);

      const subGrid = document.createElement("div");
      subGrid.className = "products-grid product-grid";

      for (const item of subItems) {
        const card = createProductCard(item, index);
        subGrid.appendChild(card);
        index++;
      }
      section.appendChild(subGrid);
    }
  }
  return { node: section, nextIndex: index };
}

function createProductCard(item, index) {
  const defaultPrice = getDefaultPrice(item);

  const card = document.createElement("div");
  card.className = "product-grid-card";
  card.onclick = () => openProductModal(menuItems.indexOf(item));

  const imgWrap = document.createElement("div");
  imgWrap.className = "product-image";
  if (item.image) {
    // Use <picture> for WebP support with JPG fallback
    const picture = document.createElement("picture");
    const webpSrc = item.image.replace(".jpg", ".webp").replace(".png", ".webp");
    const source = document.createElement("source");
    source.srcset = webpSrc;
    source.type = "image/webp";
    picture.appendChild(source);

    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.name || "Product Image";
    img.loading = "lazy";
    picture.appendChild(img);
    imgWrap.appendChild(picture);
  } else {
    imgWrap.innerHTML = '<div class="image-placeholder">Image Coming Soon</div>';
  }
  card.appendChild(imgWrap);

  const info = document.createElement("div");
  info.className = "product-info";

  const nameDiv = document.createElement("div");
  nameDiv.className = "product-name";
  nameDiv.textContent = item.name;
  info.appendChild(nameDiv);

  const priceDiv = document.createElement("div");
  priceDiv.className = "product-price";
  priceDiv.textContent = `from $${defaultPrice.toFixed(2)}`;
  info.appendChild(priceDiv);

  const badges = document.createElement("div");
  badges.className = "dietary-badges";
  if (item.canGlutenfree) {
    const gfBadge = document.createElement("span");
    gfBadge.className = "badge gluten-free";
    gfBadge.textContent = "🚫🌾";
    gfBadge.title = "Gluten-Free option available";
    badges.appendChild(gfBadge);
  }
  if (item.canSugarfree) {
    const sfBadge = document.createElement("span");
    sfBadge.className = "badge sugar-free";
    sfBadge.textContent = "🚫🧊";
    sfBadge.title = "Sugar-Free option available";
    badges.appendChild(sfBadge);
  }
  info.appendChild(badges);

  card.appendChild(info);
  return card;
}

function getDefaultPrice(item) {
  if (typeof item.basePrice === "number") return item.basePrice;
  if (item.sizes && item.sizes.length > 0 && item.sizePrice) {
    const firstSize = item.sizes[0];
    return item.sizePrice[firstSize.replaceAll(" ", "_")] || 0;
  }
  return 0;
}

function updatePrice(index) {
  const item = menuItems[index];
  const cards = document.querySelectorAll(".product-card");
  const card = cards[index];
  const sizeSelect = card.querySelector(".size-select");
  const priceDisplay = card.querySelector(".product-price");

  const selectedSize = sizeSelect.value.replaceAll(" ", "_");
  const price = item.sizePrice[selectedSize] || item.basePrice;
  priceDisplay.textContent = `from $${price.toFixed(2)}`;
}

function filterAndDisplay() {
  if (!menuItems || menuItems.length === 0) {
    console.log("No products loaded yet");
    displayProducts([]);
    return;
  }

  let filtered = menuItems.slice();
  let skipHeaders = false;

  // Dietary filters
  const gfFilter = document.getElementById("header-filter-gf")?.checked;
  const sfFilter = document.getElementById("header-filter-sf")?.checked;
  
  if (gfFilter || sfFilter) {
    // When dietary filters are active, show ALL matching items (ignore category)
    filtered = filtered.filter((item) => {
      if (gfFilter && item.canGlutenfree) return true;
      if (sfFilter && item.canSugarfree) return true;
      return false;
    });
    skipHeaders = true; // Don't show category headers
  } else {
    // Only apply category filter when dietary filters are OFF
    const category = getCurrentCategory();
    if (category !== "all") {
      filtered = filtered.filter((item) => item.category === category);
    }
  }

  displayProducts(filtered, skipHeaders);
}

// ========== DIETARY FILTERING ==========
// Removed as replaced with badges and filters

// ========== MODAL FUNCTIONS ==========
function openProductModal(index) {
  globalThis.currentModalIndex = index;
  const item = menuItems[index];
  const modalContent = document.getElementById("modalContent");
  modalContent.innerHTML = createModalContent(item, index);

  // Lazy load modal image
  const modalImg = modalContent.querySelector(".product-image img");
  if (modalImg?.dataset?.src) {
    modalImg.src = modalImg.dataset.src;
  }

  const modal = document.getElementById("productModal");
  modal.addEventListener("click", handleBackdropClick);
  // Accessibility: assign id for title reference
  const nameEl = modalContent.querySelector(".product-name");
  if (nameEl) nameEl.id = "modalTitle";
  // Focus first interactive element
  setTimeout(() => {
    const first = modalContent.querySelector("button, [href], input, select, textarea");
    (first || modal).focus();
  }, 0);
  // Simple focus trap & escape close
  const keyHandler = (e) => {
    if (e.key === "Escape") {
      closeProductModal();
      return;
    }
    if (e.key === "Tab") {
      const focusable = Array.from(
        modalContent.querySelectorAll("button, [href], input, select, textarea")
      );
      if (!focusable.length) return;
      const idx = focusable.indexOf(document.activeElement);
      if (e.shiftKey && idx === 0) {
        e.preventDefault();
        focusable.at(-1).focus();
      } else if (!e.shiftKey && idx === focusable.length - 1) {
        e.preventDefault();
        focusable[0].focus();
      }
    }
  };
  modal.addEventListener("keydown", keyHandler);
  modal._keyHandler = keyHandler; // Store reference for later removal
  modal.showModal();
}

function closeProductModal() {
  const modal = document.getElementById("productModal");
  modal.removeEventListener("click", handleBackdropClick);
  if (modal._keyHandler) {
    modal.removeEventListener("keydown", modal._keyHandler);
    delete modal._keyHandler;
  }
  modal.close();
  document.getElementById("modalContent").innerHTML = "";
}

function handleBackdropClick(e) {
  if (e.target === this) closeProductModal();
}

function stopModalPropagation(e) {
  e.stopPropagation();
}

function createModalContent(item, index) {
  const defaultPrice = getDefaultPrice(item);

  let html = "";

  // Image
  html += '<div class="product-image">';
  if (item.image) {
    const webpSrc = item.image.replace(".jpg", ".webp").replace(".png", ".webp");
    html += `<picture><source srcset="${webpSrc}" type="image/webp"><img alt="${item.name || "Product Image"}" data-src="${item.image}"></picture>`;
  } else {
    html += '<div class="image-placeholder">Image Coming Soon</div>';
  }
  html += "</div>";

  // Header
  html += '<div class="product-header">';
  html += `<div class="product-name">${item.name}</div>`;
  html += `<div class="product-price">$${defaultPrice.toFixed(2)}</div>`;
  html += "</div>";

  // Badges
  html += '<div class="dietary-badges">';
  if (item.canGlutenfree) {
    html += '<span class="badge gluten-free">Can be Gluten Free</span>';
  }
  if (item.canSugarfree) {
    html += '<span class="badge sugar-free">Can be Sugar Free</span>';
  }
  html += "</div>";

  // Form
  html += '<div class="product-form">';

  // Size select
  html += '<div class="form-group">';
  html += '<label for="modal-size">Size:</label>';
  html += '<select id="modal-size" class="size-select" onchange="updatePriceInModal()">';
  for (const size of item.sizes) {
    html += `<option value="${size}">${size}</option>`;
  }
  html += "</select>";
  html += "</div>";

  // Flavor select (optional)
  if (item.flavors && item.flavors.length > 0) {
    html += '<div class="form-group">';
    html += '<label for="modal-flavor">Flavor:</label>';
    html +=
      '<select id="modal-flavor" class="flavor-select" onchange="updateDietaryOptionsInModal()">';
    for (const flavor of item.flavors) {
      html += `<option value="${flavor}">${flavor}</option>`;
    }
    html += "</select>";
    html += "</div>";
  }

  // Flavor notes (optional)
  if (item.flavorNotes) {
    html += '<div class="form-group">';
    html += '<label for="modal-notes">Flavor Notes:</label>';
    html +=
      '<input type="text" id="modal-notes" class="flavor-notes" placeholder="Optional flavor preferences">';
    html += "</div>";
  }

  // Quantity
  html += '<div class="form-group">';
  html += '<label for="modal-qty">Quantity:</label>';
  html += '<input type="number" id="modal-qty" class="quantity-input" min="1" value="1">';
  html += "</div>";

  // Dietary options and Gift Wrap
  if (item.canGlutenfree || item.canSugarfree || item.giftWrapPrice) {
    html += '<div class="form-group dietary-options">';
    html += "<label>Special Options:</label>";
    if (item.canGlutenfree) {
      html +=
        '<label class="checkbox-label"><input type="checkbox" id="modal-gf" class="dietary-checkbox"> Gluten Free</label>';
    }
    if (item.canSugarfree) {
      html +=
        '<label class="checkbox-label"><input type="checkbox" id="modal-sf" class="dietary-checkbox"> Sugar Free</label>';
    }
    if (item.giftWrapPrice) {
      html +=
        `<label class="checkbox-label"><input type="checkbox" id="modal-giftwrap" class="dietary-checkbox" onchange="updatePriceInModal()"> Gift Wrap (+$${item.giftWrapPrice.toFixed(2)})</label>`;
    }
    html += "</div>";
  }

  // Add to Cart button
  html += `<button class="add-to-cart-btn" onclick="addToCart(${index})">Add to Cart</button>`;

  html += "</div>";

  return html;
}

function updatePriceInModal() {
  const sizeSelect = document.getElementById("modal-size");
  const priceDisplay = document.querySelector("#modalContent .product-price");
  const giftWrapCheckbox = document.getElementById("modal-giftwrap");
  if (!sizeSelect || !priceDisplay) return;

  const selectedSize = sizeSelect.value.replaceAll(" ", "_");
  const currentItem = menuItems[globalThis.currentModalIndex];
  let price = currentItem.sizePrice[selectedSize] || currentItem.basePrice;
  
  // Add gift wrap if checked
  if (giftWrapCheckbox && giftWrapCheckbox.checked && currentItem.giftWrapPrice) {
    price += currentItem.giftWrapPrice;
  }
  
  priceDisplay.textContent = `$${price.toFixed(2)}`;
}

function updateDietaryOptionsInModal() {
  // Similar, but for now, skip if not needed.
}

// Expose functions to global scope
globalThis.openProductModal = openProductModal;
globalThis.closeProductModal = closeProductModal;
globalThis.updatePriceInModal = updatePriceInModal;
globalThis.updateDietaryOptionsInModal = updateDietaryOptionsInModal;
globalThis.filterAndDisplay = filterAndDisplay;

// ========== INITIALIZE ON PAGE LOAD ==========
document.addEventListener("DOMContentLoaded", initializeProducts);

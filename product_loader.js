// ========== PRODUCT DATA LOADER ==========
// Uses: scripts/data_normalizer.js (normalizeProductData, getPrice)
// Uses: components/size_selector.js (renderSizePills, getSelectedSize)

let menuItems = [];
let activeFilters = {
  category: "all",
  subcategory: null,
  gf: false,
  sf: false,
  ship: false,
  search: "",
};

// Fallback placeholder image
const PLACEHOLDER_IMAGE = "images/placeholder.svg";

async function loadProducts() {
  try {
    const response = await fetch("product_data.json");
    if (!response.ok) {
      throw new Error("Failed to load products");
    }
    const rawProducts = await response.json();
    // Normalize product data for consistent key handling
    menuItems = normalizeProductData(rawProducts);
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
  if (spinner) spinner.classList.remove("hidden");

  const products = await loadProducts();
  console.log("Loaded products:", products.length);

  if (spinner) spinner.style.display = "none";

  // Initialize visual category navigation
  if (typeof initVisualCategoryNav === "function") {
    initVisualCategoryNav(products);
  }

  // Generate category chips (fallback/mobile)
  generateCategoryChips(products);

  // Display products in flat grid
  displayProducts(products);

  // Listen for category filter events from visual nav
  document.addEventListener("categoryFilter", (event) => {
    const { category, subcategory } = event.detail;
    filterProductsByVisualNav(category, subcategory);
  });

  console.log("Products initialized");
}

// ========== CATEGORY CHIPS GENERATION ==========
function generateCategoryChips(products) {
  const container = document.getElementById("categoryFilter");
  if (!container) return;

  // Count products by category
  const categoryCounts = {};
  let total = 0;
  for (const item of products) {
    // Normalize "Cakes" to "Cake" for consistency
    const cat = item.category === "Cakes" ? "Cake" : item.category;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    total++;
  }

  // Category order with emojis
  const categoryConfig = [
    { key: "all", label: "All", emoji: "", count: total },
    { key: "Cookie", label: "Cookies", emoji: "🍪", count: categoryCounts["Cookie"] || 0 },
    { key: "Cake", label: "Cakes", emoji: "🎂", count: categoryCounts["Cake"] || 0 },
    { key: "Pie", label: "Pies", emoji: "🥧", count: categoryCounts["Pie"] || 0 },
    { key: "Candy", label: "Candy", emoji: "🍬", count: categoryCounts["Candy"] || 0 },
    { key: "Bread", label: "Bread", emoji: "🍞", count: categoryCounts["Bread"] || 0 },
    { key: "Brownie", label: "Brownies", emoji: "🟫", count: categoryCounts["Brownie"] || 0 },
    { key: "Muffin", label: "Muffins", emoji: "🧁", count: categoryCounts["Muffin"] || 0 },
    { key: "Pastry", label: "Pastries", emoji: "🥐", count: categoryCounts["Pastry"] || 0 },
  ];

  container.innerHTML = "";

  for (const cat of categoryConfig) {
    if (cat.count === 0 && cat.key !== "all") continue; // Skip empty categories

    const chip = document.createElement("button");
    chip.className = "category-chip" + (cat.key === "all" ? " active" : "");
    chip.dataset.category = cat.key;
    chip.innerHTML = `${cat.emoji ? cat.emoji + " " : ""}${cat.label} <span class="count">${cat.count}</span>`;
    chip.onclick = () => selectCategory(cat.key);
    container.appendChild(chip);
  }
}

function selectCategory(category) {
  activeFilters.category = category;
  activeFilters.subcategory = null; // Clear subcategory when using chip nav

  // Update active chip styling
  for (const chip of document.querySelectorAll(".category-chip")) {
    chip.classList.toggle("active", chip.dataset.category === category);
  }

  filterAndDisplay();
}

// Filter by visual category nav (supports subcategory)
function filterProductsByVisualNav(category, subcategory) {
  // Map visual nav category names to product data category names
  const categoryMap = {
    cookies: "Cookie",
    cakes: "Cake",
    pies: "Pie",
    candy: "Candy",
    bread: "Bread",
    brownies: "Brownie",
    muffins: "Muffin",
    pastries: "Pastry",
  };

  activeFilters.category = categoryMap[category] || category;
  activeFilters.subcategory = subcategory || null;

  // Update category chips to match
  for (const chip of document.querySelectorAll(".category-chip")) {
    chip.classList.toggle("active", chip.dataset.category === activeFilters.category);
  }

  filterAndDisplay();
}

function toggleQuickFilter(btn) {
  const filter = btn.dataset.filter;
  btn.classList.toggle("active");

  if (filter === "gf") activeFilters.gf = btn.classList.contains("active");
  if (filter === "sf") activeFilters.sf = btn.classList.contains("active");
  if (filter === "ship") activeFilters.ship = btn.classList.contains("active");

  filterAndDisplay();
}

function getCurrentCategory() {
  return activeFilters.category;
}

// ========== FLAT PRODUCT GRID ==========
function displayProducts(products) {
  console.log("Displaying products:", products.length);
  const grid = document.getElementById("productsGrid");
  if (!grid) {
    console.log("Grid not found!");
    return;
  }
  grid.innerHTML = "";

  if (products.length === 0) {
    grid.innerHTML = '<div class="no-results">No products found. Try adjusting your filters.</div>';
    return;
  }

  // Sort: Cookies first, then alphabetically
  const sorted = [...products].sort((a, b) => {
    if (a.category === "Cookie" && b.category !== "Cookie") return -1;
    if (a.category !== "Cookie" && b.category === "Cookie") return 1;
    return a.name.localeCompare(b.name);
  });

  for (const item of sorted) {
    const card = createProductCardMobile(item);
    grid.appendChild(card);
  }
  console.log("Products displayed");
}

function createProductCardMobile(item) {
  const card = document.createElement("div");
  card.className = "product-card-mobile";
  card.onclick = () => openProductModal(menuItems.indexOf(item));

  // Image container
  const imgWrap = document.createElement("div");
  imgWrap.className = "product-image";
  if (item.image) {
    const img = document.createElement("img");
    img.src = item.image.replaceAll("\\", "/");
    img.alt = item.name || "Product Image";
    img.loading = "lazy";
    // Error handling: fallback to placeholder if image fails to load
    img.onerror = () => {
      img.onerror = null; // Prevent infinite loop
      img.src = PLACEHOLDER_IMAGE;
    };
    imgWrap.appendChild(img);
  } else {
    // No image specified - use placeholder
    const img = document.createElement("img");
    img.src = PLACEHOLDER_IMAGE;
    img.alt = item.name || "Product Image";
    img.loading = "lazy";
    imgWrap.appendChild(img);
  }

  // Badges overlay
  const badges = document.createElement("div");
  badges.className = "product-badges";
  if (item.canGlutenfree) {
    const gfBadge = document.createElement("span");
    gfBadge.className = "badge-gf";
    gfBadge.textContent = "GF";
    gfBadge.title = "Can be Gluten-Free";
    badges.appendChild(gfBadge);
  }
  if (item.canSugarfree) {
    const sfBadge = document.createElement("span");
    sfBadge.className = "badge-sf";
    sfBadge.textContent = "SF";
    sfBadge.title = "Can be Sugar-Free";
    badges.appendChild(sfBadge);
  }
  if (item.canShip) {
    const shipBadge = document.createElement("span");
    shipBadge.className = "badge-ship";
    shipBadge.textContent = "📦";
    shipBadge.title = "Shippable";
    badges.appendChild(shipBadge);
  }
  imgWrap.appendChild(badges);
  card.appendChild(imgWrap);

  // Product info
  const info = document.createElement("div");
  info.className = "product-info";

  const nameDiv = document.createElement("h3");
  nameDiv.className = "product-name";
  nameDiv.textContent = item.name;
  info.appendChild(nameDiv);

  const priceDiv = document.createElement("p");
  priceDiv.className = "product-price";
  const defaultPrice = getDefaultPrice(item);
  priceDiv.textContent = `from $${defaultPrice.toFixed(2)}`;
  info.appendChild(priceDiv);

  card.appendChild(info);
  return card;
}

function pluralizeCategoryName(category) {
  const pluralMap = {
    Cookie: "Cookies",
    Bread: "Breads",
    Brownie: "Brownies",
    Cake: "Cakes",
    Candy: "Candies",
    Muffin: "Muffins",
    Pastry: "Pastries",
    Pie: "Pies",
  };
  return pluralMap[category] || category;
}

// Legacy functions kept for compatibility but no longer used
function createProductThumbnail(item, index) {
  // Redirects to new card format
  return createProductCardMobile(item);
}

function createProductCard(item, index) {
  const defaultPrice = getDefaultPrice(item);

  const card = document.createElement("div");
  card.className = "product-grid-card";
  card.onclick = () => openProductModal(menuItems.indexOf(item));

  const imgWrap = document.createElement("div");
  imgWrap.className = "product-image";
  if (item.image) {
    const img = document.createElement("img");
    // Normalize path separators for web
    img.src = item.image.replace(/\\/g, "/");
    img.alt = item.name || "Product Image";
    img.loading = "lazy";
    imgWrap.appendChild(img);
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
    gfBadge.textContent = "🌾 CAN BE GF";
    badges.appendChild(gfBadge);
  }
  if (item.canSugarfree) {
    const sfBadge = document.createElement("span");
    sfBadge.className = "badge sugar-free";
    sfBadge.textContent = "🍬 CAN BE SF";
    badges.appendChild(sfBadge);
  }
  info.appendChild(badges);

  card.appendChild(info);
  return card;
}

function getDefaultPrice(item) {
  if (typeof item.basePrice === "number") return item.basePrice;
  if (item.sizes && item.sizes.length > 0) {
    // Use the getPrice function from data_normalizer for consistent lookup
    return getPrice(item, item.sizes[0]);
  }
  return 0;
}

function applyCategoryFilter(items, category) {
  if (category === "all") return items;
  // Handle "Cakes" vs "Cake" inconsistency
  let filtered = items.filter((item) => {
    const itemCat = item.category === "Cakes" ? "Cake" : item.category;
    return itemCat === category;
  });

  // Apply subcategory filter if set (for cookies: simple/fancy/complex)
  if (activeFilters.subcategory) {
    filtered = filtered.filter((item) => {
      const itemSubcat = item.subcategory?.toLowerCase() || item.complexity?.toLowerCase();
      return itemSubcat === activeFilters.subcategory.toLowerCase();
    });
  }

  return filtered;
}

function applySearchFilter(items, searchQuery) {
  if (!searchQuery) return items;
  const query = searchQuery.toLowerCase();
  return items.filter((item) => {
    // Search name, category, and dietary notes
    return (
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      (item.dietaryNotes && item.dietaryNotes.toLowerCase().includes(query))
    );
  });
}

function applyQuickFilters(items, gf, sf, ship) {
  if (!gf && !sf && !ship) return items;
  return items.filter((item) => {
    // All active filters must match (AND logic)
    if (gf && !item.canGlutenfree) return false;
    if (sf && !item.canSugarfree) return false;
    if (ship && !item.canShip) return false;
    return true;
  });
}

function sortProducts(items, sortBy) {
  const sorted = items.slice();
  sorted.sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    const priceA = getDefaultPrice(a);
    const priceB = getDefaultPrice(b);
    if (sortBy === "price-low") return priceA - priceB;
    if (sortBy === "price-high") return priceB - priceA;
    return 0;
  });
  return sorted;
}

function filterAndDisplay() {
  let filtered = menuItems.slice();

  // Category filter
  filtered = applyCategoryFilter(filtered, activeFilters.category);

  // Search filter
  const searchInput = document.getElementById("productSearch");
  const searchQuery = searchInput ? searchInput.value : "";
  filtered = applySearchFilter(filtered, searchQuery);

  // Quick filters (GF, SF, Ship)
  filtered = applyQuickFilters(filtered, activeFilters.gf, activeFilters.sf, activeFilters.ship);

  displayProducts(filtered);
}

// ========== DIETARY FILTERING ==========
// Removed as replaced with badges and filters

// ========== MODAL FUNCTIONS ==========
function setupModalAccessibility(modal, modalContent) {
  const nameEl = modalContent.querySelector(".product-name");
  if (nameEl) nameEl.id = "modalTitle";

  setTimeout(() => {
    const first = modalContent.querySelector("button, [href], input, select, textarea");
    (first || modal).focus();
  }, 0);
}

function createModalKeyHandler(modal, modalContent) {
  return (e) => {
    if (e.key === "Escape") {
      closeProductModal();
      return;
    }
    if (e.key === "Tab") {
      handleModalTabKey(e, modalContent);
    }
  };
}

function handleModalTabKey(e, modalContent) {
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

function openProductModal(index) {
  globalThis.currentModalIndex = index;
  const item = menuItems[index];
  const modalContent = document.getElementById("modalContent");
  modalContent.innerHTML = createModalContent(item, index);

  // Inject size pills component (replaces dropdown)
  injectSizePills(item);

  // Initialize option button click handlers
  initializeOptionButtons();

  // Lazy load modal image
  const modalImg = modalContent.querySelector(".product-preview img");
  if (modalImg?.dataset?.src) {
    modalImg.src = modalImg.dataset.src;
  }

  const modal = document.getElementById("productModal");
  modal.addEventListener("click", handleBackdropClick);

  setupModalAccessibility(modal, modalContent);

  const keyHandler = createModalKeyHandler(modal, modalContent);
  modal.addEventListener("keydown", keyHandler);
  modal._keyHandler = keyHandler;
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

function createModalImage(item) {
  let html = '<div class="product-image">';
  if (item.image) {
    // Normalize path separators for web
    const imagePath = item.image.replace(/\\/g, "/");
    html += `<img src="${imagePath}" alt="${item.name || "Product Image"}" loading="lazy">`;
  } else {
    html += '<div class="image-placeholder">Image Coming Soon</div>';
  }
  html += "</div>";
  return html;
}

function createModalHeader(item, defaultPrice) {
  let html = '<div class="product-header">';
  html += `<div class="product-name">${item.name}</div>`;
  html += `<div class="product-price">Starting at $${defaultPrice.toFixed(2)}</div>`;
  html += "</div>";
  return html;
}

function createModalBadges(item) {
  let html = '<div class="dietary-badges">';
  if (item.canGlutenfree) {
    html += '<span class="badge gluten-free">Can be Gluten Free</span>';
  }
  if (item.canSugarfree) {
    html += '<span class="badge sugar-free">Can be Sugar Free</span>';
  }
  if (item.canShip) {
    html += '<span class="badge shippable">📦 Shippable</span>';
  }
  html += "</div>";
  return html;
}

function createDietaryNotes(item) {
  if (!item.dietaryNotes) return "";
  let html = '<div class="dietary-notes">';
  html += `<p class="notes-text">${item.dietaryNotes}</p>`;
  html += "</div>";
  return html;
}

function createAllergenWarnings(item) {
  if (!item.allergens || item.allergens.length === 0) return "";
  let html = '<div class="allergen-warnings">';
  html += '<span class="allergen-label">⚠️ Contains: </span>';
  html += `<span class="allergen-list">${item.allergens.join(", ")}</span>`;
  html += "</div>";
  return html;
}

function createDepositMessage(item) {
  if (!item.hasDeposit || !item.depositAmount) return "";
  let html = '<div class="deposit-message">';
  html += `<span class="deposit-icon">🍽️</span> Includes $${item.depositAmount.toFixed(2)} refundable dish deposit`;
  html += "</div>";
  return html;
}

function createSizeSelector(item) {
  // Return a placeholder div that will be replaced with size pills
  let html = '<div class="form-group">';
  html += "<label>Size:</label>";
  html += '<div id="size-pills-container"></div>';
  html += "</div>";
  return html;
}

// Injects the size pills component into the modal after HTML is set
function injectSizePills(item) {
  const container = document.getElementById("size-pills-container");
  if (!container || !item.sizes || item.sizes.length === 0) return;

  const sizePills = renderSizePills(item, {
    name: "modal-size",
    onChange: (size, price) => {
      updatePriceInModal();
    },
  });

  container.appendChild(sizePills);
}

function createFlavorSelector(item) {
  if (!item.flavors || item.flavors.length === 0) return "";

  let html = '<div class="form-group">';
  html += '<label for="modal-flavor">Flavor:</label>';
  html +=
    '<select id="modal-flavor" class="flavor-select" onchange="updateDietaryOptionsInModal()">';
  for (const flavor of item.flavors) {
    html += `<option value="${flavor}">${flavor}</option>`;
  }
  html += "</select>";
  html += "</div>";
  return html;
}

function createFlavorNotes(item) {
  if (!item.flavorNotes) return "";

  let html = '<div class="form-group">';
  html += '<label for="modal-notes">Flavor Notes:</label>';
  html +=
    '<input type="text" id="modal-notes" class="flavor-notes" placeholder="Optional flavor preferences">';
  html += "</div>";
  return html;
}

function createQuantityInput() {
  let html = '<div class="form-group">';
  html += '<label for="modal-qty">Quantity:</label>';
  html += '<input type="number" id="modal-qty" class="quantity-input" min="1" value="1">';
  html += "</div>";
  return html;
}

function createSpecialOptions(item) {
  if (!item.canGlutenfree && !item.canSugarfree && !item.canGiftWrap) return "";

  let html = '<div class="form-group dietary-options">';
  html += "<label>Special Options:</label>";
  if (item.canGlutenfree) {
    html +=
      '<label class="checkbox-label"><input type="checkbox" id="modal-gf" class="dietary-checkbox"> Gluten Free</label>';
  }
  if (item.canSugarfree) {
    html +=
      '<label class="checkbox-label"><input type="checkbox" id="modal-sf" class="dietary-checkbox"> Sugar Free</label>';
  }
  if (item.canGiftWrap) {
    html += `<label class="checkbox-label"><input type="checkbox" id="modal-gift" class="gift-checkbox" onchange="updatePriceInModal()"> 🎁 Gift Wrap (Mason Jar) +$${item.giftWrapPrice}</label>`;
  }
  html += "</div>";
  return html;
}

function createCustomizations(item) {
  if (!item.customizations || item.customizations.length === 0) return "";

  let html = '<div class="customization-options-container">';

  for (let i = 0; i < item.customizations.length; i++) {
    const customization = item.customizations[i];
    const groupId = `customization-${i}`;
    const isRadio = customization.selectionType === "single";

    html += `<div class="option-group" data-customization-index="${i}" data-selection-type="${customization.selectionType}">`;
    html += `<label class="option-label">${customization.label}${customization.required ? ' <span class="required">*</span>' : ' <span class="optional">(optional)</span>'}</label>`;

    // Add "None" option if not required and single selection
    if (!customization.required && isRadio) {
      html += `<button type="button" class="option-btn active" data-option="none" data-price="0" data-group="${groupId}">
        <div class="option-icon">⭕</div>
        <div class="option-text">
          <span class="option-name">None</span>
          <span class="option-price">No charge</span>
        </div>
        <div class="option-check">✓</div>
      </button>`;
    }

    for (let j = 0; j < customization.options.length; j++) {
      const option = customization.options[j];
      const isDefault = option.default === true;
      const priceText = option.price > 0 ? `+$${option.price.toFixed(2)}` : "Included";
      const activeClass = isDefault && customization.required ? " active" : "";

      // Use emoji based on option name or default
      const icon = getOptionIcon(option.name);

      html += `<button type="button" class="option-btn${activeClass}" data-option="${option.name}" data-price="${option.price || 0}" data-group="${groupId}">
        <div class="option-icon">${icon}</div>
        <div class="option-text">
          <span class="option-name">${option.name}</span>
          <span class="option-price">${priceText}</span>
        </div>
        <div class="option-check">✓</div>
      </button>`;
    }

    html += "</div>";
  }

  html += "</div>";
  return html;
}

function getOptionIcon(optionName) {
  const iconMap = {
    "cream cheese": "🧀",
    cinnamon: "🌀",
    sugar: "✨",
    chocolate: "🍫",
    vanilla: "🍦",
    caramel: "🍯",
    nuts: "🥜",
    sprinkles: "🎉",
    frosting: "🎂",
    glaze: "💧",
  };

  const lowerName = optionName.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key)) return icon;
  }
  return "✨"; // Default icon
}

function initializeOptionButtons() {
  document.querySelectorAll(".option-btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();

      // Get option group (for radio behavior)
      const group = this.closest(".option-group");
      const isRadio = group.dataset.selectionType === "single";

      if (isRadio) {
        // Deselect all in group
        group.querySelectorAll(".option-btn").forEach((b) => b.classList.remove("active"));
        // Select this one
        this.classList.add("active");
      } else {
        // Toggle this option for multiple selection
        this.classList.toggle("active");
      }

      // Update price
      updatePriceInModal();

      // Haptic feedback (mobile)
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    });
  });
}

function createModalContent(item, index) {
  const defaultPrice = getDefaultPrice(item);

  // Mobile-first vertical layout
  let html = '<div class="product-customizer">';

  // Product Preview Section - with error handling for images
  html += '<div class="product-preview">';
  const imagePath = item.image ? item.image.replaceAll("\\", "/") : PLACEHOLDER_IMAGE;
  html += `<img src="${imagePath}" alt="${item.name || "Product Image"}" loading="lazy" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}';">`;
  html += "</div>";

  // Product Info Section
  html += '<div class="product-info-section">';
  html += `<h2 class="product-name">${item.name}</h2>`;
  html += createModalBadges(item);
  html += createDietaryNotes(item);
  html += createAllergenWarnings(item);
  html += createDepositMessage(item);
  html += "</div>";

  // Options Section
  html += '<div class="product-options-section">';
  html += createSizeSelector(item);
  html += createCustomizations(item);
  html += createFlavorSelector(item);
  html += createFlavorNotes(item);
  html += createQuantityInput();
  html += createSpecialOptions(item);
  html += "</div>";

  // Sticky Price Bar
  html += '<div class="price-sticky">';
  html += '<div class="price-breakdown">';
  html += "<span>Base Price:</span>";
  html += `<span class="base-price">$${defaultPrice.toFixed(2)}</span>`;
  html += "</div>";
  html += '<div class="price-breakdown">';
  html += "<span>Customizations:</span>";
  html += '<span class="customization-total">+$0.00</span>';
  html += "</div>";
  html += '<div class="price-total">';
  html += "<span>Total:</span>";
  html += `<span class="total-amount">$${defaultPrice.toFixed(2)}</span>`;
  html += "</div>";
  html += `<button class="add-to-cart-btn-large" onclick="addToCart(${index})">Add to Cart $${defaultPrice.toFixed(2)}</button>`;
  html += "</div>";

  html += "</div>"; // Close product-customizer

  return html;
}

function updatePriceInModal() {
  const sizePillsContainer = document.getElementById("size-pills-container");
  const giftCheckbox = document.getElementById("modal-gift");
  const basePriceDisplay = document.querySelector(".base-price");
  const customizationDisplay = document.querySelector(".customization-total");
  const totalDisplay = document.querySelector(".total-amount");
  const addToCartBtn = document.querySelector(".add-to-cart-btn-large");

  const currentItem = menuItems[globalThis.currentModalIndex];
  let basePrice = 0;

  // Get price from size pills if available
  if (sizePillsContainer) {
    const selected = getSelectedSize(sizePillsContainer);
    if (selected) {
      basePrice = getPrice(currentItem, selected.size);
    } else {
      basePrice = getPrice(currentItem, currentItem.sizes?.[0] || "");
    }
  } else {
    // Fallback to first size price
    basePrice = getPrice(currentItem, currentItem.sizes?.[0] || "");
  }

  // Add deposit amount to base if applicable
  if (currentItem.hasDeposit && currentItem.depositAmount) {
    basePrice += currentItem.depositAmount;
  }

  let customizationTotal = 0;

  // Add gift wrap price if checked
  if (giftCheckbox?.checked && currentItem.canGiftWrap) {
    customizationTotal += currentItem.giftWrapPrice;
  }

  // Add customization prices from option buttons
  const activeOptions = document.querySelectorAll(".option-btn.active");
  for (const btn of activeOptions) {
    const price = Number.parseFloat(btn.dataset.price) || 0;
    customizationTotal += price;
  }

  const total = basePrice + customizationTotal;

  // Update displays
  if (basePriceDisplay) basePriceDisplay.textContent = `$${basePrice.toFixed(2)}`;
  if (customizationDisplay) customizationDisplay.textContent = `+$${customizationTotal.toFixed(2)}`;
  if (totalDisplay) totalDisplay.textContent = `$${total.toFixed(2)}`;
  if (addToCartBtn) addToCartBtn.textContent = `Add to Cart $${total.toFixed(2)}`;
}

function updateDietaryOptionsInModal() {
  // Similar, but for now, skip if not needed.
}

// Expose functions to global scope
globalThis.openProductModal = openProductModal;
globalThis.closeProductModal = closeProductModal;
globalThis.updatePriceInModal = updatePriceInModal;
globalThis.updateDietaryOptionsInModal = updateDietaryOptionsInModal;
globalThis.toggleQuickFilter = toggleQuickFilter;
globalThis.selectCategory = selectCategory;

// ========== INITIALIZE ON PAGE LOAD ==========

// Expose filter function
globalThis.filterAndDisplay = filterAndDisplay;

document.addEventListener("DOMContentLoaded", initializeProducts);

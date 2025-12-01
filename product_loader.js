// ========== PRODUCT DATA LOADER ==========
let menuItems = [];

async function loadProducts() {
  try {
    const response = await fetch("product_data.json");
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
  if (spinner) spinner.classList.remove("hidden");

  const products = await loadProducts();
  console.log("Loaded products:", products.length);

  if (spinner) spinner.style.display = "none";
  displayProducts(products);

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
  return activeBtn?.dataset?.filterCategory ?? "all";
}

function displayProducts(products) {
  console.log("Displaying products:", products.length);
  const grid = document.getElementById("productsGrid");
  console.log("Grid found:", !!grid);
  grid.innerHTML = "";

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
  let isFirstAccordion = true;

  for (const category of sortedCategories) {
    const items = productsByCategory[category];
    if (items && items.length > 0) {
      const accordion = createAccordionSection(category, items, globalIndex, isFirstAccordion);
      grid.appendChild(accordion.node);
      globalIndex = accordion.nextIndex;
      isFirstAccordion = false;
    }
  }
  console.log("Products displayed");
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

function createCookieSubAccordions(content, items, startIndex) {
  const subcategories = ["simple", "fancy", "complex"];
  let index = startIndex;

  for (const sub of subcategories) {
    const subItems = items.filter((item) => item.subcategory === sub);
    if (subItems.length > 0) {
      // Create subcategory accordion
      const subAccordion = document.createElement("div");
      subAccordion.className = "sub-accordion-section";

      const subHeader = document.createElement("button");
      subHeader.className = "sub-accordion-header";
      subHeader.setAttribute("aria-expanded", "false");
      const subLabel = sub.charAt(0).toUpperCase() + sub.slice(1);
      subHeader.innerHTML = `
        <span class="sub-accordion-title">${subLabel} Cookies <span class="accordion-count">(${subItems.length})</span></span>
        <svg class="accordion-icon" width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;

      const subContent = document.createElement("div");
      subContent.className = "sub-accordion-content";

      const grid = document.createElement("div");
      grid.className = "accordion-grid";
      for (const item of subItems) {
        const thumb = createProductThumbnail(item, index);
        grid.appendChild(thumb);
        index++;
      }
      subContent.appendChild(grid);

      subAccordion.appendChild(subHeader);
      subAccordion.appendChild(subContent);
      content.appendChild(subAccordion);

      subHeader.onclick = () => toggleAccordion(subHeader, subContent);
    }
  }

  return index;
}

function createAccordionSection(category, items, startIndex, isFirstAccordion = false) {
  const accordion = document.createElement("div");
  accordion.className = "accordion-section";

  const header = document.createElement("button");
  header.className = "accordion-header";
  header.setAttribute("aria-expanded", isFirstAccordion ? "true" : "false");
  const pluralCategory = pluralizeCategoryName(category);
  header.innerHTML = `
    <span class="accordion-title">${pluralCategory} <span class="accordion-count">(${items.length})</span></span>
    <svg class="accordion-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  const content = document.createElement("div");
  content.className = isFirstAccordion ? "accordion-content open" : "accordion-content";

  let index = startIndex;

  if (category === "Cookie") {
    index = createCookieSubAccordions(content, items, startIndex);
  } else {
    // Regular category
    const grid = document.createElement("div");
    grid.className = "accordion-grid";
    for (const item of items) {
      const thumb = createProductThumbnail(item, index);
      grid.appendChild(thumb);
      index++;
    }
    content.appendChild(grid);
  }

  accordion.appendChild(header);
  accordion.appendChild(content);
  header.onclick = () => toggleAccordion(header, content);

  return { node: accordion, nextIndex: index };
}

function toggleAccordion(header, content) {
  const isOpen = content.classList.contains("open");
  if (isOpen) {
    content.classList.remove("open");
    header.setAttribute("aria-expanded", "false");
  } else {
    content.classList.add("open");
    header.setAttribute("aria-expanded", "true");
  }
}

function createProductThumbnail(item, index) {
  const thumb = document.createElement("div");
  thumb.className = "product-thumbnail";
  thumb.onclick = () => openProductModal(menuItems.indexOf(item));

  const imgWrap = document.createElement("div");
  imgWrap.className = "thumbnail-image";
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
  thumb.appendChild(imgWrap);

  const nameDiv = document.createElement("div");
  nameDiv.className = "thumbnail-name";
  nameDiv.textContent = item.name;
  thumb.appendChild(nameDiv);

  const priceDiv = document.createElement("div");
  priceDiv.className = "thumbnail-price";
  const defaultPrice = getDefaultPrice(item);
  priceDiv.textContent = `Starting at $${defaultPrice.toFixed(2)}`;
  thumb.appendChild(priceDiv);

  return thumb;
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

function applyCategoryFilter(items, category) {
  if (category === "all") return items;
  return items.filter((item) => item.category === category);
}

function applySearchFilter(items, searchQuery) {
  if (!searchQuery) return items;
  const query = searchQuery.toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(query));
}

function applyDietaryFilters(items, gfChecked, sfChecked) {
  if (!gfChecked && !sfChecked) return items;
  return items.filter((item) => {
    if (gfChecked && item.canGlutenfree) return true;
    if (sfChecked && item.canSugarfree) return true;
    return false;
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

  const category = getCurrentCategory();
  filtered = applyCategoryFilter(filtered, category);

  const searchQuery = document.getElementById("productSearch").value;
  filtered = applySearchFilter(filtered, searchQuery);

  const gfFilter = document.getElementById("filter-gf")?.checked;
  const sfFilter = document.getElementById("filter-sf")?.checked;
  filtered = applyDietaryFilters(filtered, gfFilter, sfFilter);

  const sortBy = document.getElementById("productSort").value;
  filtered = sortProducts(filtered, sortBy);

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
  let html = '<div class="form-group">';
  html += '<label for="modal-size">Size:</label>';
  html += '<select id="modal-size" class="size-select" onchange="updatePriceInModal()">';
  for (const size of item.sizes) {
    html += `<option value="${size}">${size}</option>`;
  }
  html += "</select>";
  html += "</div>";
  return html;
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

  // Product Preview Section
  html += '<div class="product-preview">';
  if (item.image) {
    const imagePath = item.image.replace(/\\/g, "/");
    html += `<img src="${imagePath}" alt="${item.name || "Product Image"}" loading="lazy">`;
  } else {
    html += '<div class="image-placeholder">Image Coming Soon</div>';
  }
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
  html += `<button class="add-to-cart-btn-large" onclick="addToCart(${index})">Add to Cart - $${defaultPrice.toFixed(2)}</button>`;
  html += "</div>";

  html += "</div>"; // Close product-customizer

  return html;
}

function updatePriceInModal() {
  const sizeSelect = document.getElementById("modal-size");
  const giftCheckbox = document.getElementById("modal-gift");
  const basePriceDisplay = document.querySelector(".base-price");
  const customizationDisplay = document.querySelector(".customization-total");
  const totalDisplay = document.querySelector(".total-amount");
  const addToCartBtn = document.querySelector(".add-to-cart-btn-large");

  if (!sizeSelect) return;

  const selectedSize = sizeSelect.value.replaceAll(" ", "_");
  const currentItem = menuItems[globalThis.currentModalIndex];
  let basePrice = currentItem.sizePrice[selectedSize] || currentItem.basePrice || 0;

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
    const price = parseFloat(btn.dataset.price) || 0;
    customizationTotal += price;
  }

  const total = basePrice + customizationTotal;

  // Update displays
  if (basePriceDisplay) basePriceDisplay.textContent = `$${basePrice.toFixed(2)}`;
  if (customizationDisplay) customizationDisplay.textContent = `+$${customizationTotal.toFixed(2)}`;
  if (totalDisplay) totalDisplay.textContent = `$${total.toFixed(2)}`;
  if (addToCartBtn) addToCartBtn.textContent = `Add to Cart - $${total.toFixed(2)}`;
}

function updateDietaryOptionsInModal() {
  // Similar, but for now, skip if not needed.
}

// Expose functions to global scope
globalThis.openProductModal = openProductModal;
globalThis.closeProductModal = closeProductModal;
globalThis.updatePriceInModal = updatePriceInModal;
globalThis.updateDietaryOptionsInModal = updateDietaryOptionsInModal;

// ========== INITIALIZE ON PAGE LOAD ==========

// Expose filter function
globalThis.filterAndDisplay = filterAndDisplay;

document.addEventListener("DOMContentLoaded", initializeProducts);

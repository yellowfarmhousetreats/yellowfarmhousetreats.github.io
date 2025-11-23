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

  if (category === "Cookie") {
    // Group cookies by subcategory with nested accordions
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
    accordion.appendChild(header);
    accordion.appendChild(content);
    
    header.onclick = () => toggleAccordion(header, content);
    return { node: accordion, nextIndex: index };
  }

  // Regular category
  const grid = document.createElement("div");
  grid.className = "accordion-grid";
  let index = startIndex;
  for (const item of items) {
    const thumb = createProductThumbnail(item, index);
    grid.appendChild(thumb);
    index++;
  }
  content.appendChild(grid);
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
  thumb.appendChild(imgWrap);

  const nameDiv = document.createElement("div");
  nameDiv.className = "thumbnail-name";
  nameDiv.textContent = item.name;
  thumb.appendChild(nameDiv);

  const priceDiv = document.createElement("div");
  priceDiv.className = "thumbnail-price";
  const defaultPrice = getDefaultPrice(item);
  priceDiv.textContent = `$${defaultPrice.toFixed(2)}`;
  thumb.appendChild(priceDiv);

  return thumb;
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

function filterAndDisplay() {
  let filtered = menuItems.slice(); // copy

  // Category filter
  const category = getCurrentCategory();
  if (category !== "all") {
    filtered = filtered.filter((item) => item.category === category);
  }

  // Search filter
  const searchQuery = document.getElementById("productSearch").value.toLowerCase();
  if (searchQuery) {
    filtered = filtered.filter((item) => item.name.toLowerCase().includes(searchQuery));
  }

  // Dietary filters (use checkbox states directly)
  const gfFilter = document.getElementById("filter-gf")?.checked;
  const sfFilter = document.getElementById("filter-sf")?.checked;
  if (gfFilter || sfFilter) {
    filtered = filtered.filter((item) => {
      if (gfFilter && item.canGlutenfree) return true;
      if (sfFilter && item.canSugarfree) return true;
      return false; // Only include if at least one filter matches
    });
  }

  // Sort
  const sortBy = document.getElementById("productSort").value;
  filtered.sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    const priceA = getDefaultPrice(a);
    const priceB = getDefaultPrice(b);
    if (sortBy === "price-low") return priceA - priceB;
    if (sortBy === "price-high") return priceB - priceA;
    return 0;
  });

  displayProducts(filtered);
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

  // Dietary options
  if (item.canGlutenfree || item.canSugarfree) {
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
  if (!sizeSelect || !priceDisplay) return;

  const selectedSize = sizeSelect.value.replaceAll(" ", "_");
  const currentItem = menuItems[globalThis.currentModalIndex];
  const price = currentItem.sizePrice[selectedSize] || currentItem.basePrice;
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

// ========== INITIALIZE ON PAGE LOAD ==========

// Expose filter function
globalThis.filterAndDisplay = filterAndDisplay;

document.addEventListener("DOMContentLoaded", initializeProducts);

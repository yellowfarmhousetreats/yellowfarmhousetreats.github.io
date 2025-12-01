/**
 * Treat Matcher Component
 * Tinder-style swipe interface for browsing treats
 * Touch gestures + button controls
 */

// ========== STATE ==========
let products = [];
let currentIndex = 0;
let cartItems = [];
let cartTotal = 0;
let pendingProduct = null; // Product waiting for size selection
let pendingSize = null; // Size waiting for customization
let pendingPrice = null; // Price waiting for customization

// Build Your Own Box state
let boxBuilderActive = false;
let boxTier = null; // 'simple' | 'fancy' | 'complex'
let boxSize = null; // 'Half Dozen' | 'Dozen'
let boxSlots = [];
let boxSlotCount = 0;
let availableCookies = []; // Cookies available for current tier

// Box pricing by tier
const BOX_PRICES = {
  simple: { "Half Dozen": 12, Dozen: 20 },
  fancy: { "Half Dozen": 18, Dozen: 32 },
  complex: { "Half Dozen": 24, Dozen: 42 },
};

// Touch/drag state
let isDragging = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentCard = null;

// Thresholds
const SWIPE_THRESHOLD = 100; // px to trigger swipe
const ROTATION_FACTOR = 0.1; // rotation per px of movement

// ========== INITIALIZATION ==========
document.addEventListener("DOMContentLoaded", init);

async function init() {
  // Load existing cart from localStorage
  loadCart();
  updateCartDisplay();

  // Load products
  await loadProducts();

  // Shuffle products for variety
  shuffleArray(products);

  // Render initial cards
  renderCards();

  // Setup event listeners
  setupEventListeners();
}

async function loadProducts() {
  try {
    const response = await fetch("/product_data.json");
    if (!response.ok) throw new Error("Failed to load products");
    products = await response.json();

    // Add "Build Your Own Box" virtual product at a random position
    const buildBoxCard = {
      uuid: "build-your-own-box",
      name: "Build Your Own Cookie Box",
      category: "Custom",
      image: "images/cookie-box.jpg",
      isBuildBox: true,
      dietaryNotes:
        "Mix & match your favorite cookies! Choose from Simple, Fancy, or Complex tiers.",
      canShip: true,
      weight: 2,
    };

    // Insert at random position in first half of deck
    const insertPos = Math.floor(Math.random() * Math.min(10, products.length / 2));
    products.splice(insertPos, 0, buildBoxCard);

    console.log(`Loaded ${products.length} products (including Build Box)`);
  } catch (error) {
    console.error("Error loading products:", error);
    showError("Couldn't load treats. Please refresh.");
  }
}

function loadCart() {
  try {
    const stored = localStorage.getItem("cart");
    if (stored) {
      cartItems = JSON.parse(stored);
      cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }
  } catch (e) {
    console.error("Error loading cart:", e);
    cartItems = [];
    cartTotal = 0;
  }
}

function saveCart() {
  try {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  } catch (e) {
    console.error("Error saving cart:", e);
  }
}

// ========== RENDERING ==========
function renderCards() {
  const stack = document.getElementById("cardStack");
  stack.innerHTML = "";

  // Show up to 3 cards (for stacking effect)
  const cardsToShow = Math.min(3, products.length - currentIndex);

  if (cardsToShow === 0) {
    showEndScreen();
    return;
  }

  // Render cards: first child = top card = currentIndex
  // nth-child(1) has highest z-index in CSS, so render current card first
  for (let i = 0; i < cardsToShow; i++) {
    const product = products[currentIndex + i];
    const card = createCard(product, i === 0);
    // Mark the top card so we can find it
    if (i === 0) {
      card.classList.add("top-card");
    }
    stack.appendChild(card);
  }

  // Setup touch/drag on top card (first child, which is currentIndex)
  currentCard = stack.querySelector(".top-card");
  if (currentCard) {
    setupCardGestures(currentCard);
  }

  // Update progress indicator
  updateProgress();
}

function createCard(product, isTop) {
  const card = document.createElement("div");
  card.className = "treat-card";
  card.dataset.uuid = product.uuid;

  // Get image URL (normalize Windows paths)
  const imageUrl = (product.image || "images/placeholder.svg").replaceAll("\\", "/");

  // Special card for Build Your Own Box
  if (product.isBuildBox) {
    card.classList.add("build-box-card");
    card.innerHTML = `
      <div class="card-image-wrapper build-box-image">
        <div class="build-box-icon">🍪📦</div>
        <div class="swipe-indicator like">LET'S BUILD!</div>
        <div class="swipe-indicator pass">SKIP</div>
      </div>
      <div class="card-info">
        <h2 class="card-name">${product.name}</h2>
        <span class="card-category">${product.category}</span>
        <p class="card-description">${product.dietaryNotes || ""}</p>
        <div class="card-price"><span class="from">from</span> $12.00</div>
        <div class="card-badges">
          <span class="badge ship">📦 Shippable</span>
          <span class="badge custom">✨ Custom</span>
        </div>
      </div>
    `;
    return card;
  }

  // Get price range
  const prices = getPrices(product);
  const priceDisplay =
    prices.min === prices.max
      ? `$${prices.min.toFixed(2)}`
      : `<span class="from">from</span> $${prices.min.toFixed(2)}`;

  // Build badges
  let badges = "";
  if (product.canGlutenfree) badges += '<span class="badge gf">GF Available</span>';
  if (product.canSugarfree) badges += '<span class="badge sf">SF Available</span>';
  if (product.canShip) badges += '<span class="badge ship">📦 Shippable</span>';

  card.innerHTML = `
    <div class="card-image-wrapper">
      <img src="${imageUrl}" alt="${product.name}" class="card-image" 
           onerror="this.src='images/placeholder.svg'">
      <div class="swipe-indicator like">ADDED!</div>
      <div class="swipe-indicator pass">PASS</div>
    </div>
    <div class="card-info">
      <h2 class="card-name">${product.name}</h2>
      <span class="card-category">${product.category}</span>
      <p class="card-description">${product.dietaryNotes || ""}</p>
      <div class="card-price">${priceDisplay}</div>
      ${badges ? `<div class="card-badges">${badges}</div>` : ""}
    </div>
  `;

  return card;
}

function getPrices(product) {
  const sizePrice = product.sizePrice || {};
  const prices = Object.values(sizePrice).filter((p) => typeof p === "number" && p > 0);

  if (prices.length === 0) return { min: 0, max: 0 };

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

// ========== GESTURES ==========
function setupEventListeners() {
  // Button clicks
  document.getElementById("passBtn").addEventListener("click", () => swipeCard("left"));
  document.getElementById("likeBtn").addEventListener("click", () => swipeCard("right"));
  document.getElementById("doneBtn").addEventListener("click", () => {
    globalThis.location.href = "/cart.html";
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") swipeCard("left");
    if (e.key === "ArrowRight") swipeCard("right");
  });
}

function setupCardGestures(card) {
  // Touch events
  card.addEventListener("touchstart", handleTouchStart, { passive: true });
  card.addEventListener("touchmove", handleTouchMove, { passive: false });
  card.addEventListener("touchend", handleTouchEnd);

  // Mouse events (for desktop)
  card.addEventListener("mousedown", handleMouseDown);
}

function handleTouchStart(e) {
  if (!currentCard) return;
  isDragging = true;
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  currentCard.classList.add("swiping");
}

function handleTouchMove(e) {
  if (!isDragging || !currentCard) return;

  currentX = e.touches[0].clientX - startX;
  const currentY = e.touches[0].clientY - startY;

  // If mostly vertical scrolling, don't swipe
  if (Math.abs(currentY) > Math.abs(currentX) * 1.5) return;

  e.preventDefault(); // Prevent scroll

  updateCardPosition(currentX);
}

function handleTouchEnd() {
  if (!isDragging || !currentCard) return;
  isDragging = false;
  currentCard.classList.remove("swiping");

  // Check if swipe threshold met
  if (Math.abs(currentX) > SWIPE_THRESHOLD) {
    swipeCard(currentX > 0 ? "right" : "left");
  } else {
    // Snap back
    resetCardPosition();
  }

  currentX = 0;
}

function handleMouseDown(e) {
  if (!currentCard) return;
  isDragging = true;
  startX = e.clientX;
  currentCard.classList.add("swiping");

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
}

function handleMouseMove(e) {
  if (!isDragging || !currentCard) return;
  currentX = e.clientX - startX;
  updateCardPosition(currentX);
}

function handleMouseUp() {
  if (!isDragging || !currentCard) return;
  isDragging = false;
  currentCard.classList.remove("swiping");

  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);

  if (Math.abs(currentX) > SWIPE_THRESHOLD) {
    swipeCard(currentX > 0 ? "right" : "left");
  } else {
    resetCardPosition();
  }

  currentX = 0;
}

function updateCardPosition(x) {
  if (!currentCard) return;

  const rotation = x * ROTATION_FACTOR;
  currentCard.style.transform = `translateX(${x}px) rotate(${rotation}deg)`;

  // Show tilt indicators
  if (x > 50) {
    currentCard.classList.add("tilting-right");
    currentCard.classList.remove("tilting-left");
  } else if (x < -50) {
    currentCard.classList.add("tilting-left");
    currentCard.classList.remove("tilting-right");
  } else {
    currentCard.classList.remove("tilting-left", "tilting-right");
  }
}

function resetCardPosition() {
  if (!currentCard) return;
  currentCard.style.transform = "";
  currentCard.classList.remove("tilting-left", "tilting-right");
}

// ========== SWIPE ACTIONS ==========
function swipeCard(direction) {
  if (!currentCard) return;

  const product = products[currentIndex];
  console.log(
    "%c SWIPE " +
      direction +
      " on index " +
      currentIndex +
      ": " +
      product.name +
      " (isBuildBox: " +
      product.isBuildBox +
      ")",
    "background: cyan; color: black; font-size: 14px"
  );

  // If liked, handle based on product type
  if (direction === "right") {
    if (product.isBuildBox) {
      // Show tier selection for Build Your Own Box
      console.log("Triggering showBoxTierPicker for Build Box");
      showBoxTierPicker();
    } else {
      // Normal product - show size picker
      showSizePicker(product);
    }
    return; // Don't advance yet - wait for selection
  }

  // Pass - just animate and move to next
  currentCard.classList.add("swipe-left");

  // Hide instructions after first swipe
  document.getElementById("instructions")?.classList.add("hidden");

  // Move to next card after animation
  setTimeout(() => {
    currentIndex++;
    renderCards();
  }, 400);
}

function addToCart(product, selectedSize, unitPrice) {
  // Check if already in cart with same size
  const existingIndex = cartItems.findIndex(
    (item) => item.name === product.name && item.size === selectedSize
  );

  if (existingIndex >= 0) {
    // Increment quantity and update total price
    cartItems[existingIndex].quantity++;
    cartItems[existingIndex].price = unitPrice * cartItems[existingIndex].quantity;
  } else {
    // Add new item with cart.js compatible format
    cartItems.push({
      name: product.name,
      size: selectedSize,
      flavor: "Standard",
      quantity: 1,
      price: unitPrice, // Total price (unit × qty)
      glutenFree: false,
      sugarFree: false,
      giftWrap: false,
      canShip: product.canShip || false,
      weight: product.weight || 0,
      hasDeposit: product.hasDeposit || false,
      depositAmount: product.depositAmount || 0,
      // Keep these for Treat Matcher internal use
      uuid: product.uuid,
      image: product.image,
      unitPrice: unitPrice,
    });
  }

  cartTotal += unitPrice;
  saveCart();
  updateCartDisplay();
}

function updateCartDisplay() {
  const countEl = document.getElementById("cartCount");
  const totalEl = document.getElementById("cartTotal");

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (countEl) countEl.textContent = itemCount;
  if (totalEl) totalEl.textContent = `$${cartTotal.toFixed(2)}`;
}

// ========== UI HELPERS ==========
function showAddedOverlay() {
  const overlay = document.getElementById("addedOverlay");
  overlay.classList.remove("hidden");

  setTimeout(() => {
    overlay.classList.add("hidden");
  }, 800);
}

function showEndScreen() {
  const endScreen = document.getElementById("endScreen");
  const finalCount = document.getElementById("finalCartCount");

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  finalCount.textContent = `${itemCount} item${itemCount === 1 ? "" : "s"} in your cart`;

  endScreen.classList.remove("hidden");
}

function showError(message) {
  const stack = document.getElementById("cardStack");
  stack.innerHTML = `
    <div class="empty-state">
      <p>${message}</p>
      <button onclick="location.reload()" class="restart-btn">Try Again</button>
    </div>
  `;
}

// ========== UTILITIES ==========
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ========== SIZE PICKER ==========
function showSizePicker(product) {
  console.log(
    "%c REGULAR SIZE PICKER for: " + product.name,
    "background: yellow; color: black; font-size: 16px"
  );
  pendingProduct = product;
  const modal = document.getElementById("sizePicker");
  const optionsContainer = document.getElementById("sizeOptions");

  // Build size options from product.sizePrice, deduplicating normalized keys
  const sizePrice = product.sizePrice || {};
  const seen = new Set();
  const sizes = [];

  for (const [size, price] of Object.entries(sizePrice)) {
    if (typeof price !== "number" || price <= 0) continue;
    // Normalize: lowercase and replace underscores with spaces
    const normalized = size.toLowerCase().replaceAll("_", " ");
    if (!seen.has(normalized)) {
      seen.add(normalized);
      sizes.push([size, price]);
    }
  }

  if (sizes.length === 0) {
    // No sizes available, use default
    selectSize("Default", 0);
    return;
  }

  optionsContainer.innerHTML = sizes
    .map(
      ([size, price]) => `
    <button class="size-option" onclick="selectSize('${size}', ${price})">
      <span class="size-name">${formatSizeLabel(size)}</span>
      <span class="size-price">$${price.toFixed(2)}</span>
    </button>
  `
    )
    .join("");

  modal.classList.remove("hidden");
}

function closeSizePicker() {
  const modal = document.getElementById("sizePicker");
  modal.classList.add("hidden");
  pendingProduct = null;
  // Reset card position since they didn't complete the add
  resetCardPosition();
}

function selectSize(size, price) {
  console.log(
    "%c selectSize called: " + size + " @ $" + price,
    "background: orange; color: black; font-size: 16px"
  );
  if (!pendingProduct) {
    console.log("No pending product - returning early");
    return;
  }

  const product = pendingProduct;
  console.log("Adding product:", product.name);

  // Check if product has customization options
  const hasCustomOptions = product.customizations?.some((c) => c.options?.length > 1);

  if (hasCustomOptions) {
    // Store pending info and show customization picker
    pendingSize = size;
    pendingPrice = price;
    showCustomizationPicker(product);
    document.getElementById("sizePicker").classList.add("hidden");
    return;
  }

  // No customization needed - proceed to cart
  completeAddToCart(product, size, price);
}

function completeAddToCart(product, size, price, customization = null) {
  pendingProduct = null;

  // Close modal
  document.getElementById("sizePicker").classList.add("hidden");

  // Add to cart with selected size
  if (customization) {
    addToCartWithCustomization(product, size, price, customization);
  } else {
    addToCart(product, size, price);
  }

  // Now animate the card away
  if (currentCard) {
    currentCard.classList.add("swipe-right");
  }

  // Show celebration
  showAddedOverlay();

  // Hide instructions
  document.getElementById("instructions")?.classList.add("hidden");

  // Move to next card
  setTimeout(() => {
    currentIndex++;
    renderCards();
  }, 400);
}

function formatSizeLabel(key) {
  if (!key || typeof key !== "string") return "";
  // Convert underscores to spaces and title case
  return key.replaceAll("_", " ").replaceAll(/\b\w/g, (c) => c.toUpperCase());
}

// ========== PROGRESS INDICATOR ==========
function updateProgress() {
  let progressEl = document.getElementById("progressIndicator");

  // Create if doesn't exist
  if (!progressEl) {
    progressEl = document.createElement("div");
    progressEl.id = "progressIndicator";
    progressEl.className = "progress-indicator";
    document.querySelector(".matcher-header").appendChild(progressEl);
  }

  const remaining = products.length - currentIndex;
  const percent = ((currentIndex / products.length) * 100).toFixed(0);

  progressEl.innerHTML = `
    <span class="progress-text">${remaining} left</span>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${percent}%"></div>
    </div>
  `;
}

// ========== CUSTOMIZATION PICKER ==========
// For single/multi-select options like "chip flavor" that apply to the whole batch

function showCustomizationPicker(product) {
  const builder = document.getElementById("customBuilder");
  const productNameEl = document.getElementById("customProductName");
  const optionsGrid = document.getElementById("customOptions");
  const subtitle = builder.querySelector(".custom-subtitle");
  const targetSection = builder.querySelector(".custom-target");
  const doneBtn = document.getElementById("customDone");

  // Get the first customization with options
  const customization = product.customizations.find((c) => c.options && c.options.length > 0);
  if (!customization) {
    completeAddToCart(product, pendingSize, pendingPrice);
    return;
  }

  const options = customization.options;
  const isSingleSelect = customization.selectionType === "single";
  const isRequired = customization.required;

  // Update UI for simple selection mode
  productNameEl.textContent = product.name;
  subtitle.textContent = customization.label || "Choose an option";

  // Hide the slots grid (not needed for single selection)
  targetSection.style.display = "none";

  // Find default option
  const defaultOption = options.find((o) => o.default)?.name || null;

  // Build option buttons (not draggable - just clickable)
  optionsGrid.innerHTML = options
    .map((opt) => {
      const isDefault = opt.default;
      const priceNote = opt.price > 0 ? ` (+$${opt.price.toFixed(2)})` : "";
      return `
      <button type="button" 
              class="custom-option-btn ${isDefault ? "selected" : ""}" 
              data-option-name="${opt.name}"
              data-option-price="${opt.price || 0}">
        <span class="option-name">${opt.name}${priceNote}</span>
        ${isDefault ? '<span class="default-badge">Default</span>' : ""}
      </button>
    `;
    })
    .join("");

  // Track selected option
  let selectedOption = defaultOption;
  let selectedPrice = options.find((o) => o.default)?.price || 0;

  // Add click handlers
  for (const btn of optionsGrid.querySelectorAll(".custom-option-btn")) {
    btn.addEventListener("click", () => {
      // Deselect others (single select mode)
      if (isSingleSelect) {
        for (const b of optionsGrid.querySelectorAll(".custom-option-btn")) {
          b.classList.remove("selected");
        }
      }
      btn.classList.toggle("selected");

      if (btn.classList.contains("selected")) {
        selectedOption = btn.dataset.optionName;
        selectedPrice = Number.parseFloat(btn.dataset.optionPrice) || 0;
      } else {
        selectedOption = null;
        selectedPrice = 0;
      }

      // Update done button state
      doneBtn.disabled = isRequired && !selectedOption;
    });
  }

  // Enable done button (unless required and nothing selected)
  doneBtn.disabled = isRequired && !selectedOption;

  // Setup action buttons
  document.getElementById("customCancel").onclick = cancelCustomizationPicker;
  document.getElementById("customDone").onclick = () => {
    finishCustomizationPicker(product, selectedOption, selectedPrice);
  };

  builder.classList.remove("hidden");
}

function cancelCustomizationPicker() {
  const builder = document.getElementById("customBuilder");
  builder.classList.add("hidden");

  // Reset pending state
  pendingSize = null;
  pendingPrice = null;

  // Show target section again for next time
  builder.querySelector(".custom-target").style.display = "";

  // Go back to size picker
  document.getElementById("sizePicker").classList.remove("hidden");
}

function finishCustomizationPicker(product, selectedOption, extraPrice) {
  const builder = document.getElementById("customBuilder");
  builder.classList.add("hidden");

  // Show target section again for next time
  builder.querySelector(".custom-target").style.display = "";

  // Calculate final price (base + any customization upcharge)
  const finalPrice = pendingPrice + extraPrice;

  // Add to cart with the selected customization as flavor
  const flavorText = selectedOption || "Standard";

  // Complete add to cart
  addToCartWithFlavor(product, pendingSize, finalPrice, flavorText);

  pendingProduct = null;
  pendingSize = null;
  pendingPrice = null;

  // Animate card away
  if (currentCard) {
    currentCard.classList.add("swipe-right");
  }

  showAddedOverlay();
  document.getElementById("instructions")?.classList.add("hidden");

  setTimeout(() => {
    currentIndex++;
    renderCards();
  }, 400);
}

function addToCartWithFlavor(product, selectedSize, unitPrice, flavor) {
  // Check if already in cart with same size AND flavor
  const existingIndex = cartItems.findIndex(
    (item) => item.name === product.name && item.size === selectedSize && item.flavor === flavor
  );

  if (existingIndex >= 0) {
    cartItems[existingIndex].quantity++;
    cartItems[existingIndex].price = unitPrice * cartItems[existingIndex].quantity;
  } else {
    cartItems.push({
      name: product.name,
      size: selectedSize,
      flavor: flavor,
      quantity: 1,
      price: unitPrice,
      glutenFree: false,
      sugarFree: false,
      giftWrap: false,
      canShip: product.canShip || false,
      weight: product.weight || 0,
      hasDeposit: product.hasDeposit || false,
      depositAmount: product.depositAmount || 0,
      uuid: product.uuid,
      image: product.image,
      unitPrice: unitPrice,
    });
  }

  cartTotal += unitPrice;
  saveCart();
  updateCartDisplay();
}

// ========== BUILD YOUR OWN BOX ==========

function showBoxTierPicker() {
  console.log("showBoxTierPicker called");

  // MUST hide size picker first - it can block the custom builder
  const sizePicker = document.getElementById("sizePicker");
  if (sizePicker) {
    sizePicker.classList.add("hidden");
    sizePicker.style.display = "none";
  }

  const builder = document.getElementById("customBuilder");
  if (!builder) {
    console.error("customBuilder element not found!");
    return;
  }

  const productNameEl = document.getElementById("customProductName");
  const optionsGrid = document.getElementById("customOptions");
  const subtitle = builder.querySelector(".custom-subtitle");
  const targetSection = builder.querySelector(".custom-target");
  const doneBtn = document.getElementById("customDone");

  boxBuilderActive = true;

  // Update UI for tier selection
  productNameEl.textContent = "Build Your Own Box";
  subtitle.textContent = "Choose your cookie tier";
  targetSection.style.display = "none";

  // Get cookie counts per tier - debug what we're filtering
  console.log(
    "Products sample:",
    products.slice(0, 3).map((p) => ({ name: p.name, cat: p.category, sub: p.subcategory }))
  );

  const simpleCookies = products.filter(
    (p) => p.subcategory === "simple" && p.category === "Cookie"
  );
  const fancyCookies = products.filter((p) => p.subcategory === "fancy" && p.category === "Cookie");
  const complexCookies = products.filter(
    (p) => p.subcategory === "complex" && p.category === "Cookie"
  );

  console.log("Cookie counts:", {
    simple: simpleCookies.length,
    fancy: fancyCookies.length,
    complex: complexCookies.length,
  });

  // Build tier buttons - use unique class to avoid conflicts
  optionsGrid.innerHTML = `
    <button type="button" class="box-tier-btn" data-tier="simple">
      <div class="tier-info">
        <span class="tier-name">🍪 Simple Cookies</span>
        <span class="tier-desc">${simpleCookies.length} varieties • Classic favorites</span>
      </div>
      <span class="tier-price">from $12</span>
    </button>
    <button type="button" class="box-tier-btn" data-tier="fancy">
      <div class="tier-info">
        <span class="tier-name">✨ Fancy Cookies</span>
        <span class="tier-desc">${fancyCookies.length} varieties • Special recipes</span>
      </div>
      <span class="tier-price">from $18</span>
    </button>
    <button type="button" class="box-tier-btn" data-tier="complex">
      <div class="tier-info">
        <span class="tier-name">🎂 Complex Cookies</span>
        <span class="tier-desc">${complexCookies.length} varieties • Premium creations</span>
      </div>
      <span class="tier-price">from $24</span>
    </button>
  `;

  // Add click handlers with unique selector
  for (const btn of optionsGrid.querySelectorAll(".box-tier-btn")) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      boxTier = btn.dataset.tier;
      showBoxSizePicker();
    });
  }

  doneBtn.style.display = "none";
  doneBtn.onclick = null; // Clear any old handlers
  document.getElementById("customCancel").onclick = cancelBoxBuilder;

  console.log("About to show builder, current classes:", builder.className);
  builder.classList.remove("hidden");
  console.log("Builder shown, new classes:", builder.className);
}

function showBoxSizePicker() {
  console.log("showBoxSizePicker called, tier:", boxTier);
  console.log(
    "%c BOX SIZE PICKER - tier: " + boxTier,
    "background: green; color: white; font-size: 16px"
  );

  const optionsGrid = document.getElementById("customOptions");
  const subtitle = document.querySelector(".custom-subtitle");
  const doneBtn = document.getElementById("customDone");
  const tierPrices = BOX_PRICES[boxTier];

  subtitle.textContent = `Choose box size`;

  // Keep done button hidden during size selection
  doneBtn.style.display = "none";
  doneBtn.onclick = null; // Clear any old handlers

  optionsGrid.innerHTML = `
    <button type="button" class="box-size-btn" data-size="Half Dozen">
      <span class="option-name">Half Dozen (6 cookies)</span>
      <span class="option-price">$${tierPrices["Half Dozen"].toFixed(2)}</span>
    </button>
    <button type="button" class="box-size-btn" data-size="Dozen">
      <span class="option-name">Dozen (12 cookies)</span>
      <span class="option-price">$${tierPrices["Dozen"].toFixed(2)}</span>
    </button>
  `;

  // Use unique class to avoid conflicts with customization picker
  for (const btn of optionsGrid.querySelectorAll(".box-size-btn")) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent event bubbling
      console.log("Size button clicked:", btn.dataset.size);
      boxSize = btn.dataset.size;
      boxSlotCount = boxSize === "Dozen" ? 12 : 6;
      showBoxBuilder();
    });
  }
}

function showBoxBuilder() {
  console.log("showBoxBuilder called");
  console.log(
    "%c SHOW BOX BUILDER - about to show cookie selection",
    "background: purple; color: white; font-size: 16px"
  );
  try {
    const optionsGrid = document.getElementById("customOptions");
    const slotsGrid = document.getElementById("customSlots");
    const subtitle = document.querySelector(".custom-subtitle");
    const targetSection = document.querySelector(".custom-target");
    const doneBtn = document.getElementById("customDone");
    const filledEl = document.getElementById("filledSlots");
    const totalEl = document.getElementById("totalSlots");

    console.log("Elements found:", {
      optionsGrid: !!optionsGrid,
      slotsGrid: !!slotsGrid,
      targetSection: !!targetSection,
    });

    // Get cookies for this tier
    availableCookies = products.filter((p) => p.subcategory === boxTier && p.category === "Cookie");
    console.log(
      `Box Builder: tier=${boxTier}, found ${availableCookies.length} cookies`,
      availableCookies.map((c) => c.name)
    );

    // Reset slots
    boxSlots = Array.from({ length: boxSlotCount }, () => null);

    const tierLabel = boxTier.charAt(0).toUpperCase() + boxTier.slice(1);
    subtitle.textContent = `Drag ${tierLabel} cookies into your box`;

    // Show target section
    targetSection.style.display = "";
    totalEl.textContent = boxSlotCount;
    filledEl.textContent = "0";

    // Build draggable cookie options
    const cookieHTML = availableCookies
      .map(
        (cookie, idx) => `
      <div class="custom-option box-cookie" 
           draggable="true" 
           data-cookie-index="${idx}"
           data-cookie-name="${cookie.name}">
        <span class="option-icon">🍪</span>
        <span class="option-name">${cookie.name.replace(" Cookies", "")}</span>
      </div>
    `
      )
      .join("");
    console.log("Cookie HTML length:", cookieHTML.length);
    optionsGrid.innerHTML = cookieHTML;

    // Build drop slots
    slotsGrid.innerHTML = Array.from(
      { length: boxSlotCount },
      (_, idx) => `
      <div class="custom-slot box-slot" data-slot-index="${idx}">
        <span class="slot-number">${idx + 1}</span>
      </div>
    `
    ).join("");

    // Setup drag and drop
    setupBoxDragAndDrop();

    // Setup done button
    doneBtn.style.display = "";
    doneBtn.disabled = true;
    doneBtn.onclick = finishBoxBuilder;

    console.log("showBoxBuilder completed successfully");
  } catch (err) {
    console.error("showBoxBuilder error:", err);
  }
}

function setupBoxDragAndDrop() {
  const draggables = document.querySelectorAll(".box-cookie");
  const slots = document.querySelectorAll(".box-slot");

  for (const draggable of draggables) {
    draggable.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", draggable.dataset.cookieName);
      draggable.classList.add("dragging");
    });

    draggable.addEventListener("dragend", () => {
      draggable.classList.remove("dragging");
    });

    // Touch support
    draggable.addEventListener("touchstart", handleBoxTouchStart, { passive: false });
    draggable.addEventListener("touchmove", handleBoxTouchMove, { passive: false });
    draggable.addEventListener("touchend", handleBoxTouchEnd);
  }

  for (const slot of slots) {
    slot.addEventListener("dragover", (e) => {
      e.preventDefault();
      slot.classList.add("drag-over");
    });

    slot.addEventListener("dragleave", () => {
      slot.classList.remove("drag-over");
    });

    slot.addEventListener("drop", (e) => {
      e.preventDefault();
      slot.classList.remove("drag-over");
      const cookieName = e.dataTransfer.getData("text/plain");
      fillBoxSlot(slot, cookieName);
    });

    slot.addEventListener("click", () => {
      if (slot.classList.contains("filled")) {
        clearBoxSlot(slot);
      }
    });
  }
}

// Touch drag state for box builder
let boxTouchElement = null;
let boxTouchClone = null;

function handleBoxTouchStart(e) {
  e.preventDefault();
  boxTouchElement = e.target.closest(".box-cookie");
  if (!boxTouchElement) return;

  boxTouchClone = boxTouchElement.cloneNode(true);
  boxTouchClone.classList.add("touch-dragging");
  boxTouchClone.style.position = "fixed";
  boxTouchClone.style.pointerEvents = "none";
  boxTouchClone.style.zIndex = "9999";
  document.body.appendChild(boxTouchClone);

  const touch = e.touches[0];
  boxTouchClone.style.left = `${touch.clientX - 40}px`;
  boxTouchClone.style.top = `${touch.clientY - 40}px`;

  boxTouchElement.classList.add("dragging");
}

function handleBoxTouchMove(e) {
  if (!boxTouchClone) return;
  e.preventDefault();

  const touch = e.touches[0];
  boxTouchClone.style.left = `${touch.clientX - 40}px`;
  boxTouchClone.style.top = `${touch.clientY - 40}px`;

  const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
  const slot = elementBelow?.closest(".box-slot");

  for (const s of document.querySelectorAll(".box-slot")) {
    s.classList.remove("drag-over");
  }
  if (slot) {
    slot.classList.add("drag-over");
  }
}

function handleBoxTouchEnd(e) {
  if (!boxTouchElement || !boxTouchClone) return;

  const touch = e.changedTouches[0];
  const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
  const slot = elementBelow?.closest(".box-slot");

  if (slot) {
    fillBoxSlot(slot, boxTouchElement.dataset.cookieName);
  }

  boxTouchElement.classList.remove("dragging");
  boxTouchClone.remove();
  boxTouchElement = null;
  boxTouchClone = null;

  for (const s of document.querySelectorAll(".box-slot")) {
    s.classList.remove("drag-over");
  }
}

function fillBoxSlot(slot, cookieName) {
  const slotIndex = Number.parseInt(slot.dataset.slotIndex);

  boxSlots[slotIndex] = cookieName;

  // Shorten display name
  const shortName = cookieName.replace(" Cookies", "").substring(0, 10);

  slot.innerHTML = `
    <span class="slot-filled-icon">🍪</span>
    <span class="slot-filled-name">${shortName}</span>
  `;
  slot.classList.add("filled");

  updateBoxProgress();
}

function clearBoxSlot(slot) {
  const slotIndex = Number.parseInt(slot.dataset.slotIndex);

  boxSlots[slotIndex] = null;

  slot.innerHTML = `<span class="slot-number">${slotIndex + 1}</span>`;
  slot.classList.remove("filled");

  updateBoxProgress();
}

function updateBoxProgress() {
  const filledCount = boxSlots.filter((s) => s !== null).length;
  const filledEl = document.getElementById("filledSlots");
  const doneBtn = document.getElementById("customDone");

  filledEl.textContent = filledCount;
  doneBtn.disabled = filledCount < boxSlotCount;

  if (filledCount === boxSlotCount) {
    doneBtn.classList.add("ready");
  } else {
    doneBtn.classList.remove("ready");
  }
}

function cancelBoxBuilder() {
  const builder = document.getElementById("customBuilder");
  builder.classList.add("hidden");

  // Reset state
  boxBuilderActive = false;
  boxTier = null;
  boxSize = null;
  boxSlots = [];

  // Show target section again
  builder.querySelector(".custom-target").style.display = "";
  document.getElementById("customDone").style.display = "";

  resetCardPosition();
}

function finishBoxBuilder() {
  console.log("%c FINISH BOX BUILDER CALLED", "background: red; color: white; font-size: 16px");
  console.log("boxSlots:", boxSlots);
  const builder = document.getElementById("customBuilder");
  builder.classList.add("hidden");

  // Show target section again
  builder.querySelector(".custom-target").style.display = "";

  // Calculate price
  const price = BOX_PRICES[boxTier][boxSize];

  // Summarize box contents
  const contents = summarizeBoxContents(boxSlots);
  const tierLabel = boxTier.charAt(0).toUpperCase() + boxTier.slice(1);

  // Add to cart
  cartItems.push({
    name: `Custom ${tierLabel} Cookie Box`,
    size: boxSize,
    flavor: contents,
    quantity: 1,
    price: price,
    glutenFree: false,
    sugarFree: false,
    giftWrap: false,
    canShip: true,
    weight: 2,
    hasDeposit: false,
    depositAmount: 0,
    uuid: `custom-box-${Date.now()}`,
    image: "images/cookie-box.jpg",
    unitPrice: price,
    boxContents: [...boxSlots], // Full array of cookies
  });

  cartTotal += price;
  saveCart();
  updateCartDisplay();

  // Reset state
  boxBuilderActive = false;
  boxTier = null;
  boxSize = null;
  boxSlots = [];

  // Animate and move on
  if (currentCard) {
    currentCard.classList.add("swipe-right");
  }

  showAddedOverlay();
  document.getElementById("instructions")?.classList.add("hidden");

  setTimeout(() => {
    currentIndex++;
    renderCards();
  }, 400);
}

function summarizeBoxContents(slots) {
  const counts = {};
  for (const cookie of slots) {
    if (cookie) {
      const short = cookie.replace(" Cookies", "");
      counts[short] = (counts[short] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([name, count]) => (count > 1 ? `${count}x ${name}` : name))
    .join(", ");
}

// Make functions available globally for onclick
globalThis.closeSizePicker = closeSizePicker;
globalThis.selectSize = selectSize;

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
    console.log(`Loaded ${products.length} products`);
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

  // Render cards in reverse order so first card is on top
  for (let i = cardsToShow - 1; i >= 0; i--) {
    const product = products[currentIndex + i];
    const card = createCard(product, i === 0);
    stack.appendChild(card);
  }

  // Setup touch/drag on top card
  currentCard = stack.querySelector(".treat-card");
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
  const imageUrl = (product.image || "images/placeholder.svg").replace(/\\/g, "/");

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
    window.location.href = "/cart.html";
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

  // If liked, show size picker instead of direct add
  if (direction === "right") {
    showSizePicker(product);
    return; // Don't advance yet - wait for size selection
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

function addToCart(product, selectedSize, price) {
  // Check if already in cart with same size
  const cartKey = `${product.uuid}-${selectedSize}`;
  const existingIndex = cartItems.findIndex(
    (item) => item.uuid === product.uuid && item.size === selectedSize
  );

  if (existingIndex >= 0) {
    cartItems[existingIndex].quantity++;
  } else {
    cartItems.push({
      uuid: product.uuid,
      name: product.name,
      size: selectedSize,
      price: price,
      quantity: 1,
      image: product.image,
    });
  }

  cartTotal += price;
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
  finalCount.textContent = `${itemCount} item${itemCount !== 1 ? "s" : ""} in your cart`;

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
  pendingProduct = product;
  const modal = document.getElementById("sizePicker");
  const optionsContainer = document.getElementById("sizeOptions");

  // Build size options from product.sizePrice
  const sizePrice = product.sizePrice || {};
  const sizes = Object.entries(sizePrice).filter(
    ([_, price]) => typeof price === "number" && price > 0
  );

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
  if (!pendingProduct) return;

  const product = pendingProduct;
  pendingProduct = null;

  // Close modal
  document.getElementById("sizePicker").classList.add("hidden");

  // Add to cart with selected size
  addToCart(product, size, price);

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
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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

// Make closeSizePicker available globally for onclick
window.closeSizePicker = closeSizePicker;
window.selectSize = selectSize;

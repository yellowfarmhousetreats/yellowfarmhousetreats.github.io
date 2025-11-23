// ========== CART MANAGEMENT ==========
let cart = [];

// Expose cart array to global scope
if (globalThis.window !== undefined) {
  globalThis.cart = cart;
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  globalThis.cart = cart;
}

function loadCart() {
  const saved = localStorage.getItem("cart");
  if (saved) {
    try {
      cart = JSON.parse(saved);
      globalThis.cart = cart;
    } catch (e) {
      console.error("Failed to load cart from localStorage:", e);
      cart = [];
      globalThis.cart = cart;
    }
  }
  return cart;
}

function addToCart(index) {
  // Ensure menuItems exists (loaded from product_loader.js)
  if (typeof menuItems === "undefined" || !menuItems?.[index]) {
    showError("Product information not available. Please refresh the page.");
    return;
  }

  const item = menuItems[index];
  let size, flavor, qty, glutenFree, sugarFree, giftWrap;

  const modal = document.getElementById("productModal");
  const modalOpen = modal?.open;

  if (modalOpen) {
    size = document.getElementById("modal-size").value;
    flavor = document.getElementById("modal-flavor")?.value || "Standard";
    qty = Number.parseInt(document.getElementById("modal-qty").value) || 1;
    glutenFree = document.getElementById("modal-gf")?.checked || false;
    sugarFree = document.getElementById("modal-sf")?.checked || false;
    giftWrap = document.getElementById("modal-gift")?.checked || false;
  } else {
    size = document.getElementById(`size-${index}`).value;
    flavor = document.getElementById(`flavor-${index}`)?.value || "Standard";
    qty = Number.parseInt(document.getElementById(`qty-${index}`).value) || 1;
    glutenFree = document.getElementById(`gf-${index}`)?.checked || false;
    sugarFree = document.getElementById(`sf-${index}`)?.checked || false;
    giftWrap = document.getElementById(`gift-${index}`)?.checked || false;
  }

  let price = item.sizePrice[size.replaceAll(" ", "_")];
  
  // Add gift wrap price if selected
  if (giftWrap && item.canGiftWrap) {
    price += item.giftWrapPrice;
  }
  
  let totalPrice = price * qty;

  const cartItem = {
    name: item.name,
    size: size,
    flavor: flavor,
    quantity: qty,
    price: totalPrice,
    glutenFree: glutenFree,
    sugarFree: sugarFree,
    giftWrap: giftWrap,
    canShip: item.canShip || false,
    weight: item.weight || 0,
    hasDeposit: item.hasDeposit || false,
    depositAmount: item.depositAmount || 0,
  };

  cart.push(cartItem);
  updateCart();
  saveCart();

  if (modalOpen) {
    closeProductModal();
  } else {
    document.getElementById(`qty-${index}`).value = 1;
  }

  showSuccess(`Added ${qty}x ${item.name} to order!`);

  // Animate cart icon on add
  if (typeof animateCartIcon === "function") {
    animateCartIcon();
  }
}

function updateCart() {
  const orderItemsDiv = document.getElementById("orderItems");

  if (!orderItemsDiv) {
    console.warn("orderItems div not found");
    return;
  }

  if (cart.length === 0) {
    orderItemsDiv.innerHTML = '<div class="empty-items">No items added yet</div>';
  } else {
    orderItemsDiv.innerHTML = cart
      .map(
        (item) => `
      <div class="order-item">
        <div class="order-item-details">
          <div>
            <div class="order-item-name">${item.name}</div>
            <div class="order-item-specs">${item.quantity}x - ${item.size}${item.flavor === "Standard" ? "" : ` - ${item.flavor}`}${item.glutenFree ? " [GF]" : ""}${item.sugarFree ? " [SF]" : ""}${item.giftWrap ? " 🎁 [Gift Wrap]" : ""}</div>
          </div>
          <div class="order-item-price">$${item.price.toFixed(2)}</div>
        </div>
        <div class="order-item-actions">
          <button type="button" class="btn btn-remove btn-small" onclick="removeFromCart(${cart.indexOf(item)})">Remove</button>
        </div>
      </div>
    `
      )
      .join("");
  }

  // Update navigation cart badge
  if (typeof updateCartBadge === "function") {
    updateCartBadge();
  }

  saveCart();
  checkShippingAvailability();
  calculateTotals();

  // Handle deposit info for items requiring deposit
  const depositInfo = document.getElementById("depositPickupInfo");
  if (depositInfo) {
    const hasDeposit = cart.some((item) => item.hasDeposit);
    depositInfo.style.display = hasDeposit ? "block" : "none";
  }
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

function clearCart() {
  cart = [];
  updateCart();
}

// ========== SHIPPING AVAILABILITY ==========
// ========== SHIPPING AVAILABILITY ==========
function checkShippingAvailability() {
  const shippingRadio = document.getElementById("fulfillmentShip");
  const fulfillmentNote = document.getElementById("fulfillmentNote");
  
  if (!shippingRadio) return;

  const allCanShip = cart.length > 0 && cart.every((item) => item.canShip);

  shippingRadio.disabled = !allCanShip;
  
  if (fulfillmentNote) {
    fulfillmentNote.classList.toggle("hidden", allCanShip);
  }

  // If shipping is now disabled and was selected, switch to pickup
  if (shippingRadio.disabled && shippingRadio.checked) {
    const pickupRadio = document.getElementById("fulfillmentPickup");
    if (pickupRadio) {
      pickupRadio.checked = true;
      handleFulfillmentChange();
    }
  }
}

// ========== PAYMENT DETAILS ==========
const paymentInfo = {
  Cash: "Pay 50% deposit now to secure your appointment. Bring remaining 50% at pickup.",
  "Cash App":
    "Send 50% deposit to: <a href='https://cash.app/$DanaBlueMoonHaven'>$DanaBlueMoonHaven</a>",
  Venmo:
    "Send 50% deposit to: <a href='https://venmo.com/BlueMoonHaven'>@BlueMoonHaven</a> to secure your appointment.",
  PayPal:
    "Send 50% deposit to: <a href='https://paypal.me/BlueMoonHaven'>@BlueMoonHaven</a> to secure your appointment.",
  Zelle:
    "Use Zelle to send 50% deposit to: <strong>805-709-4680</strong> to secure your appointment.",
};

function updatePaymentDetails() {
  const selectedMethod = document.querySelector('input[name="payment_method"]:checked')?.value;
  const detailsDiv = document.getElementById("paymentDetails");
  const contentDiv = document.getElementById("paymentDetailsContent");

  if (selectedMethod && paymentInfo[selectedMethod]) {
    contentDiv.innerHTML = paymentInfo[selectedMethod];
    detailsDiv.style.display = "block";
  } else {
    detailsDiv.style.display = "none";
  }
}

// ========== FULFILLMENT METHODS ==========
function handleFulfillmentChange() {
  const fulfillment = document.querySelector('input[name="fulfillment_method"]:checked').value;
  const pickupSection = document.getElementById("pickupSection");
  const shippingSection = document.getElementById("shippingSection");
  const pickupDateInput = document.getElementById("pickupDate");
  const pickupTimeInput = document.getElementById("pickupTime");
  const shippingInputs = document.querySelectorAll("#shippingSection input");
  const depositInfo = document.getElementById("depositPickupInfo");

  if (fulfillment === "Pickup") {
    pickupSection.classList.add("visible");
    pickupSection.classList.remove("hidden-section");
    shippingSection.classList.remove("visible");
    shippingSection.classList.add("hidden-section");

    pickupDateInput.required = true;
    pickupTimeInput.required = true;
    for (const input of shippingInputs) {
      input.required = false;
    }

    document.getElementById("summaryShippingRow").style.display = "none";
    depositInfo.style.display = "block";
  } else {
    pickupSection.classList.remove("visible");
    pickupSection.classList.add("hidden-section");
    shippingSection.classList.add("visible");
    shippingSection.classList.remove("hidden-section");

    pickupDateInput.required = false;
    pickupTimeInput.required = false;
    for (const input of shippingInputs) {
      input.required = true;
    }

    document.getElementById("summaryShippingRow").style.display = "flex";
    depositInfo.style.display = "none";
  }
  calculateTotals();
}

// ========== SHIPPING CALCULATION ==========
function calculateShipping() {
  const zipCode = document.getElementById("shippingZip").value;
  let shippingCost = 0;

  if (zipCode) {
    const zip = Number.parseInt(zipCode);
    if (zip >= 83600 && zip <= 83899) {
      shippingCost = 10;
    } else if (zip >= 97000 && zip <= 97999) {
      shippingCost = 15;
    } else if (zip >= 98000 && zip <= 99999) {
      shippingCost = 15;
    } else if (zip >= 84000 && zip <= 84999) {
      shippingCost = 12;
    } else {
      shippingCost = 20;
    }
  }

  document.getElementById("shippingCost").textContent = `$${shippingCost.toFixed(2)}`;
  calculateTotals();
}

// ========== CALCULATE TOTALS ==========
function calculateTotals() {
  const subtotalEl = document.getElementById("summarySubtotal");
  const shippingEl = document.getElementById("summaryShipping");
  const totalEl = document.getElementById("summaryTotal");
  const depositEl = document.getElementById("summaryDeposit");
  const balanceEl = document.getElementById("summaryBalance");
  const fulfillmentInput = document.querySelector('input[name="fulfillment_method"]:checked');
  const shippingCostEl = document.getElementById("shippingCost");

  // If we're not on the checkout page, silently exit
  if (
    !subtotalEl ||
    !shippingEl ||
    !totalEl ||
    !depositEl ||
    !balanceEl ||
    !fulfillmentInput ||
    !shippingCostEl
  ) {
    return;
  }

  let subtotal = cart.reduce((sum, item) => sum + item.price, 0);

  let shippingCost = 0;
  if (fulfillmentInput.value === "Shipping") {
    const shippingCostText = shippingCostEl.textContent;
    shippingCost = Number.parseFloat(shippingCostText.replace("$", "")) || 0;
  }

  const total = subtotal + shippingCost;
  const baseDeposit = total * 0.5;
  const additionalDeposit = cart.reduce(
    (sum, item) => sum + (item.hasDeposit ? item.depositAmount : 0),
    0
  );
  const deposit = baseDeposit + additionalDeposit;
  const balance = total - deposit;

  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  shippingEl.textContent = `$${shippingCost.toFixed(2)}`;
  totalEl.textContent = `$${total.toFixed(2)}`;
  depositEl.textContent = `$${deposit.toFixed(2)}`;
  balanceEl.textContent = `$${balance.toFixed(2)}`;

  // Update deposit display if present
  const depositDisplay = document.getElementById("depositDisplayAmount");
  if (depositDisplay) {
    depositDisplay.textContent = `$${deposit.toFixed(2)}`;
  }
  const balanceDisplay = document.getElementById("balanceDisplayAmount");
  if (balanceDisplay) {
    balanceDisplay.textContent = `$${balance.toFixed(2)}`;
  }

  const orderSummaryInput = document.getElementById("orderSummary");
  if (orderSummaryInput) {
    const orderDetails = cart
      .map(
        (item) =>
          `${item.quantity}x ${item.name} - ${item.size}${item.flavor === "Standard" ? "" : " - " + item.flavor}${item.glutenFree ? " [GF]" : ""}${item.sugarFree ? " [SF]" : ""}${item.giftWrap ? " [Gift Wrap]" : ""}: $${item.price.toFixed(2)}`
      )
      .join("\n");
    orderSummaryInput.value =
      orderDetails +
      `\n\nTotal: $${total.toFixed(2)}\nDeposit Due: $${deposit.toFixed(2)}\nBalance Due at Pickup: $${balance.toFixed(2)}`;
  }
}

// ========== FORM SUBMISSION ==========
document.getElementById("orderForm").addEventListener("submit", function (e) {
  if (cart.length === 0) {
    e.preventDefault();
    showError("Please add at least one item to your order.");
    return;
  }

  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  if (!name || !phone) {
    e.preventDefault();
    showError("Please fill in your name and phone number.");
    return;
  }

  const paymentMethod = document.querySelector('input[name="payment_method"]:checked');
  if (!paymentMethod) {
    e.preventDefault();
    showError("Please select a payment method.");
    return;
  }

  const fulfillment = document.querySelector('input[name="fulfillment_method"]:checked').value;
  if (fulfillment === "Pickup") {
    const pickupDate = document.getElementById("pickupDate").value;
    const pickupTime = document.getElementById("pickupTime").value;
    if (!pickupDate || !pickupTime) {
      e.preventDefault();
      showError("Please select a pickup date and time.");
      return;
    }
  }

  // Build comprehensive order summary
  buildOrderSummary();

  calculateTotals();
});

// ========== BUILD ORDER SUMMARY ==========
function buildOrderSummary() {
  const name = document.getElementById("customerName").value.trim();
  const email = document.getElementById("customerEmail").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const notes = document.getElementById("specialInstructions").value.trim();
  const fulfillment = document.querySelector('input[name="fulfillment_method"]:checked').value;
  const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;

  let summary = `=== CUSTOMER INFORMATION ===\n`;
  summary += `Name: ${name}\n`;
  summary += `Email: ${email}\n`;
  summary += `Phone: ${phone}\n`;
  if (notes) summary += `Notes: ${notes}\n`;
  summary += `\n`;

  summary += `=== ORDER DETAILS ===\n`;
  for (const item of cart) {
    summary += `${item.quantity}x ${item.name} - ${item.size}`;
    if (item.flavor && item.flavor !== "Standard") summary += ` - ${item.flavor}`;
    if (item.glutenFree) summary += " [GF]";
    if (item.sugarFree) summary += " [SF]";
    if (item.giftWrap) summary += " [Gift Wrap]";
    summary += `: $${item.price.toFixed(2)}\n`;
  }
  summary += `\n`;

  summary += `=== FULFILLMENT ===\n`;
  if (fulfillment === "Pickup") {
    const pickupDate = document.getElementById("pickupDate").value;
    const pickupTime = document.getElementById("pickupTime").value;
    summary += `Pickup: ${pickupDate} at ${pickupTime}\n`;
  } else {
    const shippingAddress = document.getElementById("shippingAddress").value.trim();
    const shippingCity = document.getElementById("shippingCity").value.trim();
    const shippingState = document.getElementById("shippingState").value.trim();
    const shippingZip = document.getElementById("shippingZip").value.trim();
    summary += `Shipping to: ${shippingAddress}, ${shippingCity}, ${shippingState} ${shippingZip}\n`;
  }
  summary += `\n`;

  summary += `=== PAYMENT ===\n`;
  summary += `Method: ${paymentMethod}\n`;
  summary += `\n`;

  // Calculate totals
  let subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  let shippingCost = 0;
  if (fulfillment === "Shipping") {
    const shippingCostText = document.getElementById("shippingCost").textContent;
    shippingCost = Number.parseFloat(shippingCostText.replace("$", "")) || 0;
  }
  const total = subtotal + shippingCost;
  const baseDeposit = total * 0.5;
  const additionalDeposit = cart.reduce(
    (sum, item) => sum + (item.hasDeposit ? item.depositAmount : 0),
    0
  );
  const deposit = baseDeposit + additionalDeposit;
  const balance = total - deposit;

  summary += `=== TOTALS ===\n`;
  summary += `Subtotal: $${subtotal.toFixed(2)}\n`;
  if (shippingCost > 0) summary += `Shipping: $${shippingCost.toFixed(2)}\n`;
  summary += `Total: $${total.toFixed(2)}\n`;
  summary += `Deposit Due: $${deposit.toFixed(2)}\n`;
  summary += `Balance Due at ${fulfillment === "Pickup" ? "Pickup" : "Delivery"}: $${balance.toFixed(2)}\n`;

  document.getElementById("orderSummary").value = summary;
}

// ========== RESET FORM ==========
function resetFormComplete() {
  document.getElementById("orderForm").reset();
  cart = [];
  updateCart();
  document.getElementById("pickupDate").value = "";
  document.getElementById("pickupTime").value = "";

  document.getElementById("fulfillmentPickup").checked = true;
  handleFulfillmentChange();
  document.getElementById("paymentDetails").style.display = "none";
}

// ========== ALERTS ==========
function showError(message) {
  const alert = document.getElementById("errorAlert");
  alert.textContent = "❌ " + message;
  alert.classList.add("visible");
  setTimeout(() => alert.classList.remove("visible"), 5000);
}

function showSuccess(message) {
  const alert = document.getElementById("successAlert");
  alert.textContent = "✅ " + message;
  alert.classList.add("visible");
  setTimeout(() => alert.classList.remove("visible"), 3000);
}

function proceedToCart() {
  if (cart.length === 0) {
    document.getElementById("emptyCartAlert").classList.remove("hidden");
    document.getElementById("readyToProceedAlert").classList.add("hidden");
  } else {
    document.getElementById("emptyCartAlert").classList.add("hidden");
    document.getElementById("readyToProceedAlert").classList.add("hidden");
    globalThis.location.href = "cart.html";
  }
}

// ========== INITIALIZE ==========
// Expose cart functions to global scope for inline event handlers
globalThis.addToCart = addToCart;
globalThis.removeFromCart = removeFromCart;
globalThis.clearCart = clearCart;
globalThis.proceedToCart = proceedToCart;
globalThis.showSuccess = showSuccess;
globalThis.showError = showError;
globalThis.updatePaymentDetails = updatePaymentDetails;
globalThis.handleFulfillmentChange = handleFulfillmentChange;
globalThis.calculateShipping = calculateShipping;
globalThis.loadCart = loadCart;
globalThis.updateCart = updateCart;

// Load cart immediately when script loads
loadCart();

document.addEventListener("DOMContentLoaded", function () {
  // Cart is already loaded, just update UI
  updateCart();
  checkShippingAvailability();
  calculateTotals();

  // Set pickup date restrictions: min 2 days, max 14 days
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + 2);
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 14);

  const pickupDateInput = document.getElementById("pickupDate");
  if (pickupDateInput) {
    pickupDateInput.min = minDate.toISOString().split("T")[0];
    pickupDateInput.max = maxDate.toISOString().split("T")[0];
    // Set default to min date
    pickupDateInput.value = pickupDateInput.min;
  }
  
  // Initialize progressive disclosure
  initializeProgressiveDisclosure();
});

// ========== PROGRESSIVE DISCLOSURE SYSTEM ==========
function initializeProgressiveDisclosure() {
  const steps = document.querySelectorAll('.step-container');
  const summaryBox = document.querySelector('.summary-box');
  const depositInfo = document.getElementById('depositPickupInfo');
  const submitContainer = document.querySelector('.submit-container');
  
  if (!steps.length) return; // Safety check
  
  // Hide all steps except cart (first one)
  steps.forEach((step, index) => {
    if (index > 0) {
      step.style.maxHeight = '0';
      step.style.overflow = 'hidden';
      step.style.opacity = '0';
      step.style.transition = 'max-height 0.5s ease, opacity 0.5s ease, margin 0.5s ease';
      step.style.marginBottom = '0';
    }
  });
  
  // Hide summary and submit initially
  if (summaryBox) {
    summaryBox.style.maxHeight = '0';
    summaryBox.style.overflow = 'hidden';
    summaryBox.style.opacity = '0';
    summaryBox.style.transition = 'max-height 0.5s ease, opacity 0.5s ease';
  }
  if (depositInfo) {
    depositInfo.style.maxHeight = '0';
    depositInfo.style.overflow = 'hidden';
    depositInfo.style.opacity = '0';
    depositInfo.style.transition = 'max-height 0.5s ease, opacity 0.5s ease';
  }
  if (submitContainer) {
    submitContainer.style.maxHeight = '0';
    submitContainer.style.overflow = 'hidden';
    submitContainer.style.opacity = '0';
    submitContainer.style.transition = 'max-height 0.5s ease, opacity 0.5s ease';
  }
  
  // Check cart and reveal Step 1 if items exist
  checkCartAndRevealStep1();
  
  // Add listeners for form field completion
  setupStepListeners();
}

function revealStep(stepIndex) {
  const steps = document.querySelectorAll('.step-container');
  if (stepIndex < steps.length && steps[stepIndex]) {
    const step = steps[stepIndex];
    step.style.maxHeight = '2000px';
    step.style.opacity = '1';
    step.style.marginBottom = '30px';
    
    // Scroll to the newly revealed step
    setTimeout(() => {
      step.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
}

function revealSummaryAndSubmit() {
  const summaryBox = document.querySelector('.summary-box');
  const depositInfo = document.getElementById('depositPickupInfo');
  const submitContainer = document.querySelector('.submit-container');
  
  if (summaryBox) {
    summaryBox.style.maxHeight = '1000px';
    summaryBox.style.opacity = '1';
  }
  if (depositInfo && !depositInfo.classList.contains('hidden')) {
    depositInfo.style.maxHeight = '500px';
    depositInfo.style.opacity = '1';
  }
  if (submitContainer) {
    submitContainer.style.maxHeight = '200px';
    submitContainer.style.opacity = '1';
    
    setTimeout(() => {
      submitContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  }
}

function checkCartAndRevealStep1() {
  if (typeof cart !== 'undefined' && cart && cart.length > 0) {
    revealStep(1); // Reveal "Your Information" step
  }
}

function setupStepListeners() {
  // Step 1: Customer Information - reveal Step 2 when name and phone filled
  const nameInput = document.getElementById('customerName');
  const phoneInput = document.getElementById('customerPhone');
  const step1ContinueBtn = document.getElementById('step1Continue');
  
  const checkStep1 = () => {
    if (nameInput && phoneInput && nameInput.value.trim() && phoneInput.value.trim()) {
      if (step1ContinueBtn) step1ContinueBtn.classList.remove('hidden');
    } else {
      if (step1ContinueBtn) step1ContinueBtn.classList.add('hidden');
    }
  };
  
  if (nameInput) {
    nameInput.addEventListener('input', checkStep1);
    nameInput.addEventListener('blur', checkStep1);
  }
  if (phoneInput) {
    phoneInput.addEventListener('input', checkStep1);
    phoneInput.addEventListener('blur', checkStep1);
  }
  
  // Step 2: Fulfillment - reveal Step 3 when pickup date/time set
  const pickupDate = document.getElementById('pickupDate');
  const pickupTime = document.getElementById('pickupTime');
  const shippingZip = document.getElementById('shippingZip');
  const step2PickupContinue = document.getElementById('step2PickupContinue');
  const step2ShipContinue = document.getElementById('step2ShipContinue');
  
  const checkStep2 = () => {
    const fulfillmentMethod = document.querySelector('input[name="fulfillment_method"]:checked')?.value;
    if (fulfillmentMethod === 'Pickup' && pickupDate && pickupTime && pickupDate.value && pickupTime.value) {
      if (step2PickupContinue) step2PickupContinue.classList.remove('hidden');
      revealStep(3); // Auto-reveal Step 3
    } else {
      if (step2PickupContinue) step2PickupContinue.classList.add('hidden');
    }
    
    if (fulfillmentMethod === 'Shipping' && shippingZip && shippingZip.value.trim().length >= 5) {
      if (step2ShipContinue) step2ShipContinue.classList.remove('hidden');
      revealStep(3); // Auto-reveal Step 3
    } else {
      if (step2ShipContinue) step2ShipContinue.classList.add('hidden');
    }
  };
  
  if (pickupDate) {
    pickupDate.addEventListener('change', checkStep2);
    pickupDate.addEventListener('input', checkStep2);
  }
  if (pickupTime) {
    pickupTime.addEventListener('change', checkStep2);
    pickupTime.addEventListener('input', checkStep2);
  }
  if (shippingZip) {
    shippingZip.addEventListener('blur', checkStep2);
    shippingZip.addEventListener('change', checkStep2);
    shippingZip.addEventListener('input', checkStep2);
  }
  
  // Also check when fulfillment method changes
  const fulfillmentRadios = document.querySelectorAll('input[name="fulfillment_method"]');
  fulfillmentRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (step2PickupContinue) step2PickupContinue.classList.add('hidden');
      if (step2ShipContinue) step2ShipContinue.classList.add('hidden');
      setTimeout(checkStep2, 500); // Delay to allow fields to populate
    });
  });
  
  // Initial check on page load
  setTimeout(checkStep2, 100);
  
  // Step 3: Special Instructions - reveal Step 4 and summary immediately (optional field)
  // Auto-reveal after Step 2 is complete
  const checkStep3 = () => {
    const steps = document.querySelectorAll('.step-container');
    if (steps[3] && steps[3].style.opacity === '1') {
      revealStep(4); // Reveal payment method
      revealSummaryAndSubmit();
    }
  };
  
  // Use mutation observer to detect when Step 3 is revealed
  const steps = document.querySelectorAll('.step-container');
  if (steps[3]) {
    const observer = new MutationObserver(() => {
      checkStep3();
    });
    observer.observe(steps[3], { attributes: true, attributeFilter: ['style'] });
  }
}

// Function to manually continue to next step
function continueToNextStep(stepNumber) {
  revealStep(stepNumber);
}

// Override updateCart to trigger Step 1 reveal when cart has items
const originalUpdateCart = globalThis.updateCart;
if (originalUpdateCart && typeof originalUpdateCart === 'function') {
  globalThis.updateCart = function() {
    originalUpdateCart.call(this);
    if (typeof cart !== 'undefined' && cart && cart.length > 0) {
      checkCartAndRevealStep1();
    }
  };
}

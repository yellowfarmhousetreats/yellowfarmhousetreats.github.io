/**
 * Size Selector Component
 * Renders radio button pills for product size selection
 * Mobile-first with 44px+ touch targets
 */

// Possessive word mappings (words that need apostrophe-s)
const POSSESSIVES = new Set(["bakers", "grandmas", "moms", "chefs"]);

// Special case mappings for display
const SPECIAL_LABELS = {
  bakers_dozen: "Baker's Dozen",
  half_dozen: "Half Dozen",
  full_dozen: "Full Dozen",
  mini: "Mini",
  small: "Small",
  medium: "Medium",
  large: "Large",
  xl: "XL",
  xxl: "XXL",
};

/**
 * Formats a size key for display
 * @param {string} key - Size key like "3_pack" or "bakers_dozen"
 * @returns {string} - Formatted label like "3 Pack" or "Baker's Dozen"
 */
function formatSizeLabel(key) {
  if (!key || typeof key !== "string") return "";

  // Check special cases first
  const lowerKey = key.toLowerCase();
  if (SPECIAL_LABELS[lowerKey]) {
    return SPECIAL_LABELS[lowerKey];
  }

  // Convert underscores to spaces and process each word
  return key
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => {
      const lowerWord = word.toLowerCase();

      // Handle possessives (bakers → Baker's)
      if (POSSESSIVES.has(lowerWord)) {
        // Remove trailing 's' and add apostrophe-s
        const base = lowerWord.slice(0, -1);
        return base.charAt(0).toUpperCase() + base.slice(1) + "'s";
      }

      // Title case for regular words
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Gets price for a size from product
 * @param {Object} product - Product object with sizePrice
 * @param {string} size - Size key
 * @returns {number} - Price or 0 if not found
 */
function getPriceForSize(product, size) {
  if (!product?.sizePrice) return 0;

  // Try exact match
  if (size in product.sizePrice) {
    return product.sizePrice[size];
  }

  // Try normalized key (spaces to underscores, lowercase)
  const normalizedKey = size.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  if (normalizedKey in product.sizePrice) {
    return product.sizePrice[normalizedKey];
  }

  // Try original sizes mapping
  if (product._originalSizes) {
    for (const origSize of product._originalSizes) {
      const origNormalized = origSize.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
      if (origNormalized === normalizedKey && origSize in product.sizePrice) {
        return product.sizePrice[origSize];
      }
    }
  }

  return 0;
}

/**
 * Renders size selection pills for a product
 * @param {Object} product - Product object with sizes and sizePrice
 * @param {Object} options - Optional configuration
 * @param {string} options.name - Radio group name (default: 'size')
 * @param {Function} options.onChange - Callback when selection changes
 * @returns {HTMLElement} - Container element with size pills
 */
function renderSizePills(product, options = {}) {
  const { name = "size", onChange = null } = options;

  const container = document.createElement("div");
  container.className = "size-pills";

  // Get sizes array - prefer _originalSizes for display, fall back to sizes
  const sizes = product._originalSizes || product.sizes || [];

  if (sizes.length === 0) {
    container.innerHTML = '<span class="no-sizes">No sizes available</span>';
    return container;
  }

  // Generate unique ID prefix for this instance
  const idPrefix = `size-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const price = getPriceForSize(product, size);
    const isFirst = i === 0;

    // Create pill wrapper (label element for clickability)
    const pill = document.createElement("label");
    pill.className = "size-pill";
    pill.setAttribute("for", `${idPrefix}-${i}`);

    // Create radio input
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = name;
    radio.id = `${idPrefix}-${i}`;
    radio.value = size;
    radio.className = "size-radio";
    if (isFirst) radio.checked = true;

    // Add change handler
    if (onChange) {
      radio.addEventListener("change", () => onChange(size, price));
    }

    // Create label text container
    const labelContent = document.createElement("span");
    labelContent.className = "size-pill-content";

    // Size name
    const sizeLabel = document.createElement("span");
    sizeLabel.className = "size-label";
    sizeLabel.textContent = formatSizeLabel(size);

    // Price
    const priceLabel = document.createElement("span");
    priceLabel.className = "size-price";
    priceLabel.textContent = `$${price.toFixed(2)}`;

    labelContent.appendChild(sizeLabel);
    labelContent.appendChild(priceLabel);

    pill.appendChild(radio);
    pill.appendChild(labelContent);
    container.appendChild(pill);
  }

  return container;
}

/**
 * Gets the currently selected size from a size pills container
 * @param {HTMLElement} container - Size pills container element
 * @returns {Object|null} - { size, price } or null if none selected
 */
function getSelectedSize(container) {
  const checked = container.querySelector('input[type="radio"]:checked');
  if (!checked) return null;

  const pill = checked.closest(".size-pill");
  const priceEl = pill?.querySelector(".size-price");
  const price = priceEl ? Number.parseFloat(priceEl.textContent.replace("$", "")) : 0;

  return {
    size: checked.value,
    price: price,
  };
}

// Inject styles if not already present
function injectStyles() {
  if (document.getElementById("size-selector-styles")) return;

  const style = document.createElement("style");
  style.id = "size-selector-styles";
  style.textContent = `
    .size-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 12px 0;
    }

    .size-pill {
      display: flex;
      align-items: center;
      min-height: 44px;
      padding: 8px 16px;
      background: var(--color-white, #fff);
      border: 2px solid var(--border-color, #d4c5b9);
      border-radius: 24px;
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }

    .size-pill:hover {
      border-color: var(--wheat, #e8c547);
      background: rgba(232, 197, 71, 0.1);
    }

    .size-pill:active {
      transform: scale(0.97);
    }

    /* Hide the actual radio button */
    .size-radio {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
      pointer-events: none;
    }

    /* Selected state using :has() */
    .size-pill:has(.size-radio:checked) {
      background: var(--wheat, #e8c547);
      border-color: var(--wheat, #e8c547);
      color: var(--charcoal, #2c2c2c);
      font-weight: 600;
    }

    /* Focus state for accessibility */
    .size-pill:has(.size-radio:focus-visible) {
      outline: 3px solid var(--color-accent, #27ae60);
      outline-offset: 2px;
    }

    .size-pill-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .size-label {
      font-family: var(--font-ui, -apple-system, sans-serif);
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
    }

    .size-price {
      font-family: var(--font-ui, -apple-system, sans-serif);
      font-size: 13px;
      opacity: 0.8;
    }

    .size-pill:has(.size-radio:checked) .size-price {
      opacity: 1;
    }

    .no-sizes {
      color: var(--text-secondary, #666);
      font-style: italic;
      padding: 12px;
    }

    /* Fallback for browsers without :has() support */
    @supports not selector(:has(*)) {
      .size-radio:checked + .size-pill-content {
        font-weight: 600;
      }
      
      .size-pill:focus-within {
        background: var(--wheat, #e8c547);
        border-color: var(--wheat, #e8c547);
      }
    }
  `;
  document.head.appendChild(style);
}

// Auto-inject styles when module loads
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectStyles);
  } else {
    injectStyles();
  }
}

// Expose functions globally for non-module usage
globalThis.SizeSelector = {
  renderSizePills,
  formatSizeLabel,
  getSelectedSize,
};

// Also expose individual functions for convenience
globalThis.renderSizePills = renderSizePills;
globalThis.formatSizeLabel = formatSizeLabel;
globalThis.getSelectedSize = getSelectedSize;

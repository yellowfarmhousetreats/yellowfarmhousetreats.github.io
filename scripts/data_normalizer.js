/**
 * Data Normalizer Module
 * Handles normalization of product data from product_data.json
 * Provides consistent key formatting and price lookups
 */

/**
 * Normalizes a string key for consistent lookups
 * Converts spaces to underscores, removes hyphens, lowercases
 * @param {string} str - The string to normalize
 * @returns {string} - Normalized key
 * @example
 * normalizeKey("3 Pack") // "3_pack"
 * normalizeKey("Half Dozen") // "half_dozen"
 * normalizeKey("Gift-Wrapped") // "gift_wrapped"
 */
function normalizeKey(str) {
  if (!str || typeof str !== "string") return "";

  return str
    .toLowerCase()
    .trim()
    .replaceAll("-", "_") // hyphens to underscores
    .replaceAll(/\s+/g, "_") // spaces to underscores
    .replaceAll(/_+/g, "_") // collapse multiple underscores
    .replaceAll(/(?:^_)|(?:_$)/g, ""); // trim leading/trailing underscores
}

/**
 * Normalizes product data from product_data.json
 * @param {Array} rawProducts - Array of products from product_data.json
 * @returns {Array} - Array of normalized products
 */
function normalizeProductData(rawProducts) {
  if (!Array.isArray(rawProducts)) {
    console.warn("normalizeProductData: expected array, got", typeof rawProducts);
    return [];
  }

  return rawProducts.map((product) => {
    const normalized = { ...product };

    // Preserve original sizes for display
    if (product.sizes && Array.isArray(product.sizes)) {
      normalized._originalSizes = [...product.sizes];
    }

    // Normalize sizePrice keys
    if (product.sizePrice && typeof product.sizePrice === "object") {
      const normalizedPrices = {};
      for (const [key, value] of Object.entries(product.sizePrice)) {
        const normalizedKey = normalizeKey(key);
        normalizedPrices[normalizedKey] = value;
      }
      normalized.sizePrice = normalizedPrices;
    }

    // Compute _hasCustomizations flag
    normalized._hasCustomizations =
      Array.isArray(product.customizations) && product.customizations.length > 0;

    // Compute _hasDietaryOptions flag
    normalized._hasDietaryOptions = Boolean(product.canGlutenfree || product.canSugarfree);

    // Compute _complexity based on product characteristics
    normalized._complexity = computeComplexity(product);

    return normalized;
  });
}

/**
 * Computes product complexity score
 * @param {Object} product - Raw product object
 * @returns {string} - "simple" | "moderate" | "complex"
 */
function computeComplexity(product) {
  let score = 0;

  // Size options add complexity
  const sizeCount = product.sizes?.length || 0;
  score += Math.max(0, sizeCount - 1);

  // Customizations add significant complexity
  const customizations = product.customizations || [];
  score += customizations.length * 2;
  score += customizations.filter((c) => c.required).length;
  score += customizations.filter((c) => c.options?.length > 3).length;

  // Dietary options add some complexity
  score += (product.canGlutenfree ? 1 : 0) + (product.canSugarfree ? 1 : 0);

  // Flavors add complexity
  const flavorCount = product.flavors?.length || 0;
  score += Math.max(0, flavorCount - 1);

  // Additional features add minor complexity
  score += (product.canGiftWrap ? 1 : 0) + (product.hasDeposit ? 1 : 0);

  // Classify based on score
  if (score <= 2) return "simple";
  if (score <= 6) return "moderate";
  return "complex";
}

/**
 * Gets price for a product size with fuzzy matching
 * @param {Object} product - Normalized product object
 * @param {string} selectedSize - Size string (can be original format)
 * @returns {number} - Price for the size, or fallback to first available price
 */
function getPrice(product, selectedSize) {
  if (!product?.sizePrice) {
    console.warn("getPrice: product missing sizePrice", product?.name);
    return 0;
  }

  const prices = product.sizePrice;
  const priceKeys = Object.keys(prices);

  if (priceKeys.length === 0) {
    console.warn("getPrice: no prices defined for", product.name);
    return 0;
  }

  // Try exact match first (already normalized key)
  if (selectedSize in prices) {
    return prices[selectedSize];
  }

  // Try normalized version of selected size
  const normalizedSelection = normalizeKey(selectedSize);
  if (normalizedSelection in prices) {
    return prices[normalizedSelection];
  }

  // Try variations: with spaces instead of underscores
  const spaceVersion = selectedSize.replaceAll("_", " ");
  const normalizedSpace = normalizeKey(spaceVersion);
  if (normalizedSpace in prices) {
    return prices[normalizedSpace];
  }

  // Try case-insensitive match on original keys
  const lowerSelection = selectedSize.toLowerCase();
  for (const key of priceKeys) {
    if (key.toLowerCase() === lowerSelection) {
      return prices[key];
    }
  }

  // No match found - warn and return first price as fallback
  console.warn(
    `getPrice: no match for "${selectedSize}" in ${product.name}, using fallback`,
    priceKeys
  );
  return prices[priceKeys[0]];
}

/**
 * Gets display name for a size (uses original if available)
 * @param {Object} product - Normalized product object
 * @param {string} sizeKey - Normalized size key
 * @returns {string} - Display-friendly size name
 */
function getSizeDisplayName(product, sizeKey) {
  // If we have original sizes, find the matching one
  if (product._originalSizes && Array.isArray(product._originalSizes)) {
    for (const originalSize of product._originalSizes) {
      if (normalizeKey(originalSize) === normalizeKey(sizeKey)) {
        return originalSize;
      }
    }
  }

  // Fallback: convert key to title case
  return sizeKey.replaceAll("_", " ").replaceAll(/\b\w/g, (char) => char.toUpperCase());
}

// Expose functions globally for non-module usage
globalThis.DataNormalizer = {
  normalizeKey,
  normalizeProductData,
  getPrice,
  getSizeDisplayName,
};

// Also expose individual functions for convenience
globalThis.normalizeProductData = normalizeProductData;
globalThis.getPrice = getPrice;
globalThis.normalizeKey = normalizeKey;
globalThis.getSizeDisplayName = getSizeDisplayName;

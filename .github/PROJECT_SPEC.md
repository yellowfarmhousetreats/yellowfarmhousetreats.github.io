# Yellow Farmhouse Treats - Complete Project Specification

## Project Overview
E-commerce website for a home bakery selling cookies, breads, and specialty items. Static site (no backend/database) with client-side JavaScript for cart management. Hosted on GitHub Pages.

## Business Requirements

### Product Catalog
- 40+ products across 8 categories (Cookies, Breads, Cakes, Pies, Bars, Seasonal, Pecan English Toffee, Miscellaneous)
- Cookie category has nested sub-categories: Simple Cookies, Fancy Cookies, Complex Cookies
- Each product can have multiple size/quantity options with different prices
- Dietary accommodations: Products can be made gluten-free and/or sugar-free
- Special feature: Pecan English Toffee has optional gift wrap (+$5)

### Shopping Experience
- Browse products via accordion-style navigation (not doom scroll)
- Each product shows as thumbnail with image, name, price, dietary badges
- Click product to open modal with full details and add-to-cart options
- Floating cart badge shows item count (only visible when items in cart)
- Search, sort (A-Z, Z-A, Price), and dietary filters (GF/SF)

### Checkout Flow - Progressive Disclosure
Cart page reveals sections step-by-step as user completes information:

**Step 1: Your Information**
- Full Name, Phone, Email
- Continue button appears when name + phone filled
- Clicking Continue (or completing fields) reveals Step 2

**Step 2: How Would You Like Your Order?**
- Radio buttons: Pickup vs Ship to Me
- **Pickup path:**
  - Date picker (2-14 days from today)
  - Time window dropdown: 11 AM-1 PM, 1-3 PM, 3-5 PM, 5-7 PM, 7-8 PM (operating hours: 11 AM - 8 PM daily)
  - Continue button appears when both date + time selected
- **Shipping path:**
  - Full address form (address, city, state, ZIP)
  - Shipping cost calculation based on ZIP
  - Continue button appears when ZIP entered (5+ chars)
- Completing Step 2 auto-reveals Step 3

**Step 3: Special Instructions** (optional)
- Textarea for dietary needs, delivery instructions, allergies
- Auto-reveals Step 4 immediately

**Step 4: Select Payment Method**
- Radio buttons: Cash, Cash App, Venmo, PayPal, Zelle
- Shows payment details (usernames/phone) when selected

**Order Summary Box** (visible from Step 2 onward)
- Subtotal
- Shipping cost (if applicable)
- Total Due
- 50% Deposit Due Now
- Balance Due at Pickup/Delivery

**Submit Button**
- Sends order via email (FormSubmit.co)
- Shows success page on completion

## Design System

### Color Scheme (E-commerce 60-30-10 Rule)
```css
PRIMARY (60% - Brand): #8b7355 (warm brown)
SECONDARY (30% - Highlight): #c99f3a (golden)
ACCENT (10% - CTA): #27ae60 (green)
```

### Layout Philosophy
- No sticky header (removed for cleaner scrolling)
- Floating cart badge (transparent background, top-right, only shows when cart has items)
- Accordion navigation collapses/expands categories
- Modal centered with fixed positioning
- Responsive design for mobile/desktop

### Typography
- Headings: Quicksand (Google Font)
- Body: System fonts for performance

## Technical Architecture

### File Structure
```
/
├── index.html              # Main storefront
├── cart.html               # Checkout page
├── share-preview.html      # Social media preview
├── products.json           # Product catalog (single source of truth)
├── product_loader.js       # Storefront logic
├── cart.js                 # Cart & checkout logic
├── styles.css              # All styles
├── *.min.js / *.min.css   # Build artifacts (generated)
├── CNAME                   # Custom domain
├── robots.txt              # SEO
├── sitemap.xml             # SEO
├── package.json            # Build tooling
├── /images/                # Product photos
└── /scripts/               # Build automation
    ├── cacheBust.js
    └── update-sitemap.js
```

### Data Structure (products.json)
```json
{
  "name": "Product Name",
  "category": "Cookies",
  "subcategory": "Simple Cookies",
  "basePrice": 12.00,
  "image": "images/product.jpg",
  "description": "Full description text",
  "canGlutenfree": true,
  "canSugarfree": false,
  "sizes": ["1 Dozen", "2 Dozen"],
  "canGiftWrap": false,
  "giftWrapPrice": 0
}
```

### Cart Storage (localStorage)
```javascript
// Key: 'yft_cart'
// Schema: Array of objects
[
  {
    name: "Product Name",
    size: "1 Dozen",
    price: 12.00,
    quantity: 1,
    glutenfree: false,
    sugarfree: false,
    giftWrap: false
  }
]
```

### Key JavaScript Functions

**product_loader.js:**
- `loadProducts()` - Fetches products.json
- `createAccordionSection()` - Builds category accordions
- `createProductThumbnail()` - Renders product cards
- `openProductModal()` - Opens detail modal
- `window.addToCart()` - Adds item to cart (exposed globally)
- `applyFilters()` - GF/SF filtering
- `searchProducts()` - Text search
- `sortProducts()` - A-Z, Z-A, Price

**cart.js:**
- `loadCart()` - Reads localStorage
- `saveCart()` - Writes localStorage
- `updateCartBadge()` - Shows/hides badge with count
- `displayCartItems()` - Renders cart on checkout page
- `initializeProgressiveDisclosure()` - Sets up step reveal system
- `setupStepListeners()` - Monitors field completion
- `revealStep(n)` - Smoothly reveals next step
- `calculateShipping()` - ZIP-based shipping cost
- `buildOrderSummary()` - Updates totals
- `window.removeFromCart()` - Removes cart item (exposed globally)

### Progressive Disclosure Implementation
```javascript
// Steps hidden by default with CSS
.step-container {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-height 0.6s ease, opacity 0.4s ease;
}

// Revealed state
.step-container.visible {
  max-height: 2000px;
  opacity: 1;
}

// Continue buttons show/hide via classList
.step-continue-btn-container.hidden {
  display: none;
}
```

### Build Process
```bash
npm run build:js    # Minify JS with terser
npm run build:css   # Minify CSS with csso
npm run build       # Full build + cache bust + sitemap update
```

### SEO Implementation
- Meta tags (description, keywords, author)
- Open Graph tags (Facebook/social sharing)
- JSON-LD schema markup (LocalBusiness, BreadcrumbList)
- Sitemap.xml with automatic date updates
- robots.txt
- Lazy loading images with loading="lazy"
- WebP image format support

## Feature Details

### Accordion Navigation
- Main categories expand/collapse on click
- Cookie category has nested sub-accordions (Simple/Fancy/Complex)
- Smooth height transitions
- Only one section open at a time (auto-collapse others)
- Products display in grid within expanded section

### Product Modal
- Opens centered on screen (fixed positioning)
- Shows full description, dietary options, size selector
- Live price updates when options change
- Gift wrap checkbox (Pecan English Toffee only)
- Close via X button, backdrop click, or ESC key
- Prevents body scroll when open

### Cart Badge
- Fixed position: top 80px, right 20px
- Transparent background: rgba(0, 0, 0, 0.15)
- Only visible when cart.length > 0
- Shows item count, not product count (3x cookies = 3 items)
- Clicking badge does nothing (decorative)

### Dietary Filters
- Buttons toggle active state (highlighted when on)
- Filter products where canGlutenfree/canSugarfree = true
- Can combine both filters (AND logic)
- Clear all filters button resets to show everything
- State tracked in variables: gfFilterActive, sfFilterActive

### Gift Wrap Feature
- Only for Pecan English Toffee
- Checkbox in modal: "🎁 Gift wrap this toffee (+$5.00)"
- Updates price immediately when checked
- Stored in cart item as giftWrap: true/false
- Displays in cart as "🎁 [Gift Wrap]" line item

### Shipping Calculation
Based on ZIP code prefix:
- 930-934 (local): $5
- 935-936 (CA region): $10
- 900-929, 937-961 (CA): $15
- All other: $20

### Email Submission
- Uses FormSubmit.co (no backend required)
- POST to: https://formsubmit.co/yellowfarmhousetreats@gmail.com
- Order details formatted in hidden field
- Success page shown after submission

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive (viewport meta tag)
- JavaScript required (no fallback)
- localStorage required

## Performance Targets
- Page load: <2s
- Image lazy loading
- Minified assets in production
- Cache-busting query strings on CSS/JS

## Accessibility
- Semantic HTML (nav, header, main, section)
- Alt text on all images
- ARIA labels on buttons/controls
- Keyboard navigation support (tab, ESC)
- Color contrast meets WCAG AA standards

## Development Workflow

### Making Changes
1. Edit source files only (never touch .min.js/.min.css)
2. Test locally: `python3 -m http.server 8000`
3. Format code: `npm run format`
4. Build production assets: `npm run build`
5. Test cart flow end-to-end
6. Commit and push to GitHub
7. GitHub Pages auto-deploys main branch

### Critical IDs & Classes (Do Not Change)
- `#cartBadge` - Cart icon badge
- `#successAlert`, `#errorAlert` - Toast notifications
- `#productModal` - Modal container
- `localStorage['yft_cart']` - Cart storage key
- `window.addToCart()` - Called by inline onclick handlers
- `window.removeFromCart()` - Called by remove buttons
- `window.openProductModal()` - Called by product cards

### Testing Checklist
- [ ] Add item to cart → success alert shows
- [ ] Badge appears with correct count
- [ ] Badge persists after page refresh
- [ ] Cart page shows correct items and totals
- [ ] Remove item → badge updates
- [ ] GF/SF filters work alone and combined
- [ ] Search finds products
- [ ] Sort changes order
- [ ] Modal opens/closes correctly
- [ ] Modal options update price
- [ ] Gift wrap adds $5 to toffee
- [ ] Progressive disclosure reveals steps in order
- [ ] Continue buttons appear when fields complete
- [ ] Pickup time shows 2-hour windows
- [ ] Shipping calculates based on ZIP
- [ ] Order summary updates dynamically
- [ ] Form submits successfully
- [ ] Mobile viewport works (responsive)

## Common Pitfalls

### "Cart doesn't persist"
- Check localStorage isn't blocked (private browsing)
- Verify key is exactly `yft_cart`
- Confirm `saveCart()` is called after modifications

### "Badge doesn't show"
- Badge hidden by default with CSS
- Only shows when `cart.length > 0`
- Check `updateCartBadge()` is called after cart changes

### "Modal won't close"
- Verify close button has onclick="closeModal()"
- Backdrop click listener attached in `openProductModal()`
- ESC key listener in place

### "Steps don't reveal"
- Check `initializeProgressiveDisclosure()` runs on page load
- Verify field IDs match setupStepListeners() queries
- Confirm `revealStep()` adds `.visible` class

### "Continue button doesn't appear"
- Must use `.classList.add/remove('hidden')` not `style.display`
- Check field validation logic in `checkStep1()` / `checkStep2()`
- Verify button IDs: step1Continue, step2PickupContinue, step2ShipContinue

### "Inline style lint errors"
- Use `.hidden` class instead of `style="display: none;"`
- Update JS to use `classList` instead of `style.display`

### "Build doesn't update minified files"
- Run `npm run build` (not just build:js or build:css)
- Check terser/csso installed: `npm install`
- Verify package.json scripts are correct

## Deployment

### GitHub Pages Setup
1. Push to `main` branch
2. GitHub Pages serves from root directory
3. CNAME file contains custom domain
4. DNS A records point to GitHub IPs
5. HTTPS enabled automatically

### Custom Domain
- Domain: yellowfarmhousetreats.com
- CNAME record: `yellowfarmhousetreats.github.io`
- Verify in repo settings → Pages

## Future Enhancements (Not Implemented)

### Nice to Have
- Order history (requires backend)
- Customer accounts (requires auth)
- Real-time inventory (requires database)
- Payment processing (requires Stripe/PayPal integration)
- Order status tracking (requires backend)
- Admin dashboard (requires backend)

### Current Limitations
- No stock tracking (manual coordination)
- No order management (email-based)
- No customer database
- No automated order confirmation emails
- No sales analytics

## Support & Contact
- Email: yellowfarmhousetreats@gmail.com
- Instagram: @YellowFarmhouseTreats
- Operating Hours: 11 AM - 8 PM Daily
- Payment Methods: Cash, Cash App, Venmo, PayPal, Zelle

---

## How to Rebuild From Scratch

### 1. Initialize Project
```bash
mkdir yellowfarmhousestand.github.io
cd yellowfarmhousestand.github.io
git init
npm init -y
npm install terser csso-cli prettier --save-dev
```

### 2. Setup package.json Scripts
```json
{
  "scripts": {
    "format": "prettier --write .",
    "build:js": "terser product_loader.js -o product_loader.min.js && terser cart.js -o cart.min.js",
    "build:css": "csso styles.css --output styles.min.css",
    "postbuild": "node scripts/cacheBust.js && node scripts/update-sitemap.js",
    "build": "npm run build:js && npm run build:css && npm run postbuild"
  }
}
```

### 3. Create CSS Variables (styles.css)
Start with 60-30-10 color system:
```css
:root {
  --color-primary: #8b7355;      /* 60% - brown */
  --color-secondary: #c99f3a;    /* 30% - gold */
  --color-accent: #27ae60;       /* 10% - green */
  /* Add all neutrals, danger, etc. */
}
```

### 4. Build HTML Structure (index.html)
- Meta tags, Open Graph, JSON-LD schema
- Header with logo and cart badge (hidden by default)
- Search bar, sort dropdown, filter buttons
- Product container (will be populated by JS)
- Modal template (hidden by default)
- Success/error alert containers
- Link to minified CSS/JS

### 5. Create Product Data (products.json)
Array of 40+ products with all required fields

### 6. Build Product Loader (product_loader.js)
- Fetch products.json
- Group by category
- Create accordion sections
- Generate product thumbnails
- Implement search, sort, filters
- Build modal system
- Expose addToCart() globally

### 7. Build Cart System (cart.js)
- localStorage CRUD operations
- Badge visibility logic
- Alert system (success/error toasts)
- Expose removeFromCart() globally

### 8. Create Checkout Page (cart.html)
- Same header/footer as index.html
- Empty cart message
- Cart items display area
- 4-step progressive disclosure form
- Order summary box
- Deposit information
- Submit button with FormSubmit

### 9. Implement Progressive Disclosure
- Hide steps 2-4 with CSS (.step-container max-height: 0)
- setupStepListeners() monitors field completion
- revealStep() adds .visible class with transition
- Continue buttons show/hide with .hidden class
- Auto-reveal on field completion or button click

### 10. Build Scripts (scripts/)
- cacheBust.js: Updates query strings in HTML
- update-sitemap.js: Sets lastmod date

### 11. Add SEO Files
- sitemap.xml with all pages
- robots.txt (allow all)
- share-preview.html for social sharing

### 12. Setup GitHub Pages
- Create repo: username.github.io
- Push all files
- Enable GitHub Pages in settings
- Add CNAME file for custom domain

### 13. Test Everything
Run through entire testing checklist

### 14. Go Live
- Verify custom domain works
- Test on real mobile devices
- Share URL

---

**This document is the complete blueprint. Hand this to any developer and they'll know exactly what to build and how it works.**

    <script>
        // ========== PRODUCT DATABASE WITH FLAVOR NOTES ==========
        const menuItems = [
            {
                name: "Milk Bread",
                emoji: "🍞",
                sizes: ["Loaf"],
                basePrice: 12,
                flavors: ["Standard"],
                flavorNotes: {}
            },
            {
                name: "Pumpkin Bread",
                emoji: "🎃",
                sizes: ["Loaf"],
                basePrice: 12,
                flavors: ["Standard"],
                flavorNotes: {}
            },
            {
                name: "Mini Cakes (Cream Cheese Frosting)",
                emoji: "🧁",
                sizes: ["Single", "Half Dozen", "Dozen"],
                sizePrice: { "Single": 6, "Half Dozen": 30, "Dozen": 50 },
                flavors: ["Standard"],
                flavorNotes: {}
            },
            {
                name: "Cinnamon Rolls",
                emoji: "🌀",
                sizes: ["Half Dozen", "Dozen"],
                sizePrice: { "Half Dozen": 15, "Dozen": 28 },
                flavors: ["Standard"],
                flavorNotes: {}
            },
            {
                name: "Fruit Pies/Crisps",
                emoji: "🥧",
                sizes: ["Per Pie/Crisp"],
                basePrice: 25,
                flavors: ["Apple", "Pumpkin", "Peach", "Lemon Meringue", "Apple Crisp", "Pumpkin Crisp", "Peach Cobbler"],
                flavorNotes: {
                    "Apple Crisp": { glutenFree: true, sugarFree: true },
                    "Pumpkin Crisp": { glutenFree: true, sugarFree: true }
                },
                flavorPrices: { "Peach Cobbler": 5 },
                hasDeposit: true,
                depositAmount: 5,
                canShip: false
            },
            {
                name: "Muffins",
                emoji: "🧁",
                sizes: ["Half Dozen", "Dozen"],
                sizePrice: { "Half Dozen": 15, "Dozen": 28 },
                flavors: ["Pumpkin", "Oatmeal"],
                flavorNotes: {}
            },
            {
                name: "Cupcakes",
                emoji: "🧁",
                sizes: ["Half Dozen", "Dozen"],
                sizePrice: { "Half Dozen": 15, "Dozen": 28 },
                flavors: ["Chocolate Lava", "Ding Dongs", "Holiday Specials"],
                flavorNotes: {
                    "Chocolate Lava": { glutenFree: true, sugarFree: true }
                }
            },
            {
                name: "Cookies~Simple",
                emoji: "🍪",
                sizes: ["Half Dozen", "Dozen"],
                sizePrice: { "Half Dozen": 12, "Dozen": 20 },
                flavors: ["Peanut Butter", "Chocolate", "Chocolate Chip", "Oatmeal", "Snickerdoodle"],
                flavorNotes: {
                    "Oatmeal": { glutenFree: true, sugarFree: false }
                }
            },
            {
                name: "Cookies~Fancy",
                emoji: "🍪",
                sizes: ["Half Dozen", "Dozen"],
                sizePrice: { "Half Dozen": 20, "Dozen": 32 },
                flavors: ["Biscoff", "Chocolate", "Oreo", "Twix", "Red Velvet", "Chocolate Chip", "Espresso", "Cinnamon Roll", "Pumpkin", "Holiday Specials"],
                flavorNotes: {}
            },
            {
                name: "Cookies~Complex",
                emoji: "🍪",
                sizes: ["Half Dozen", "Dozen"],
                sizePrice: { "Half Dozen": 25, "Dozen": 45 },
                flavors: ["S'more", "Monster", "Peanut Butter Cup Stuffed", "Caramel Apple Pie"],
                flavorNotes: {}
            },
            {
                name: "Dipped Pretzel Rods",
                emoji: "🥨",
                sizes: ["Half Dozen", "Dozen"],
                sizePrice: { "Half Dozen": 10, "Dozen": 18 },
                flavors: ["Chocolate", "Vanilla", "Candy"],
                flavorNotes: {}
            },
            {
                name: "Brownies - Large",
                emoji: "🍫",
                sizes: ["4-Pack"],
                basePrice: 18,
                flavors: ["Standard"],
                flavorNotes: {
                    "Standard": { glutenFree: true, sugarFree: false }
                }
            },
            {
                name: "Pecan English Toffee",
                emoji: "🎁",
                sizes: ["1 Pound (Regular Box)", "1 Pound (Mason Jar - Gift)"],
                sizePrice: { "1 Pound (Regular Box)": 30, "1 Pound (Mason Jar - Gift)": 35 },
                flavors: ["Standard"],
                flavorNotes: {},
                canShip: true
            }
        ];

        let cart = [];

        // ========== PAYMENT DETAILS ==========
        const paymentInfo = {
            "Cash": "Pay 50% deposit now to secure your appointment. Bring remaining 50% at pickup.",
            "Cash App": "Send 50% deposit to: <a href='https://cash.app/$DanaBlueMoonHaven'>$DanaBlueMoonHaven</a> to secure your appointment.",
            "Venmo": "Send 50% deposit to: <a href='https://venmo.com/BlueMoonHaven'>@BlueMoonHaven</a> to secure your appointment.",
            "PayPal": "Send 50% deposit to: <a href='https://paypal.me/BlueMoonHaven'>@BlueMoonHaven</a> to secure your appointment.",
            "Zelle": "Use Zelle to send 50% deposit to: <strong>805-709-4686</strong> to secure your appointment."
        };

        function updatePaymentDetails() {
            const selectedMethod = document.querySelector('input[name="payment_method"]:checked').value;
            const detailsDiv = document.getElementById('paymentDetails');
            const contentDiv = document.getElementById('paymentDetailsContent');
            
            if (selectedMethod && paymentInfo[selectedMethod]) {
                contentDiv.innerHTML = paymentInfo[selectedMethod];
                detailsDiv.style.display = 'block';
            } else {
                detailsDiv.style.display = 'none';
            }
        }

        // ========== INITIALIZE PRODUCT GRID ==========
        function initializeProducts() {
            const grid = document.getElementById('productsGrid');
            grid.innerHTML = '';

            menuItems.forEach((item, index) => {
                let defaultPrice = item.basePrice || item.sizePrice[item.sizes[0]];
                
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <div class="product-header">
                        <div class="product-name">${item.emoji} ${item.name}</div>
                        <div class="product-price">from $${defaultPrice.toFixed(2)}</div>
                    </div>
                    <div class="product-form">
                        <div class="form-group">
                            <label>Size</label>
                            <select id="size-${index}" class="product-select">
                                ${item.sizes.map(size => `<option value="${size}">${size}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Flavor</label>
                            <select id="flavor-${index}" class="product-select" onchange="updateDietaryOptions(${index})">
                                ${item.flavors.map(flavor => `<option value="${flavor}">${flavor}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Quantity</label>
                            <input type="number" id="qty-${index}" min="1" value="1">
                        </div>
                    </div>
                    <div class="dietary-section" id="dietary-${index}">
                        <div class="dietary-checkboxes">
                            <div class="dietary-option" id="gluten-option-${index}">
                                <input type="checkbox" id="gluten-${index}" class="gluten-checkbox">
                                <label for="gluten-${index}">Gluten Free</label>
                            </div>
                            <div class="dietary-option" id="sugar-option-${index}">
                                <input type="checkbox" id="sugar-${index}" class="sugar-checkbox">
                                <label for="sugar-${index}">Sugar Free</label>
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn btn-add-item" onclick="addToCart(${index})">Add to Order</button>
                `;
                grid.appendChild(card);
            });

            for (let i = 0; i < menuItems.length; i++) {
                updateDietaryOptions(i);
            }
        }

        function updateDietaryOptions(index) {
            const item = menuItems[index];
            const flavorSelect = document.getElementById(`flavor-${index}`);
            const selectedFlavor = flavorSelect.value;
            const dietarySection = document.getElementById(`dietary-${index}`);
            const glutenOption = document.getElementById(`gluten-option-${index}`);
            const sugarOption = document.getElementById(`sugar-option-${index}`);
            
            const flavorNotes = item.flavorNotes[selectedFlavor] || {};
            
            document.getElementById(`gluten-${index}`).checked = false;
            document.getElementById(`sugar-${index}`).checked = false;
            
            if (flavorNotes.glutenFree) {
                glutenOption.classList.remove('hidden');
            } else {
                glutenOption.classList.add('hidden');
            }
            
            if (flavorNotes.sugarFree) {
                sugarOption.classList.remove('hidden');
            } else {
                sugarOption.classList.add('hidden');
            }
            
            if (flavorNotes.glutenFree || flavorNotes.sugarFree) {
                dietarySection.classList.remove('hidden');
            } else {
                dietarySection.classList.add('hidden');
            }
        }

        // ========== ADD TO CART ==========
        function addToCart(index) {
            const item = menuItems[index];
            const size = document.getElementById(`size-${index}`).value;
            const flavor = document.getElementById(`flavor-${index}`).value;
            const qty = parseInt(document.getElementById(`qty-${index}`).value) || 1;

            if (qty < 1) {
                showError('Please enter a quantity of at least 1');
                return;
            }

            const glutenFree = document.getElementById(`gluten-${index}`)?.checked || false;
            const sugarFree = document.getElementById(`sugar-${index}`)?.checked || false;

            let price = item.basePrice || item.sizePrice[size];
            let flavorUpcharge = item.flavorPrices?.[flavor] || 0;
            let totalPrice = (price + flavorUpcharge) * qty;

            let specs = `${size}`;
            if (flavor !== 'Standard') specs += ` - ${flavor}`;
            if (glutenFree) specs += ' [GF]';
            if (sugarFree) specs += ' [SF]';

            const cartItem = {
                id: Date.now(),
                itemName: item.name,
                emoji: item.emoji,
                specs: specs,
                qty: qty,
                price: totalPrice,
                canShip: item.canShip || false
            };

            cart.push(cartItem);
            updateCart();
            showSuccess(`Added ${qty}x ${item.name} to order!`);
            
            document.getElementById(`qty-${index}`).value = 1;
        }

        // ========== REMOVE FROM CART ==========
        function removeFromCart(cartItemId) {
            cart = cart.filter(item => item.id !== cartItemId);
            updateCart();
        }

        // ========== UPDATE CART DISPLAY ==========
        function updateCart() {
            const orderItemsDiv = document.getElementById('orderItems');
            
            if (cart.length === 0) {
                orderItemsDiv.innerHTML = '<div class="empty-items">No items added yet</div>';
            } else {
                orderItemsDiv.innerHTML = cart.map(item => `
                    <div class="order-item">
                        <div class="order-item-details">
                            <div>
                                <div class="order-item-name">${item.emoji} ${item.itemName}</div>
                                <div class="order-item-specs">${item.qty}x - ${item.specs}</div>
                            </div>
                            <div class="order-item-price">$${item.price.toFixed(2)}</div>
                        </div>
                        <div class="order-item-actions">
                            <button type="button" class="btn btn-remove btn-small" onclick="removeFromCart(${item.id})">Remove</button>
                        </div>
                    </div>
                `).join('');
            }

            checkShippingAvailability();
            calculateTotals();
        }

        // ========== CHECK SHIPPING AVAILABILITY ==========
        function checkShippingAvailability() {
            const hasToffee = cart.some(item => item.canShip);
            const shippingRadio = document.getElementById('fulfillmentShip');
            const shippingOption = document.getElementById('shippingOption');
            const fulfillmentNote = document.getElementById('fulfillmentNote');

            if (hasToffee) {
                shippingRadio.disabled = false;
                shippingOption.classList.remove('fulfillment-option-disabled');
                fulfillmentNote.style.display = 'none';
            } else {
                shippingRadio.disabled = true;
                shippingOption.classList.add('fulfillment-option-disabled');
                fulfillmentNote.style.display = 'block';
                
                if (shippingRadio.checked) {
                    document.getElementById('fulfillmentPickup').checked = true;
                    handleFulfillmentChange();
                }
            }
        }

        // ========== FULFILLMENT METHODS ==========
        function handleFulfillmentChange() {
            const fulfillment = document.querySelector('input[name="fulfillment_method"]:checked').value;
            const pickupSection = document.getElementById('pickupSection');
            const shippingSection = document.getElementById('shippingSection');
            const pickupDateInput = document.getElementById('pickupDate');
            const pickupTimeInput = document.getElementById('pickupTime');
            const shippingInputs = document.querySelectorAll('#shippingSection input');
            const depositInfo = document.getElementById('depositPickupInfo');

            if (fulfillment === 'Pickup') {
                pickupSection.classList.add('visible');
                pickupSection.classList.remove('hidden-section');
                shippingSection.classList.remove('visible');
                shippingSection.classList.add('hidden-section');
                
                pickupDateInput.required = true;
                pickupTimeInput.required = true;
                shippingInputs.forEach(input => input.required = false);
                
                document.getElementById('summaryShippingRow').style.display = 'none';
                depositInfo.style.display = 'block';
            } else {
                pickupSection.classList.remove('visible');
                pickupSection.classList.add('hidden-section');
                shippingSection.classList.add('visible');
                shippingSection.classList.remove('hidden-section');
                
                pickupDateInput.required = false;
                pickupTimeInput.required = false;
                shippingInputs.forEach(input => input.required = true);
                
                document.getElementById('summaryShippingRow').style.display = 'flex';
                depositInfo.style.display = 'none';
            }
            calculateTotals();
        }

        // ========== SHIPPING CALCULATION ==========
        function calculateShipping() {
            const zipCode = document.getElementById('shippingZip').value;
            let shippingCost = 0;

            if (zipCode) {
                const zip = parseInt(zipCode);
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

            document.getElementById('shippingCost').textContent = `$${shippingCost.toFixed(2)}`;
            calculateTotals();
        }

        // ========== CALCULATE TOTALS ==========
        function calculateTotals() {
            let subtotal = cart.reduce((sum, item) => sum + item.price, 0);

            let shippingCost = 0;
            const fulfillment = document.querySelector('input[name="fulfillment_method"]:checked').value;
            if (fulfillment === 'Shipping') {
                const shippingCostText = document.getElementById('shippingCost').textContent;
                shippingCost = parseFloat(shippingCostText.replace('$', '')) || 0;
            }

            const total = subtotal + shippingCost;
            const deposit = total * 0.5; // 50% deposit
            const balance = total - deposit;

            document.getElementById('summarySubtotal').textContent = `$${subtotal.toFixed(2)}`;
            document.getElementById('summaryShipping').textContent = `$${shippingCost.toFixed(2)}`;
            document.getElementById('summaryTotal').textContent = `$${total.toFixed(2)}`;
            document.getElementById('summaryDeposit').textContent = `$${deposit.toFixed(2)}`;
            document.getElementById('summaryBalance').textContent = `$${balance.toFixed(2)}`;

            // Update deposit display
            document.getElementById('depositDisplayAmount').textContent = `$${deposit.toFixed(2)}`;
            document.getElementById('balanceDisplayAmount').textContent = `$${balance.toFixed(2)}`;

            const orderDetails = cart.map(item => 
                `${item.qty}x ${item.itemName} - ${item.specs}: $${item.price.toFixed(2)}`
            ).join('\n');
            document.getElementById('orderSummary').value = orderDetails + `\n\nTotal: $${total.toFixed(2)}\n50% Deposit Due: $${deposit.toFixed(2)}\nBalance Due at Pickup: $${balance.toFixed(2)}`;
        }

        // ========== FORM SUBMISSION ==========
        document.getElementById('orderForm').addEventListener('submit', function(e) {
            if (cart.length === 0) {
                e.preventDefault();
                showError('Please add at least one item to your order.');
                return;
            }

            const name = document.getElementById('customerName').value.trim();
            const phone = document.getElementById('customerPhone').value.trim();
            if (!name || !phone) {
                e.preventDefault();
                showError('Please fill in your name and phone number.');
                return;
            }

            const paymentMethod = document.querySelector('input[name="payment_method"]:checked');
            if (!paymentMethod) {
                e.preventDefault();
                showError('Please select a payment method.');
                return;
            }

            const fulfillment = document.querySelector('input[name="fulfillment_method"]:checked').value;
            if (fulfillment === 'Pickup') {
                const pickupDate = document.getElementById('pickupDate').value;
                const pickupTime = document.getElementById('pickupTime').value;
                if (!pickupDate || !pickupTime) {
                    e.preventDefault();
                    showError('Please select a pickup date and time.');
                    return;
                }
            }

            calculateTotals();
        });

        // ========== RESET FORM ==========
        function resetFormComplete() {
            document.getElementById('orderForm').reset();
            cart = [];
            updateCart();
            document.getElementById('pickupDate').value = '';
            document.getElementById('pickupTime').value = '';
            
            document.getElementById('fulfillmentPickup').checked = true;
            handleFulfillmentChange();
            document.getElementById('paymentDetails').style.display = 'none';
        }

        // ========== ALERTS ==========
        function showError(message) {
            const alert = document.getElementById('errorAlert');
            alert.textContent = '❌ ' + message;
            alert.classList.add('visible');
            setTimeout(() => alert.classList.remove('visible'), 5000);
        }

        function showSuccess(message) {
            const alert = document.getElementById('successAlert');
            alert.textContent = '✅ ' + message;
            alert.classList.add('visible');
            setTimeout(() => alert.classList.remove('visible'), 3000);
        }

        // ========== INITIALIZE ==========
        document.addEventListener('DOMContentLoaded', function() {
            initializeProducts();
            checkShippingAvailability();
            calculateTotals();
            
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('pickupDate').min = today;
        });
    </script>
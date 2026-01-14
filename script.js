// Order data structure
let order = [];
let packingChargeEnabled = false;
let paymentMethod = null;
let amountReceived = 0;
let currentBillNumber = null;
let customerName = '';
let customerPhone = '';

// Menu data structure (for editing)
let menuData = [];

// EOD Data structure
let eodData = {
    totalSales: 0,
    billCount: 0,
    cashAmountReceived: 0,
    upiAmountReceived: 0,
    bills: [],
    lastResetDate: new Date().toDateString()
};

// Initialize menu data from HTML
function initializeMenuData() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        const name = item.querySelector('.item-name').textContent;
        const priceText = item.querySelector('.item-price').textContent;
        const price = parseInt(priceText.replace('₹', ''));
        const button = item.querySelector('.add-btn');
        const onclick = button.getAttribute('onclick');
        
        menuData.push({
            name: name,
            price: price,
            originalName: name,
            originalPrice: price,
            onclick: onclick
        });
    });
}

// Load EOD data from localStorage
function loadEODData() {
    const saved = localStorage.getItem('eodData');
    const today = new Date().toDateString();
    
    if (saved) {
        const parsed = JSON.parse(saved);
        // Reset if it's a new day
        if (parsed.lastResetDate !== today) {
            eodData = {
                totalSales: 0,
                billCount: 0,
                cashAmountReceived: 0,
                upiAmountReceived: 0,
                bills: [],
                lastResetDate: today
            };
            saveEODData();
        } else {
            eodData = parsed;
            // Ensure new fields exist for old data
            if (!eodData.cashAmountReceived) eodData.cashAmountReceived = 0;
            if (!eodData.upiAmountReceived) eodData.upiAmountReceived = 0;
        }
    } else {
        eodData.lastResetDate = today;
        saveEODData();
    }
}

// Save EOD data to localStorage
function saveEODData() {
    localStorage.setItem('eodData', JSON.stringify(eodData));
}

// Add item to order
function addItem(name, price) {
    const existingItem = order.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.quantity += 1;
        existingItem.total = existingItem.quantity * existingItem.price;
    } else {
        order.push({
            name: name,
            price: price,
            quantity: 1,
            total: price
        });
    }
    
    updateOrderDisplay();
    calculateTotal();
}

// Remove item from order
// function removeItem(index) {
//     order.splice(index, 1);
//     updateOrderDisplay();
//     calculateTotal();
// }

// Update quantity
function updateQuantity(index, change) {
    order[index].quantity += change;
    
    // if (order[index].quantity <= 0) {
    //     removeItem(index);
    //     return;
    // }
    
    order[index].total = order[index].quantity * order[index].price;
    updateOrderDisplay();
    calculateTotal();
}


// Calculate total
function calculateTotal() {
    packingChargeEnabled = document.getElementById('packingCharge').checked;
    
    const subtotal = order.reduce((sum, item) => sum + item.total, 0);
    const itemCount = order.reduce((sum, item) => sum + item.quantity, 0);
    const packingTotal = packingChargeEnabled ? itemCount * 5 : 0;
    const total = subtotal + packingTotal;
    
    document.getElementById('subtotal').textContent = `₹${subtotal}`;
    document.getElementById('packingTotal').textContent = `₹${packingTotal}`;
    document.getElementById('total').textContent = `₹${total}`;
}

// Clear order
function clearOrder() {
    if (order.length === 0) {
        return;
    }
    
    if (confirm('Are you sure you want to clear the entire order?')) {
        order = [];
        customerName = '';
        customerPhone = '';
        document.getElementById('packingCharge').checked = false;
        document.getElementById('customerName').value = '';
        document.getElementById('customerPhone').value = '';
        document.getElementById('paymentSection').style.display = 'none';
        document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => radio.checked = false);
        document.getElementById('cashPayment').style.display = 'none';
        document.getElementById('changeDisplay').style.display = 'none';
        document.getElementById('processPaymentBtn').style.display = 'none';
        document.getElementById('amountReceived').value = '';
        updateOrderDisplay();
        calculateTotal();
    }
}

// Handle payment method change
function handlePaymentMethodChange() {
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
    if (selectedMethod) {
        paymentMethod = selectedMethod.value;
        const cashPaymentDiv = document.getElementById('cashPayment');
        const processPaymentBtn = document.getElementById('processPaymentBtn');
        
        if (paymentMethod === 'cash') {
            cashPaymentDiv.style.display = 'block';
            processPaymentBtn.style.display = 'inline-block';
        } else {
            cashPaymentDiv.style.display = 'none';
            processPaymentBtn.style.display = 'inline-block';
        }
    }
}

// Calculate change for cash payment
function calculateChange() {
    const amount = parseFloat(document.getElementById('amountReceived').value) || 0;
    amountReceived = amount;
    
    const subtotal = order.reduce((sum, item) => sum + item.total, 0);
    const itemCount = order.reduce((sum, item) => sum + item.quantity, 0);
    const packingTotal = packingChargeEnabled ? itemCount * 5 : 0;
    const total = subtotal + packingTotal;
    
    const change = amount - total;
    const changeDisplay = document.getElementById('changeDisplay');
    const changeAmount = document.getElementById('changeAmount');
    
    if (amount > 0 && change >= 0) {
        changeDisplay.style.display = 'flex';
        changeAmount.textContent = `₹${change.toFixed(2)}`;
        changeAmount.style.color = change >= 0 ? '#155724' : '#dc3545';
    } else if (amount > 0 && change < 0) {
        changeDisplay.style.display = 'flex';
        changeAmount.textContent = `₹${Math.abs(change).toFixed(2)} (Insufficient)`;
        changeAmount.style.color = '#dc3545';
    } else {
        changeDisplay.style.display = 'none';
    }
}

// Process payment
function processPayment() {
    if (order.length === 0) {
        alert('Please add items to the order before processing payment.');
        return;
    }
    
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
    if (!selectedMethod) {
        alert('Please select a payment method.');
        return;
    }
    
    if (selectedMethod.value === 'cash') {
        const amount = parseFloat(document.getElementById('amountReceived').value) || 0;
        const subtotal = order.reduce((sum, item) => sum + item.total, 0);
        const itemCount = order.reduce((sum, item) => sum + item.quantity, 0);
        const packingTotal = packingChargeEnabled ? itemCount * 5 : 0;
        const total = subtotal + packingTotal;
        
        if (amount < total) {
            alert(`Insufficient amount. Total is ₹${total}, received ₹${amount}.`);
            return;
        }
        
        if (amount === 0) {
            alert('Please enter the amount received.');
            return;
        }
    }
    
    // Generate bill number
    currentBillNumber = generateBillNumber();
    
    // Save bill to EOD
    saveBillToEOD();
    
    // Generate and print bill
    const billContent = generateBillContent();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(billContent);
    printWindow.document.close();
    printWindow.onload = function() {
        printWindow.print();
    };
    
    // Reset order
    resetOrderAfterPayment();
}

// Save bill to EOD
function saveBillToEOD() {
    const subtotal = order.reduce((sum, item) => sum + item.total, 0);
    const itemCount = order.reduce((sum, item) => sum + item.quantity, 0);
    const packingTotal = packingChargeEnabled ? itemCount * 5 : 0;
    const total = subtotal + packingTotal;
    
    // Generate bill number if not already generated
    if (!currentBillNumber) {
        currentBillNumber = generateBillNumber();
    }
    
    const billAmountReceived = paymentMethod === 'cash' ? amountReceived : (paymentMethod === 'upi' ? total : 0);
    
    // Get customer information
    customerName = document.getElementById('customerName').value.trim() || '';
    customerPhone = document.getElementById('customerPhone').value.trim() || '';
    
    const bill = {
        billNumber: currentBillNumber,
        date: new Date().toISOString(),
        customerName: customerName,
        customerPhone: customerPhone,
        items: JSON.parse(JSON.stringify(order)),
        subtotal: subtotal,
        packingCharge: packingTotal,
        total: total,
        paymentMethod: paymentMethod || 'pending',
        amountReceived: billAmountReceived,
        change: paymentMethod === 'cash' ? (amountReceived - total) : 0
    };
    
    eodData.bills.push(bill);
    eodData.totalSales += total;
    eodData.billCount += 1;
    
    // Track cash and UPI amounts separately
    if (paymentMethod === 'cash' && amountReceived > 0) {
        eodData.cashAmountReceived = (eodData.cashAmountReceived || 0) + amountReceived;
    } else if (paymentMethod === 'upi' && total > 0) {
        eodData.upiAmountReceived = (eodData.upiAmountReceived || 0) + total;
    }
    
    saveEODData();
}

// Save bill without processing payment
function saveBillOnly() {
    if (order.length === 0) {
        alert('Please add items to the order before saving the bill.');
        return;
    }
    
    // Check if payment method is selected
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
    if (!selectedMethod) {
        if (!confirm('No payment method selected. Save bill as pending? You can update payment method later.')) {
            return;
        }
    } else {
        paymentMethod = selectedMethod.value;
        if (paymentMethod === 'cash') {
            const amount = parseFloat(document.getElementById('amountReceived').value) || 0;
            if (amount > 0) {
                amountReceived = amount;
            } else {
                if (!confirm('No cash amount entered. Save bill as pending? You can update payment later.')) {
                    return;
                }
            }
        }
    }
    
    // Generate bill number if not already generated
    if (!currentBillNumber) {
        currentBillNumber = generateBillNumber();
    }
    
    // Save bill to EOD
    saveBillToEOD();
    
    alert(`Bill #${currentBillNumber} saved successfully!`);
    
    // Reset order after saving
    resetOrderAfterPayment();
}

// Reset order after payment
function resetOrderAfterPayment() {
    order = [];
    paymentMethod = null;
    amountReceived = 0;
    currentBillNumber = null;
    customerName = '';
    customerPhone = '';
    document.getElementById('packingCharge').checked = false;
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => radio.checked = false);
    document.getElementById('paymentSection').style.display = 'none';
    document.getElementById('cashPayment').style.display = 'none';
    document.getElementById('changeDisplay').style.display = 'none';
    document.getElementById('processPaymentBtn').style.display = 'none';
    document.getElementById('amountReceived').value = '';
    updateOrderDisplay();
    calculateTotal();
    
    // Auto-save data to CSV/localStorage
    autoSaveData();
}

// Print bill
function printBill() {
    if (order.length === 0) {
        alert('Please add items to the order before printing the bill.');
        return;
    }
    
    // Generate bill number if not already generated
    if (!currentBillNumber) {
        currentBillNumber = generateBillNumber();
    }
    
    // Create printable bill content
    const billContent = generateBillContent();
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(billContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = function() {
        printWindow.print();
    };
}

// Generate bill content
function generateBillContent() {
    const date = new Date();
    const dateStr = date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    const timeStr = date.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const subtotal = order.reduce((sum, item) => sum + item.total, 0);
    const itemCount = order.reduce((sum, item) => sum + item.quantity, 0);
    const packingTotal = packingChargeEnabled ? itemCount * 5 : 0;
    const total = subtotal + packingTotal;
    
    const billNo = currentBillNumber || generateBillNumber();
    
    let itemsHtml = order.map(item => `
        <tr>
            <td style="text-align: left; padding: 8px;">${item.name}</td>
            <td style="text-align: center; padding: 8px;">${item.quantity}</td>
            <td style="text-align: right; padding: 8px;">₹${item.price}</td>
            <td style="text-align: right; padding: 8px;">₹${item.total}</td>
        </tr>
    `).join('');
    
    let paymentHtml = '';
    if (paymentMethod === 'cash' && amountReceived > 0) {
        const change = amountReceived - total;
        paymentHtml = `
            <div class="summary-row">
                <span>Payment Method:</span>
                <span>Cash</span>
            </div>
            <div class="summary-row">
                <span>Amount Received:</span>
                <span>₹${amountReceived}</span>
            </div>
            ${change > 0 ? `
            <div class="summary-row">
                <span>Change:</span>
                <span>₹${change.toFixed(2)}</span>
            </div>
            ` : ''}
        `;
    } else if (paymentMethod === 'upi') {
        paymentHtml = `
            <div class="summary-row">
                <span>Payment Method:</span>
                <span>UPI</span>
            </div>
        `;
    }
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>ChaatGPT - Bill</title>
            <style>
                @media print {
                    @page {
                        margin: 20mm;
                    }
                }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background: white;
                }
                .bill-header {
                    text-align: center;
                    border-bottom: 3px solid #f5576c;
                    padding-bottom: 20px;
                    margin-bottom: 20px;
                }
                .bill-header h1 {
                    color: #f5576c;
                    margin: 0;
                    font-size: 2.5em;
                }
                .bill-header p {
                    color: #666;
                    margin: 5px 0;
                }
                .bill-info {
                    margin-bottom: 20px;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                .bill-info p {
                    margin: 5px 0;
                    color: #333;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                th {
                    background: #f5576c;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-weight: bold;
                }
                th:nth-child(2), th:nth-child(3), th:nth-child(4) {
                    text-align: center;
                }
                th:nth-child(4) {
                    text-align: right;
                }
                td {
                    border-bottom: 1px solid #e0e0e0;
                    padding: 10px;
                }
                .bill-summary {
                    margin-top: 20px;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    font-size: 1.1em;
                }
                .summary-row.total {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: #f5576c;
                    border-top: 2px solid #f5576c;
                    margin-top: 10px;
                    padding-top: 15px;
                }
                .bill-footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 2px dashed #ccc;
                    color: #666;
                }
                .thank-you {
                    font-size: 1.2em;
                    color: #f5576c;
                    font-weight: bold;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="bill-header">
                <h1>ChaatGPT</h1>
                <p>Guaranteed Perfect Taste</p>
                <p>Near Central Bus Stand, Trichy</p>
                <p>Phone: 8903145004 | Email: chaatgpt314@gmail.com</p>
            </div>
            
            <div class="bill-info">
                <p><strong>Date:</strong> ${dateStr}</p>
                <p><strong>Time:</strong> ${timeStr}</p>
                <p><strong>Bill No:</strong> ${billNo}</p>
                ${customerName ? `<p><strong>Customer:</strong> ${customerName}</p>` : ''}
                ${customerPhone ? `<p><strong>Phone:</strong> ${customerPhone}</p>` : ''}
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            
            <div class="bill-summary">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>₹${subtotal}</span>
                </div>
                ${packingTotal > 0 ? `
                <div class="summary-row">
                    <span>Packing Charge (${itemCount} items × ₹5):</span>
                    <span>₹${packingTotal}</span>
                </div>
                ` : ''}
                <div class="summary-row total">
                    <span>Total Amount:</span>
                    <span>₹${total}</span>
                </div>
                ${paymentHtml}
            </div>
            
            <div class="bill-footer">
                <p class="thank-you">Thank You for Your Visit!</p>
                <p>Visit Again Soon</p>
            </div>
        </body>
        </html>
    `;
}

// Generate bill number
function generateBillNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `BG-${year}${month}${day}-${hours}${minutes}${seconds}`;
}

// Menu Edit Functions
function openMenuEdit() {
    document.getElementById('menuEditModal').style.display = 'block';
    renderMenuEdit();
}

function closeMenuEdit() {
    document.getElementById('menuEditModal').style.display = 'none';
}

function renderMenuEdit() {
    const container = document.getElementById('menuEditItems');
    container.innerHTML = menuData.map((item, index) => `
        <div class="menu-edit-item">
            <input type="text" value="${item.name}" data-index="${index}" data-field="name" onchange="updateMenuData(${index}, 'name', this.value)">
            <input type="number" value="${item.price}" data-index="${index}" data-field="price" onchange="updateMenuData(${index}, 'price', this.value)" min="0" step="1">
            <button class="delete-btn" onclick="deleteMenuItem(${index})">Delete</button>
        </div>
    `).join('');
}

function updateMenuData(index, field, value) {
    if (field === 'name') {
        menuData[index].name = value;
    } else if (field === 'price') {
        menuData[index].price = parseInt(value) || 0;
    }
    updateMenuInHTML(index);
}

function updateMenuInHTML(index) {
    const menuItem = menuData[index];
    const menuItems = document.querySelectorAll('.menu-item');
    
    // Find the matching menu item in HTML
    menuItems.forEach(item => {
        const nameSpan = item.querySelector('.item-name');
        const priceSpan = item.querySelector('.item-price');
        const button = item.querySelector('.add-btn');
        
        if (nameSpan.textContent === menuItem.originalName) {
            nameSpan.textContent = menuItem.name;
            priceSpan.textContent = `₹${menuItem.price}`;
            button.setAttribute('onclick', `addItem('${menuItem.name}', ${menuItem.price})`);
        }
    });
}

function deleteMenuItem(index) {
    if (confirm('Are you sure you want to delete this menu item?')) {
        const menuItem = menuData[index];
        menuData.splice(index, 1);
        
        // Remove from HTML
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            const nameSpan = item.querySelector('.item-name');
            // if (nameSpan.textContent === menuItem.name) {
            //     item.remove();
            // }
        });
        
        renderMenuEdit();
    }
}

function saveMenuChanges() {
    // Menu data is already updated in real-time
    // Just save to localStorage for persistence
    localStorage.setItem('menuData', JSON.stringify(menuData));
    alert('Menu changes saved successfully!');
    closeMenuEdit();
}

// EOD Report Functions
function openEODReport() {
    document.getElementById('eodModal').style.display = 'block';
    switchTab('eod');
}

function switchTab(tab) {
    const eodContent = document.getElementById('eodReportContent');
    const productContent = document.getElementById('productReportContent');
    const printBtn = document.getElementById('printReportBtn');
    const exportBtn = document.getElementById('exportProductBtn');
    const tabs = document.querySelectorAll('.tab-btn');
    
    // tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'eod') {
        eodContent.style.display = 'block';
        productContent.style.display = 'none';
        printBtn.textContent = 'Print Report';
        exportBtn.style.display = 'none';
        tabs[0].classList.add('active');
        renderEODReport();
    } else if (tab === 'product') {
        eodContent.style.display = 'none';
        productContent.style.display = 'block';
        printBtn.textContent = 'Print Product Report';
        exportBtn.style.display = 'inline-block';
        tabs[1].classList.add('active');
        renderProductReport();
    }
}

function closeEODReport() {
    document.getElementById('eodModal').style.display = 'none';
}

function renderEODReport() {
    const container = document.getElementById('eodReportContent');
    
    const today = new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    let billsHtml = '';
    if (eodData.bills.length === 0) {
        billsHtml = '<p style="text-align: center; color: #999; padding: 40px;">No bills generated today</p>';
    } else {
        billsHtml = eodData.bills.map(bill => {
            const billDate = new Date(bill.date);
            const timeStr = billDate.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const itemCount = bill.items.reduce((sum, item) => sum + item.quantity, 0);
            
            // Create items list
            const itemsList = bill.items.map(item => 
                `${item.name} (${item.quantity}x ₹${item.price})`
            ).join(', ');
            
            return `
                <div class="eod-bill-item">
                    <div class="eod-bill-header">
                        <span>Bill #${bill.billNumber}</span>
                        <span>₹${bill.total}</span>
                    </div>
                    <div class="eod-bill-details">
                        <div class="bill-overview-row">
                            <span><strong>Time:</strong> ${timeStr}</span>
                            <span><strong>Total Items:</strong> ${itemCount}</span>
                        </div>
                        ${bill.customerName ? `<div><strong>Customer:</strong> ${bill.customerName}${bill.customerPhone ? ` (${bill.customerPhone})` : ''}</div>` : ''}
                        <div class="bill-items-list">
                            <strong>Items:</strong>
                            <div class="items-container">${itemsList}</div>
                        </div>
                        <div class="bill-overview-row">
                            <span><strong>Payment:</strong> ${bill.paymentMethod.toUpperCase()}</span>
                            ${bill.paymentMethod === 'cash' ? `<span><strong>Received:</strong> ₹${bill.amountReceived} | <strong>Change:</strong> ₹${bill.change.toFixed(2)}</span>` : ''}
                            ${bill.paymentMethod === 'upi' ? `<span><strong>Amount:</strong> ₹${bill.amountReceived}</span>` : ''}
                        </div>
                        <div class="bill-overview-row">
                            <span><strong>Subtotal:</strong> ₹${bill.subtotal}</span>
                            ${bill.packingCharge > 0 ? `<span><strong>Packing:</strong> ₹${bill.packingCharge}</span>` : ''}
                            <span><strong>Total:</strong> ₹${bill.total}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    container.innerHTML = `
        <div class="eod-report">
            <h3 style="margin-bottom: 20px; color: #333;">Report for ${today}</h3>
            <div class="eod-summary">
                <div class="eod-stat">
                    <div class="eod-stat-label">Total Bills</div>
                    <div class="eod-stat-value">${eodData.billCount}</div>
                </div>
                <div class="eod-stat">
                    <div class="eod-stat-label">Total Sales</div>
                    <div class="eod-stat-value">₹${eodData.totalSales.toFixed(2)}</div>
                </div>
                <div class="eod-stat">
                    <div class="eod-stat-label">Average Bill</div>
                    <div class="eod-stat-value">₹${eodData.billCount > 0 ? (eodData.totalSales / eodData.billCount).toFixed(2) : '0.00'}</div>
                </div>
            </div>
            <div class="eod-summary" style="margin-top: 20px;">
                <div class="eod-stat" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%);">
                    <div class="eod-stat-label">Cash Received</div>
                    <div class="eod-stat-value">₹${(eodData.cashAmountReceived || 0).toFixed(2)}</div>
                </div>
                <div class="eod-stat" style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);">
                    <div class="eod-stat-label">UPI Received</div>
                    <div class="eod-stat-value">₹${(eodData.upiAmountReceived || 0).toFixed(2)}</div>
                </div>
                <div class="eod-stat" style="background: linear-gradient(135deg, #6c757d 0%, #495057 100%);">
                    <div class="eod-stat-label">Pending</div>
                    <div class="eod-stat-value">₹${((eodData.totalSales || 0) - (eodData.cashAmountReceived || 0) - (eodData.upiAmountReceived || 0)).toFixed(2)}</div>
                </div>
            </div>
            <h4 style="margin: 20px 0 10px 0; color: #333;">Bill Overview</h4>
            <div class="eod-bills-list">
                ${billsHtml}
            </div>
        </div>
    `;
}

function calculateProductSales(period = 'daily') {
    const productSales = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    eodData.bills.forEach(bill => {
        const billDate = new Date(bill.date);
        billDate.setHours(0, 0, 0, 0);
        
        let includeBill = false;
        
        if (period === 'daily') {
            // Only today's bills
            includeBill = billDate.getTime() === today.getTime();
        } else if (period === 'weekly') {
            // Last 7 days
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            includeBill = billDate >= weekAgo;
        }
        
        if (includeBill) {
            bill.items.forEach(item => {
                if (!productSales[item.name]) {
                    productSales[item.name] = {
                        name: item.name,
                        count: 0,
                        totalQuantity: 0,
                        totalRevenue: 0
                    };
                }
                productSales[item.name].count += 1; // Number of times ordered
                productSales[item.name].totalQuantity += item.quantity;
                productSales[item.name].totalRevenue += item.total;
            });
        }
    });
    
    // Convert to array and sort by total quantity
    return Object.values(productSales).sort((a, b) => b.totalQuantity - a.totalQuantity);
}

function renderProductReport() {
    const container = document.getElementById('productReportContent');
    
    const dailyProducts = calculateProductSales('daily');
    const weeklyProducts = calculateProductSales('weekly');
    
    const today = new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Get start of week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartStr = weekStart.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    let dailyHtml = '';
    if (dailyProducts.length === 0) {
        dailyHtml = '<p style="text-align: center; color: #999; padding: 20px;">No products sold today</p>';
    } else {
        dailyHtml = `
            <table class="product-table">
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th>Orders</th>
                        <th>Quantity Sold</th>
                        <th>Total Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    ${dailyProducts.map(product => `
                        <tr>
                            <td>${product.name}</td>
                            <td>${product.count}</td>
                            <td>${product.totalQuantity}</td>
                            <td>₹${product.totalRevenue.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    let weeklyHtml = '';
    if (weeklyProducts.length === 0) {
        weeklyHtml = '<p style="text-align: center; color: #999; padding: 20px;">No products sold in the last 7 days</p>';
    } else {
        weeklyHtml = `
            <table class="product-table">
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th>Orders</th>
                        <th>Quantity Sold</th>
                        <th>Total Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    ${weeklyProducts.map(product => `
                        <tr>
                            <td>${product.name}</td>
                            <td>${product.count}</td>
                            <td>${product.totalQuantity}</td>
                            <td>₹${product.totalRevenue.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    container.innerHTML = `
        <div class="product-report">
            <h3 style="margin-bottom: 20px; color: #333;">Product Sales Report</h3>
            
            <div class="product-report-section">
                <h4 style="color: #f5576c; margin-bottom: 15px;">Daily Report - ${today}</h4>
                <div class="product-summary">
                    <div class="product-stat">
                        <div class="product-stat-label">Total Products Sold</div>
                        <div class="product-stat-value">${dailyProducts.reduce((sum, p) => sum + p.totalQuantity, 0)}</div>
                    </div>
                    <div class="product-stat">
                        <div class="product-stat-label">Unique Products</div>
                        <div class="product-stat-value">${dailyProducts.length}</div>
                    </div>
                    <div class="product-stat">
                        <div class="product-stat-label">Total Orders</div>
                        <div class="product-stat-value">${dailyProducts.reduce((sum, p) => sum + p.count, 0)}</div>
                    </div>
                </div>
                ${dailyHtml}
            </div>
            
            <div class="product-report-section" style="margin-top: 30px;">
                <h4 style="color: #f5576c; margin-bottom: 15px;">Weekly Report - ${weekStartStr} to ${today}</h4>
                <div class="product-summary">
                    <div class="product-stat">
                        <div class="product-stat-label">Total Products Sold</div>
                        <div class="product-stat-value">${weeklyProducts.reduce((sum, p) => sum + p.totalQuantity, 0)}</div>
                    </div>
                    <div class="product-stat">
                        <div class="product-stat-label">Unique Products</div>
                        <div class="product-stat-value">${weeklyProducts.length}</div>
                    </div>
                    <div class="product-stat">
                        <div class="product-stat-label">Total Orders</div>
                        <div class="product-stat-value">${weeklyProducts.reduce((sum, p) => sum + p.count, 0)}</div>
                    </div>
                </div>
                ${weeklyHtml}
            </div>
        </div>
    `;
}

function printCurrentReport() {
    const eodContent = document.getElementById('eodReportContent');
    const productContent = document.getElementById('productReportContent');
    
    let reportContent = '';
    let title = '';
    
    if (eodContent.style.display !== 'none') {
        reportContent = eodContent.innerHTML;
        title = 'End of Day Report';
    } else {
        reportContent = productContent.innerHTML;
        title = 'Product Sales Report';
    }
    
    const today = new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title} - ${today}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    padding: 20px;
                }
                .eod-summary, .product-summary {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .eod-stat, .product-stat {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                }
                .eod-stat-label, .product-stat-label {
                    font-size: 0.9em;
                    opacity: 0.9;
                    margin-bottom: 10px;
                }
                .eod-stat-value, .product-stat-value {
                    font-size: 2em;
                    font-weight: bold;
                }
                .eod-bill-item {
                    padding: 15px;
                    background: #f8f9fa;
                    margin-bottom: 10px;
                    border-radius: 8px;
                    border-left: 4px solid #f5576c;
                }
                .product-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                }
                .product-table th {
                    background: #f5576c;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-weight: bold;
                }
                .product-table td {
                    padding: 10px;
                    border-bottom: 1px solid #e0e0e0;
                }
                .product-table tr:hover {
                    background: #f8f9fa;
                }
                @media print {
                    @page {
                        margin: 20mm;
                    }
                }
            </style>
        </head>
        <body>
            <h1 style="text-align: center; color: #f5576c;">ChaatGPT - ${title}</h1>
            <h2 style="text-align: center; color: #666;">${today}</h2>
            ${reportContent}
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = function() {
        printWindow.print();
    };
}

function exportProductReport() {
    const dailyProducts = calculateProductSales('daily');
    const weeklyProducts = calculateProductSales('weekly');
    
    const headers = ['Product Name', 'Period', 'Orders', 'Quantity Sold', 'Total Revenue'];
    
    const csvData = [];
    
    // Add daily data
    dailyProducts.forEach(product => {
        csvData.push({
            'Product Name': product.name,
            'Period': 'Daily',
            'Orders': product.count,
            'Quantity Sold': product.totalQuantity,
            'Total Revenue': product.totalRevenue.toFixed(2)
        });
    });
    
    // Add weekly data
    weeklyProducts.forEach(product => {
        csvData.push({
            'Product Name': product.name,
            'Period': 'Weekly',
            'Orders': product.count,
            'Quantity Sold': product.totalQuantity,
            'Total Revenue': product.totalRevenue.toFixed(2)
        });
    });
    
    if (csvData.length === 0) {
        alert('No product data to export.');
        return;
    }
    
    const csvContent = convertToCSV(csvData, headers);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `product_report_${dateStr}.csv`);
    
    saveCSVToLocalStorage('product_report', csvContent);
    alert('Product report exported to CSV successfully!');
}

function printEODReport() {
    const reportContent = document.getElementById('eodReportContent').innerHTML;
    const today = new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>EOD Report - ${today}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    padding: 20px;
                }
                .eod-summary {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .eod-stat {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                }
                .eod-stat-label {
                    font-size: 0.9em;
                    opacity: 0.9;
                    margin-bottom: 10px;
                }
                .eod-stat-value {
                    font-size: 2em;
                    font-weight: bold;
                }
                .eod-bill-item {
                    padding: 15px;
                    background: #f8f9fa;
                    margin-bottom: 10px;
                    border-radius: 8px;
                    border-left: 4px solid #f5576c;
                }
                @media print {
                    @page {
                        margin: 20mm;
                    }
                }
            </style>
        </head>
        <body>
            <h1 style="text-align: center; color: #f5576c;">ChaatGPT - End of Day Report</h1>
            <h2 style="text-align: center; color: #666;">${today}</h2>
            ${reportContent}
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = function() {
        printWindow.print();
    };
}

function resetEOD() {
    if (confirm('Are you sure you want to reset the End of Day data? This action cannot be undone.')) {
        eodData = {
            totalSales: 0,
            billCount: 0,
            cashAmountReceived: 0,
            upiAmountReceived: 0,
            bills: [],
            lastResetDate: new Date().toDateString()
        };
        saveEODData();
        renderEODReport();
        alert('EOD data has been reset.');
    }
}

function viewSavedCSV() {
    const csvExports = JSON.parse(localStorage.getItem('csvExports') || '[]');
    
    if (csvExports.length === 0) {
        alert('No saved CSV files found.');
        return;
    }
    
    // Create modal content for CSV list
    let csvListHtml = '<div class="csv-list"><h3>Saved CSV Exports</h3><div class="csv-items">';
    
    // Group by date
    const groupedByDate = {};
    csvExports.forEach((csv, index) => {
        const date = csv.date || new Date(csv.timestamp).toDateString();
        if (!groupedByDate[date]) {
            groupedByDate[date] = [];
        }
        groupedByDate[date].push({...csv, originalIndex: index});
    });
    
    Object.keys(groupedByDate).sort().reverse().forEach(date => {
        csvListHtml += `<div class="csv-date-group"><h4>${date}</h4>`;
        groupedByDate[date].forEach(csv => {
            const time = new Date(csv.timestamp).toLocaleTimeString('en-IN');
            csvListHtml += `
                <div class="csv-item">
                    <div class="csv-item-info">
                        <strong>${csv.type}</strong>
                        <span>${time}</span>
                    </div>
                    <button class="btn btn-small" onclick="downloadSavedCSV(${csv.originalIndex})">Download</button>
                </div>
            `;
        });
        csvListHtml += '</div>';
    });
    
    csvListHtml += '</div></div>';
    
    // Show in a new modal or alert
    const csvModal = document.createElement('div');
    csvModal.className = 'modal';
    csvModal.id = 'csvModal';
    csvModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Saved CSV Files</h2>
                <span class="close" onclick="closeCSVModal()">&times;</span>
            </div>
            <div class="modal-body">
                ${csvListHtml}
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeCSVModal()">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(csvModal);
    csvModal.style.display = 'block';
}

function closeCSVModal() {
    const modal = document.getElementById('csvModal');
    if (modal) {
        modal.style.display = 'none';
        // modal.remove();
    }
}

function downloadSavedCSV(index) {
    const csvExports = JSON.parse(localStorage.getItem('csvExports') || '[]');
    if (csvExports[index]) {
        const csv = csvExports[index];
        const timestamp = new Date(csv.timestamp).toISOString().split('T')[0];
        downloadCSV(csv.content, `${csv.type}_${timestamp}.csv`);
    }
}

// Show payment section when items are added
function updateOrderDisplay() {
    const orderItemsDiv = document.getElementById('orderItems');
    
    if (order.length === 0) {
        orderItemsDiv.innerHTML = '<p class="empty-cart">No items added yet</p>';
        document.getElementById('paymentSection').style.display = 'none';
        return;
    }
    
    // Show payment section when order has items
    document.getElementById('paymentSection').style.display = 'block';
    
    orderItemsDiv.innerHTML = order.map((item, index) => `
        <div class="order-item">
            <div class="order-item-info">
                <div class="order-item-name">${item.name}</div>
                <div class="order-item-details">₹${item.price} × ${item.quantity}</div>
            </div>
            <div class="order-item-price">₹${item.total}</div>
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
            </div>
            // <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
        </div>
    `).join('');
}

// Close modals when clicking outside
window.onclick = function(event) {
    const menuModal = document.getElementById('menuEditModal');
    const eodModal = document.getElementById('eodModal');
    const csvModal = document.getElementById('csvModal');
    
    if (event.target === menuModal) {
        closeMenuEdit();
    }
    if (event.target === eodModal) {
        closeEODReport();
    }
    if (event.target === csvModal) {
        closeCSVModal();
    }
}

// CSV Export Functions
function convertToCSV(data, headers) {
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header] || '';
            // Escape commas and quotes in values
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    // document.body.removeChild(link);
}

function exportBillsToCSV() {
    if (eodData.bills.length === 0) {
        alert('No bills to export.');
        return;
    }
    
    const headers = ['Bill Number', 'Date', 'Time', 'Customer Name', 'Customer Phone', 'Items', 'Subtotal', 'Packing Charge', 'Total', 'Payment Method', 'Amount Received', 'Change', 'Item Count'];
    
    const csvData = eodData.bills.map(bill => {
        const billDate = new Date(bill.date);
        const dateStr = billDate.toLocaleDateString('en-IN');
        const timeStr = billDate.toLocaleTimeString('en-IN');
        const itemCount = bill.items.reduce((sum, item) => sum + item.quantity, 0);
        
        // Create items list string
        const itemsList = bill.items.map(item => 
            `${item.name} (${item.quantity}x ₹${item.price})`
        ).join('; ');
        
        return {
            'Bill Number': bill.billNumber,
            'Date': dateStr,
            'Time': timeStr,
            'Customer Name': bill.customerName || '',
            'Customer Phone': bill.customerPhone || '',
            'Items': itemsList,
            'Subtotal': bill.subtotal,
            'Packing Charge': bill.packingCharge,
            'Total': bill.total,
            'Payment Method': bill.paymentMethod,
            'Amount Received': bill.amountReceived,
            'Change': bill.change,
            'Item Count': itemCount
        };
    });
    
    const csvContent = convertToCSV(csvData, headers);
    const today = new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `bills_${today}.csv`);
    
    // Also save to localStorage
    saveCSVToLocalStorage('bills', csvContent);
    alert('Bills exported to CSV successfully!');
}

function exportEODToCSV() {
    const today = new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const headers = ['Date', 'Total Bills', 'Total Sales', 'Cash Received', 'UPI Received', 'Pending Amount', 'Average Bill'];
    
    const pendingAmount = (eodData.totalSales || 0) - (eodData.cashAmountReceived || 0) - (eodData.upiAmountReceived || 0);
    const averageBill = eodData.billCount > 0 ? (eodData.totalSales / eodData.billCount) : 0;
    
    const csvData = [{
        'Date': today,
        'Total Bills': eodData.billCount,
        'Total Sales': eodData.totalSales.toFixed(2),
        'Cash Received': (eodData.cashAmountReceived || 0).toFixed(2),
        'UPI Received': (eodData.upiAmountReceived || 0).toFixed(2),
        'Pending Amount': pendingAmount.toFixed(2),
        'Average Bill': averageBill.toFixed(2)
    }];
    
    const csvContent = convertToCSV(csvData, headers);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `eod_report_${dateStr}.csv`);
    
    // Also save to localStorage
    saveCSVToLocalStorage('eod', csvContent);
    alert('EOD report exported to CSV successfully!');
}

function exportAllDataToCSV() {
    if (eodData.bills.length === 0) {
        alert('No data to export.');
        return;
    }
    
    // Export detailed bills with items
    const headers = ['Bill Number', 'Date', 'Time', 'Customer Name', 'Customer Phone', 'Item Name', 'Item Price', 'Quantity', 'Item Total', 'Subtotal', 'Packing Charge', 'Total', 'Payment Method', 'Amount Received', 'Change'];
    
    const csvData = [];
    eodData.bills.forEach(bill => {
        const billDate = new Date(bill.date);
        const dateStr = billDate.toLocaleDateString('en-IN');
        const timeStr = billDate.toLocaleTimeString('en-IN');
        
        if (bill.items.length === 0) {
            // Bill with no items
            csvData.push({
                'Bill Number': bill.billNumber,
                'Date': dateStr,
                'Time': timeStr,
                'Customer Name': bill.customerName || '',
                'Customer Phone': bill.customerPhone || '',
                'Item Name': '',
                'Item Price': '',
                'Quantity': '',
                'Item Total': '',
                'Subtotal': bill.subtotal,
                'Packing Charge': bill.packingCharge,
                'Total': bill.total,
                'Payment Method': bill.paymentMethod,
                'Amount Received': bill.amountReceived,
                'Change': bill.change
            });
        } else {
            // Add each item as a separate row
            bill.items.forEach((item, index) => {
                csvData.push({
                    'Bill Number': index === 0 ? bill.billNumber : '',
                    'Date': index === 0 ? dateStr : '',
                    'Time': index === 0 ? timeStr : '',
                    'Customer Name': index === 0 ? (bill.customerName || '') : '',
                    'Customer Phone': index === 0 ? (bill.customerPhone || '') : '',
                    'Item Name': item.name,
                    'Item Price': item.price,
                    'Quantity': item.quantity,
                    'Item Total': item.total,
                    'Subtotal': index === 0 ? bill.subtotal : '',
                    'Packing Charge': index === 0 ? bill.packingCharge : '',
                    'Total': index === 0 ? bill.total : '',
                    'Payment Method': index === 0 ? bill.paymentMethod : '',
                    'Amount Received': index === 0 ? bill.amountReceived : '',
                    'Change': index === 0 ? bill.change : ''
                });
            });
        }
    });
    
    const csvContent = convertToCSV(csvData, headers);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `all_data_${dateStr}.csv`);
    
    // Also save to localStorage
    saveCSVToLocalStorage('all_data', csvContent);
    alert('All data exported to CSV successfully!');
}

function saveCSVToLocalStorage(type, csvContent) {
    const timestamp = new Date().toISOString();
    const csvData = {
        type: type,
        content: csvContent,
        timestamp: timestamp,
        date: new Date().toDateString()
    };
    
    // Get existing CSV exports
    let csvExports = JSON.parse(localStorage.getItem('csvExports') || '[]');
    csvExports.push(csvData);
    
    // Keep only last 50 exports
    if (csvExports.length > 50) {
        csvExports = csvExports.slice(-50);
    }
    
    localStorage.setItem('csvExports', JSON.stringify(csvExports));
}

function autoSaveData() {
    // Auto-save EOD data (already saved in saveEODData)
    saveEODData();
    
    // Auto-save CSV to localStorage (without downloading)
    if (eodData.bills.length > 0) {
        try {
            const headers = ['Bill Number', 'Date', 'Time', 'Customer Name', 'Customer Phone', 'Items', 'Subtotal', 'Packing Charge', 'Total', 'Payment Method', 'Amount Received', 'Change', 'Item Count'];
            const csvData = eodData.bills.map(bill => {
                const billDate = new Date(bill.date);
                const dateStr = billDate.toLocaleDateString('en-IN');
                const timeStr = billDate.toLocaleTimeString('en-IN');
                const itemCount = bill.items.reduce((sum, item) => sum + item.quantity, 0);
                
                // Create items list string
                const itemsList = bill.items.map(item => 
                    `${item.name} (${item.quantity}x ₹${item.price})`
                ).join('; ');
                
                return {
                    'Bill Number': bill.billNumber,
                    'Date': dateStr,
                    'Time': timeStr,
                    'Customer Name': bill.customerName || '',
                    'Customer Phone': bill.customerPhone || '',
                    'Items': itemsList,
                    'Subtotal': bill.subtotal,
                    'Packing Charge': bill.packingCharge,
                    'Total': bill.total,
                    'Payment Method': bill.paymentMethod,
                    'Amount Received': bill.amountReceived,
                    'Change': bill.change,
                    'Item Count': itemCount
                };
            });
            
            const csvContent = convertToCSV(csvData, headers);
            saveCSVToLocalStorage('auto_save_bills', csvContent);
        } catch (e) {
            console.log('Auto-save CSV failed:', e);
        }
    }
}

// Save data before page unload
window.addEventListener('beforeunload', function(e) {
    // Save all data to localStorage
    saveEODData();
    
    // Export to CSV and save
    if (eodData.bills.length > 0) {
        try {
            const headers = ['Bill Number', 'Date', 'Time', 'Customer Name', 'Customer Phone', 'Items', 'Subtotal', 'Packing Charge', 'Total', 'Payment Method', 'Amount Received', 'Change', 'Item Count'];
            const csvData = eodData.bills.map(bill => {
                const billDate = new Date(bill.date);
                const dateStr = billDate.toLocaleDateString('en-IN');
                const timeStr = billDate.toLocaleTimeString('en-IN');
                const itemCount = bill.items.reduce((sum, item) => sum + item.quantity, 0);
                
                // Create items list string
                const itemsList = bill.items.map(item => 
                    `${item.name} (${item.quantity}x ₹${item.price})`
                ).join('; ');
                
                return {
                    'Bill Number': bill.billNumber,
                    'Date': dateStr,
                    'Time': timeStr,
                    'Customer Name': bill.customerName || '',
                    'Customer Phone': bill.customerPhone || '',
                    'Items': itemsList,
                    'Subtotal': bill.subtotal,
                    'Packing Charge': bill.packingCharge,
                    'Total': bill.total,
                    'Payment Method': bill.paymentMethod,
                    'Amount Received': bill.amountReceived,
                    'Change': bill.change,
                    'Item Count': itemCount
                };
            });
            
            const csvContent = convertToCSV(csvData, headers);
            saveCSVToLocalStorage('auto_save_bills', csvContent);
        } catch (e) {
            console.log('Auto-save on unload failed:', e);
        }
    }
});

// Initialize
initializeMenuData();
loadEODData();

// Load saved menu data if exists
const savedMenuData = localStorage.getItem('menuData');
if (savedMenuData) {
    const parsed = JSON.parse(savedMenuData);
    // Merge with current menu data
    parsed.forEach((savedItem, index) => {
        if (menuData[index] && menuData[index].originalName === savedItem.originalName) {
            menuData[index].name = savedItem.name;
            menuData[index].price = savedItem.price;
            updateMenuInHTML(index);
        }
    });
}

updateOrderDisplay();
calculateTotal();


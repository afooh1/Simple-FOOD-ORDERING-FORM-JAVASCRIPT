/**
 * Processes an order and displays the summary with enhanced features
 * @param {Array} orderDetails - Array containing order details
 */
export const processOrder = async (orderDetails) => {
  try {
      //To  Show loading state
      showLoadingState();
      
      // Validating order details
      if (!validateOrderDetails(orderDetails)) {
          throw new Error('Please fill in all required fields correctly');
      }

      //for Processing and displaying order summary
      const summaryHTML = await generateOrderSummary(orderDetails);
      document.querySelector("#orderForm").innerHTML = summaryHTML;
      
      // Add event listeners for new buttons
      document.getElementById('printReceipt')?.addEventListener('click', printReceipt);
      document.getElementById('newOrder')?.addEventListener('click', () => {
          window.location.reload();
      });

      // For Starting countdown timer
      const { completionTime } = calculateDeliveryDetails(orderDetails);
      startCountdown(completionTime);
      
  } catch (error) {
      showErrorState(error);
  }
};

/**
* To Shows loading animation
*/
const showLoadingState = () => {
  document.querySelector("#orderForm").innerHTML = `
      <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Processing your order...</p>
      </div>
  `;
};

/**
* To Shows error state with retry option
* @param {Error} error - Error object
*/
const showErrorState = (error) => {
  console.error('Order processing error:', error);
  document.querySelector("#orderForm").innerHTML = `
      <div class="error-state">
          <h2>Order Processing Failed</h2>
          <p>${error.message || 'An unexpected error occurred'}</p>
          <button id="retryButton" class="retry-button">Try Again</button>
      </div>
  `;
  
  document.getElementById('retryButton').addEventListener('click', () => {
      window.location.reload();
  });
};

/**
* Validates order details
* @param {Array} orderDetails - Order details array
* @returns {boolean} - True if valid
*/
const validateOrderDetails = (orderDetails) => {
  if (!Array.isArray(orderDetails) || orderDetails.length < 7) return false;
  
  // To Check required fields
  if (!orderDetails[0] || !orderDetails[1] || !orderDetails[2] || !orderDetails[4]) {
      return false;
  }
  
  // To Validate phone number
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  if (!phoneRegex.test(orderDetails[1])) {
      throw new Error('Please enter a valid phone number (XXX) XXX-XXXX');
  }
  
  return true;
};

/**
* Generates complete order summary HTML
* @param {Array} orderDetails - Order details
* @returns {Promise<string>} - HTML string
*/
const generateOrderSummary = async (orderDetails) => {
  const { completionTime, formattedCompletionTime } = calculateDeliveryDetails(orderDetails);
  const formattedPhoneNumber = formatPhoneNumber(orderDetails[1]);
  const deliveryFee = calculateDeliveryFee(orderDetails);
  const orderID = generateOrderID();
  
  // Format display details
  const displayDetails = {
      name: orderDetails[0],
      phone: formattedPhoneNumber,
      deliveryDate: new Date(orderDetails[2]).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
      }),
      arrivalTime: formattedCompletionTime,
      address: orderDetails[4],
      spiceLevel: orderDetails[6] || 'Not specified',
      instructions: orderDetails[7] || 'None'
  };

  // Try to fetch random comment
  let featuredComment = await fetchRandomComment().catch(() => null);

  return `
      <div class="order-summary">
          <h2>Order Confirmation</h2>
          <div class="order-id-banner">
              <span>Order #${orderID}</span>
          </div>
          
          <div class="summary-section">
              <h3>Delivery Details</h3>
              <ul class="details-list">
                  ${Object.entries(displayDetails).map(([key, value]) => `
                      <li>
                          <span class="detail-label">${formatLabel(key)}:</span>
                          <span class="detail-value">${value}</span>
                      </li>
                  `).join('')}
                  <li class="total-row">
                      <span class="detail-label">Delivery Fee:</span>
                      <span class="detail-value">$${deliveryFee.toFixed(2)}</span>
                  </li>
              </ul>
          </div>
          
          <div class="countdown-section">
              <h3>Estimated Arrival</h3>
              <div class="countdown-display">
                  <span id="countdown">Calculating...</span>
              </div>
              <p class="expected-time">Expected by ${formattedCompletionTime}</p>
          </div>
          
          <div class="comments-section">
              <h3>Customer Feedback</h3>
              <blockquote>${featuredComment?.body || 'No featured comments available at this time.'}</blockquote>
          </div>
          
          <div class="actions-section">
              <button id="printReceipt" class="action-button print-button">Print Receipt</button>
              <button id="newOrder" class="action-button new-order-button">Start New Order</button>
          </div>
      </div>
      <small>&copy; Babatunde Olatunde / 8762753  2025</small>
  `;
};

/**
* To Calculates delivery time 
* @param {Array} orderDetails - Order details
* @returns {Object} - Delivery time information
*/
const calculateDeliveryDetails = (orderDetails) => {
  const [hours, minutes] = orderDetails[3].split(":").map(Number);
  const baseDeliveryTime = 30; // The Base 30 minutes
  const distanceFactor = Math.min(orderDetails[5] * 2, 30); // Maximum 30 min for distance
  const deliveryTimeInMinutes = baseDeliveryTime + distanceFactor;

  const completionTime = new Date(orderDetails[2]);
  completionTime.setHours(hours);
  completionTime.setMinutes(minutes + deliveryTimeInMinutes);

  const formattedCompletionTime = completionTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
  });

  return { completionTime, formattedCompletionTime };
};

/**
* To Formats phone numbers
* @param {string} phone - Raw phonenumber
* @returns {string} - Formatted number
*/
const formatPhoneNumber = (phone) => {
  const cleaned = `${phone}`.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phone;
};

/**
* To Formats label names
* @param {string} key - Key to format
* @returns {string} - Formatted label
*/
const formatLabel = (key) => {
  return key.replace(/([A-Z])/g, ' $1')
           .replace(/^./, str => str.toUpperCase());
};

/**
* Final delivery fee calculation
* @param {Array} orderDetails - Order details
* @returns {number} - Calculated fee
*/
const calculateDeliveryFee = (orderDetails) => {
  const time = orderDetails[3];
  const date = new Date(orderDetails[2]);
  const distance = parseFloat(orderDetails[5]) || 0;
  const spiceLevel = orderDetails[6];

  const hour = parseInt(time.split(":")[0]);
  const day = date.getDay();

  let fee = 5.0; // Base-fee

  // Peak hours (lunch 11-1, dinner 5-7) surcharge
  if ((hour >= 11 && hour <= 13) || (hour >= 17 && hour <= 19)) {
      fee += 2.0;
  }

  // Weekend surcharge
  if (day === 0 || day === 6) {
      fee += 1.5;
  }

  // Distance fee ($0.75 per km, capped at $15)
  fee += Math.min(distance * 0.75, 15);

  // Spice level surcharge
  if (spiceLevel) {
      if (spiceLevel.toLowerCase() === "hot") fee += 1.5;
      if (spiceLevel.toLowerCase() === "medium") fee += 0.5;
  }

  return Math.max(fee, 5.0); // Minimum fee
};

/**
* Generates random order ID
* @returns {string} - Order ID
*/
const generateOrderID = () => {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // I and O not included for Clarity purpose
  const digits = "0123456789";
  
  return Array.from({ length: 3 }, () => 
      letters.charAt(Math.floor(Math.random() * letters.length)))
      .join('') +
      Array.from({ length: 4 }, () => 
          digits.charAt(Math.floor(Math.random() * digits.length)))
      .join('');
};

/**
* Starts countdown timer
* @param {Date} targetTime - Delivery time
*/
const startCountdown = (targetTime) => {
  const countdownEl = document.getElementById("countdown");
  if (!countdownEl) return;

  const updateCountdown = () => {
      const now = new Date();
      const diff = Math.max(0, targetTime.getTime() - now.getTime());
      
      if (diff <= 0) {
          countdownEl.innerHTML = `<span class="delivered">Delivered!</span>`;
          clearInterval(interval);
          return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      countdownEl.innerHTML = `
          <span class="time-block">${hours.toString().padStart(2, '0')}</span>h
          <span class="time-block">${minutes.toString().padStart(2, '0')}</span>m
          <span class="time-block">${seconds.toString().padStart(2, '0')}</span>s
      `;
  };

  updateCountdown();
  const interval = setInterval(updateCountdown, 1000);
};



/**
* Fetches random comment from the JSON API
* @returns {Promise<Object>} - Comment object
*/
const fetchRandomComment = async () => {
  const response = await fetch("https://jsonplaceholder.typicode.com/comments");
  if (!response.ok) throw new Error('Failed to fetch comments');
  const comments = await response.json();
  return comments[Math.floor(Math.random() * comments.length)];
};



/**
* to Prints the receipt
*/
const printReceipt = () => {
  window.print();
};
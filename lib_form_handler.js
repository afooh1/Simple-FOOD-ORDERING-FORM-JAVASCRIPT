import { processOrder } from "./lib_order_processing.js";
import { processMealSuggestion } from "./lib_meal_suggestion.js";

export const setupForm = () => {
    document.querySelector("#customerDetails").addEventListener("submit", event => {
        event.preventDefault();
        const results = getOrderDetails();
        if (!results.isBadwords) {
            processOrder(results.orderDetails);
        }
    });

    // Add event listener for meal suggestion button
    document.querySelector("#getMealBtn").addEventListener("click", processMealSuggestion);
};

const getOrderDetails = () => {
    const orderDetails = [];
    orderDetails.push(document.querySelector('#fullName').value.trim());
    orderDetails.push(document.querySelector('#phoneNumber').value.trim());
    orderDetails.push(new Date(document.querySelector('#deliveryDate').value));
    orderDetails.push(document.querySelector('#deliveryTime').value);
    orderDetails.push(document.querySelector('#deliveryAddress').value.trim());
    orderDetails.push(parseInt(document.querySelector('#deliveryDistance').value) || 0);
    orderDetails.push(document.querySelector('#spiceLevel').value);
    orderDetails.push(document.querySelector('#specialInstructions').value.trim());

    // Show spice level alert
    switch (orderDetails[6]) {
        case "Hot":
            alert("You've selected a Hot spice level. Enjoy the heat!");
            break;
        case "Medium":
            alert("You've selected a Medium spice level.");
            break;
        default:
            alert("You've selected a Mild spice level.");
    }

    // Check for bad words
    let isBadwords = false;
    try {
        if (orderDetails[7].toLowerCase().includes("badword")) {
            isBadwords = true;
            throw new Error("Please avoid using inappropriate language.");
        }
    } catch (error) {
        alert(error.message);
    }

    return {
        isBadwords: isBadwords,
        orderDetails: orderDetails
    };
};
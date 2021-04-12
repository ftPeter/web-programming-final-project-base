$(document).ready(function () {
    // load the customer's order history
    loadOrders();
    // Update status every 5 Minutes
    setInterval(updateEveryStatus, 60 * 5000);
    // Clear the order history 
    $("#clear-history").click(clearHistory);
});

// Load the customer's orders from the DB
async function loadOrders() {
    $.ajax({
        url: "/api/orders/" + localStorage.getItem("customer_id"),
        type: "GET"
    }).done(function (data) {
        if (!$.isEmptyObject(data)) {
            // Get list of all the JSON orders
            const orders = data.customer_orders;
            // Initialize an empty string to add to the orders.html page
            var orders_html = "";
            orders.forEach((order, index) => {
                // For each order join the entrees and the sides
                const items = order.customer_order.entrees.concat(order.customer_order.sides);
                var menu_items = "";
                // Get all the menu items the customer ordered 
                items.forEach((item, index) => {
                    for (i = 0; i < item.quantity; i++) {
                        menu_items += `<div class="leaders"><span>${item.name}</span><span>${item.price}</span></div>`;
                    }
                });
                // Create an individual order slip string
                var menu_order = `
                    <div class="grid-item">
                        <div id="order-num">
                            <p><strong>Order #</strong></p>
                            <p id="number">${order.confirm_num}</p>
                        </div>
                        <div id="menu-items">${menu_items}</div>
                        <hr>
                        <p id="order-total"><strong>Order Total: </strong><span id="total">$${order.customer_order.total}</span></p>
                        <p id="restaurant"><strong>Restaurant: </strong><span id="restaurant-name">${order.customer_order.restaurant}</span></p>
                        <br>
                        <div id="order-status">
                            <p><strong>Order Status:</strong></p>
                            <p id="status">${order.order_status}</p>
                        </div>
                        <div class="buy">
                            <button class="buy-again" id="${order.confirm_num}">Buy Again</button>
                        </div>
                    </div>`;
                // Add the menu order to the entire orders string
                orders_html += menu_order;
            });
            // Insert the orders string into the orders div
            $("#orders").html(orders_html);
            // Initialize the event listener for the buy again button
            $(".buy-again").click(buyOrderAgain);
        }
        
    }).fail(function (jqXHR) {
        console.log("Error loading the order");
    });
}

// Get the customer's orders and update every order's status by their confirmation number
async function updateEveryStatus() {
    $.ajax({
        url: "/api/orders/" + localStorage.getItem("customer_id"),
        type: "GET"
    }).done(function (data) {
        if (!$.isEmptyObject(data)) {
            console.log(data)
            const orders = data.customer_orders;
            orders.forEach((order, index) => {
                updateStatus(order.confirm_num);
            });
        }
    }).fail(function (jqXHR) {
        console.log("Error loading the order");
    });
}

// Update the individual order status based on the confirmation number
async function updateStatus(confirm_num) {
    $.ajax({
        url: "/api/order-status",
        type: "PUT",
        data: {confirm_num: confirm_num}  
    }).done(function (data) {
        // Update the status of the correct order
        $(`#number:contains(${confirm_num}) #status`).html(data.order_status);
    }).fail(function (jqXHR) {
        console.log("Error loading the order");
    });
}

// Customer functionality to buy an order again
async function buyOrderAgain() {
    // Figure out which order it is
    const confirm_num = this.id;
    // Get the order
    $.ajax({
        url: "/api/order/" + confirm_num,
        type: "GET"
    }).done(function (data) {
        // Post order to DB
        const order = data.customer_order;
        // Reconstruct order
        const new_order = {
            customer_id: localStorage.getItem("customer_id"),
            entrees: order.entrees,
            sides: order.sides,
            total: order.total,
            restaurant: order.restaurant
        };
        // Post order to the DB
        $.ajax({
            type: "POST",
            url: "/api/orders",
            data: JSON.stringify(new_order),
            contentType: "application/json",
        }).done(function (data) {
            // Set the new confirmation number
            localStorage.setItem("confirm_num", data.confirm_num);
            // Take the user to the confirmation page
            location.href = "/confirmation/confirmation.html";
        }).fail(function (jqXHR) {
            console.log("The order could not be sent. Please try again");
        });
    }).fail(function (jqXHR) {
        console.log("Error loading the order");
    });
}

// Clear the customer's previous orders from the DB
async function clearHistory() {
    $.ajax({
        type: "DELETE",
        url: "/api/orders/" + localStorage.getItem("customer_id"),
        contentType: "application/json",
    }).done(function (data) {
        $("#orders").html("");
    }).fail(function (jqXHR) {
        console.log("Error loading the order");
    });
}
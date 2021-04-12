$(document).ready(function () {
    loadOrders();
    // Update every 5 Minutes
    setInterval(updateEveryStatus, 60 * 5000);
});

async function loadOrders() {
    $.ajax({
        url: "/api/orders/" + localStorage.getItem("customer_id"),
        type: "GET"
    }).done(function (data) {
        if (!$.isEmptyObject(data)) {
            const orders = data.customer_orders;
            var orders_html = "";
            orders.forEach((order, index) => {
                const items = order.customer_order.entrees.concat(order.customer_order.sides);
                var menu_items = "";
                items.forEach((item, index) => {
                    for (i = 0; i < item.quantity; i++) {
                        menu_items += `<div class="leaders"><span>${item.name}</span><span>${item.price}</span></div>`;
                    }
                });
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
                    </div>`;
                orders_html += menu_order;
            });
        }
        $("#orders").html(orders_html);
    }).fail(function (jqXHR) {
        console.log("Error loading the order");
    });
}

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

async function updateStatus(confirm_num) {
    $.ajax({
        url: "/api/order-status",
        type: "PUT",
        data: {confirm_num: confirm_num}  
    }).done(function (data) {
        $(`#number:contains(${confirm_num}) #status`).html(data.order_status);
    }).fail(function (jqXHR) {
        console.log("Error loading the order");
    });
}
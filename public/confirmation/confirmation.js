$(document).ready(function () {
    loadOrder();
    // postOrderConfirmation();
    // updateStatus();
});

function loadOrder() {
    $.ajax({
        url: "/api/orders/" + localStorage.getItem("customerID"),
        type: "GET",
    }).done(function (data) {
        let html = "";
        if (!$.isEmptyObject(data)) {
            const order = data.customer_order;
            const items = order.entrees.concat(order.sides);
            items.forEach((item, index) => {
                for (i = 0; i < item.quantity; i++) {
                    html += '<div class="leaders"> <span>' + item.name + '</span><span>' + item.price + '</span></div>';
                }
            });
            // Populate menu-items with order information
            $("#menu-items").html(html);
            // Populate total with order total
            $("#total").html("$" + order.total);
            // Populate number with order confirmation number
            $("#number").html(data.confirm_num);
            // Populate status with order status
            $("#status").html(data.order_status);
        }
    }).fail(function (jqXHR) {
        console.log("Error loading the order");
    });
}

async function postOrderConfirmation() {
    
}

async function updateStatus() {

}
$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip({
        title: "Please pay at the restaurant",
        placement: "left"
    });
    // AFTER 25 Minutes
    setTimeout(60 * 25000);
    loadOrderConfirmation();
    // Update every 5 Minutes
    setInterval(updateStatus, 60 * 5000);
    $("#refresh").click(refreshStatus);
});

async function loadOrderConfirmation() {
    $.ajax({
        url: "/api/order/" + localStorage.getItem("confirm_num"),
        type: "GET"
    }).done(function (data) {
        console.log(data)
        let html = "";
        if (!$.isEmptyObject(data)) {
            const order = data.customer_order;
            const items = order.entrees.concat(order.sides);
            items.forEach((item, index) => {
                for (i = 0; i < item.quantity; i++) {
                    html += `<div class="leaders"><span>${item.name}</span><span>${item.price}</span></div>`;
                }
            });
            // Populate restaurant name with order information
            $("#restaurant-name").html(order.restaurant);
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

async function updateStatus() {
    $.ajax({
        url: "/api/order-status",
        type: "PUT",
        data: {confirm_num: localStorage.getItem("confirm_num")}  
    }).done(function (data) {
        refreshStatus();
    }).fail(function (jqXHR) {
        console.log("Error loading the order");
    });
}

async function refreshStatus() {
    NProgress.start();
    $.ajax({
        url: "/api/order-status/?confirm_num=" + localStorage.getItem("confirm_num"),
        type: "GET"
    }).done(function (data) {
        const order_status = data.order_status;
        $("#status").html(order_status);
    }).fail(function (jqXHR) {
        console.log("Error loading the order");
    });
    NProgress.done();
}
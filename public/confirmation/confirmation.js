$(document).ready(function () {
    loadOrder();
    postOrderConfirmation();
    updateStatus();
});

async function loadOrder() {
    $.ajax({
        url: "/api/orders/:" + localStorage.getItem("customerID"),
        type: "GET",
    }).done(function (data) {
        let html = "";
        if (data) {
            items = data.entrees.concat(data.sides) ;
            items.forEach((item, index) => {
                html += '<div class="leaders">'
                for (i = 0; i <= item.val; i++) {
                    html += "<p>" + item.name + "</p><span>" + data.price + "</span>";
                }
                html += '</div>'
            });
            $("#menu-items").html(html);
            $("#total").html(data.total);
        }
    }).fail(function (jqXHR) {
        console.log("Error loading the order");
    });
}

async function postOrderConfirmation() {
    
}

async function updateStatus() {

}
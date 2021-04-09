$(document).ready(function () {
    // loadOrder()
    // postOrderConfirmation()
});

function loadOrder() {
    $.ajax({
        url: "/api/orders",
        type: "GET",
    }).done(function (data) {
        // Update HTML with request data
        /*<!-- EXAMPLE MENU ITEMS -->
                <!-- <div class="leaders">
                    <label for="ab">Awesome Burger (Plant Based Bac'n Cheezeburger)</label>
                    <span>$5.99</span>
                </div>
                
                <div class="leaders">
                    <label for="bbbb">Baby Berk Blue Burger</label>
                    <span>$5.99</span>
                </div> --> */

        if (data) {
            items = data.entrees.concat(data.sides) ;
            items.forEach((item, index) => {

                html += '<div class="leaders"> <p>' + item.name + '</p><span>' + data.price + '</span>';
            });
            $("#menu-items").html(html);
        }
    }).fail(function (jqXHR) {
        console.log("Error loading the order");
    });
}

function postOrderConfirmation() {
    
}
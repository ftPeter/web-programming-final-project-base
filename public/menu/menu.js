let choseItem = false;

$(document).ready(function () {
    $("#menu").on("change", validateOrder)
    $("#menu").on("change", updateTotal)
    $('#checkout').click(checkout)
});

// Validate entrees and sides in the customer order
function validateOrder(){
    let totalItems = 0;
    let checkEntree = $('#entrees input[type="number"]');
    let checkSides = $('#sidesDrinks input[type="number"]');

    for(let i=0; i<checkEntree.length; i++){
        for(let j=0; j<checkSides.length; j++){
            totalItems += parseInt($(checkSides[j]).val()) || 0; 
        }
        totalItems += parseInt($(checkEntree[i]).val()) || 0;
    }

    if (totalItems > 0) {
        // Hide the warning if the customer has chosen an entree or side
        $("#warning").hide();
        choseItem = true;
    }
    else {
        // Display the warning if the customer hasn't chosen anything
        $("#warning").show();
        choseItem = false;
    }
}

// Update the total whenever something has changed on the menu
function updateTotal() {
    let price = 0;
    let items = $('input[type="number"]');

    $.each(items, function (index, value) {

        if (parseInt($(value).val()) >= 1) {
            val = parseInt($(value).val())
            priceStr = value.nextSibling.nextSibling.nextSibling.nextSibling.innerText;
            price += (val * parseFloat(priceStr.substring(1)));
        }
    });
    price = price.toFixed(2);
    $("#total")[0].innerHTML = "<strong>Order Total: </strong>$" + price;
    return price;
}   

// Do the checkout for the user
function checkout() {
    const customer_id = window.localStorage.getItem("token");
    const total = updateTotal();
    const entrees = $('#entrees input[type="number"]');
    const sides = $('#sidesDrinks input[type="number"]');
    let entreesList = [];
    let sidesList = [];
    let order;

    // Get entrees
    $.each(entrees, function (index, value) {

        if (parseInt($(value).val()) >= 1) {
            val = parseInt($(value).val())
            // Get the entree label
            entree = value.nextSibling.nextSibling.innerText;
            // Push the the entree with its quantity to entreesList
            entreesList.push({
                entree: entree,
                quantity: val
            });
        }
    });

    // Get sides
    $.each(sides, function (index, value) {

        if (parseInt($(value).val()) >= 1) {
            val = parseInt($(value).val())
            // Get the entree label
            side = value.nextSibling.nextSibling.innerText;
            // Push the the entree with its quantity to entreesList
            sidesList.push({
                side: side,
                quantity: val
            });
        }
    });

    // Create order
    if (choseItem) {
        order = {
            customer_id: customer_id,
            entrees: entreesList,
            sides: sidesList,
            price: total,
        } 
    }

    // POST a request with the JSON-encoded order to /orders
    $.ajax({
        type: "POST",
        url: "/api/orders",
        data: JSON.stringify(order),
        contentType: "application/json"
    }).done(function (data) {
        // Reset the form after saving the order
        $("form").trigger("reset");
    }).fail(function (jqXHR) {
        $("error").html("The order could not be sent. Please try again");
    });

}
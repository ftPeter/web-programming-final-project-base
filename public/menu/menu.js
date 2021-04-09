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
        return true;
    }
    else {
        // Display the warning if the customer hasn't chosen anything
        $("#warning").show();
        return false;
    }
}

// Update the total whenever something has changed on the menu
function updateTotal() {
    $("#total")[0].innerHTML = "<strong>Order Total: </strong>$" + getTotal();
}   

// Do the checkout for the user
function checkout() {
    // Create order
    if (validateOrder()) {
        const order = {
            customer_id: localStorage.getItem("customerID"),
            entrees: getEntrees(),
            sides: getSides(),
            price: getTotal(),
        }
        // POST a request with the JSON-encoded order to /orders
        $.ajax({
            type: "POST",
            url: "/api/orders",
            data: JSON.stringify(order),
            contentType: "application/json",
        }).done(function (data) {
            // Reset the form after saving the order
            $("form").trigger("reset");
            location.href = "/confirmation/confirmation.html"
        }).fail(function (jqXHR) {
            $("error").html("The order could not be sent. Please try again");
        });
    }

}

/* * * * * * * * * * * * * * * * * * * * * *  
 *     HELPER FUNCTIONS for checkout()     *
 * * * * * * * * * * * * * * * * * * * * * *  
*/

function getEntrees() {
    let entrees = $('#entrees input[type="number"]');
    let entreesList = [];

    // Get entrees
    $.each(entrees, function (index, value) {

        if (parseInt($(value).val()) >= 1) {
            val = parseInt($(value).val())
            // Get the entree label
            entree = value.nextSibling.nextSibling.innerText;
            // Get the price of the individual entree
            price = value.nextSibling.nextSibling.nextSibling.nextSibling.innerText;
            // Push the the entree with its quantity and price to entreesList
            entreesList.push({
                entree: entree,
                quantity: val,
                price: price
            });
        }
    });
    return entreesList;
}

function getSides() {
    let sides = $('#sidesDrinks input[type="number"]');
    let sidesList = [];

    // Get sides
    $.each(sides, function (index, value) {

        if (parseInt($(value).val()) >= 1) {
            val = parseInt($(value).val())
            // Get the side label
            side = value.nextSibling.nextSibling.innerText;
            // Get the price of the individual side
            price = value.nextSibling.nextSibling.nextSibling.nextSibling.innerText;
            // Push the the side with its quantity and price to sidesList
            sidesList.push({
                side: side,
                quantity: val,
                price: price
            });
        }
    });
    return sidesList;
}

function getTotal() {
    let price = 0.0;
    let html = $('input[type="number"]');
    $.each(html, function (index, value) {
        if (parseInt($(value).val()) >= 1) {
            val = parseInt($(value).val())
            priceStr = value.nextSibling.nextSibling.nextSibling.nextSibling.innerText;
            price += (val * parseFloat(priceStr.substring(1)));
        }
    });
    return price.toFixed(2);
}
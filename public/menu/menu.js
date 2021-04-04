let choseItem = false;

$(document).ready(function () {
    $("#menu").on("change", checkOrder)
    $("#menu").on("change", updateTotal)
    $('#menu').submit(validateCheckOut)

    // validate entrees and sides
    function checkOrder() {
        let totalItems = 0;
        let checkEntree = $('#entrees input[type="number"]').val();
        let checkSides = $('#sidesDrinks input[type="number"]').val();

        totalItems = checkEntree + checkSides;

        if (totalItems > 0) {
            $("#warning").hide();
            choseItem = true;
        }
        else{
            $("#warning").show();
            choseItem = false;
        }
        
    }

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
        $("#total")[0].innerText = "Order Total: $" + price.toFixed(2);
    }   

    // validate that entrees and sides were chosen
    function validateCheckOut(event) {
        if (!choseItem) {
            event.preventDefault();
        }
    }
});
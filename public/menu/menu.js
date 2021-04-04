let choseItem = false;

$(document).ready(function () {
    $("#menu").on("change", checkOrder)
    $("#menu").on("change", updateTotal)
    $('#menu').submit(validateCheckOut)

    // validate entrees and sides
    function checkOrder(){
        let totalItems = 0;
        let checkEntree = $('#entrees input[type="number"]');
        let checkSides = $('#sidesDrinks input[type="number"]');

        for(let i=0; i<checkEntree.length; i++){
            for(let j=0; j<checkSides.length; j++){
                totalItems += parseInt($(checkSides[j]).val()) || 0; 
            }
            totalItems += parseInt($(checkEntree[i]).val()) || 0;
        }

        if(totalItems > 0){
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
        $("#total")[0].innerHTML = "<strong>Order Total: </strong>$" + price.toFixed(2);
    }   

    // validate that entrees and sides were chosen
    function validateCheckOut(event) {
        if (!choseItem) {
            event.preventDefault();
        }
    }
});
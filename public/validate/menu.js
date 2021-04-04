// validate entree
$(document).ready(function(){
    $("#menu").on("change", checkOrder)

    function checkOrder(){
        let totalItems = 0;
        let checkEntree = $('#entrees input[type="number"]');
        let checkSides = $('#sidesDrinks input[type="number"]');

        for(let i=0; i<checkEntree.length; i++){
            for(let j=0; j<checkSides.length; j++){
                totalItems += parseInt($(checkSides[j]).val()) || 0; 
                console.log(checkSides[j]);
            }
            totalItems += parseInt($(checkEntree[i]).val()) || 0;
        }

        if(totalItems > 0){
            $("#warning").hide();
        }
        else{
            $("#warning").show();
        }
    }
});

// total cost
// find a way to get the qty stored in a variable
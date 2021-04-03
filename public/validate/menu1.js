// validate entree
$("#entrees").on("change", checkEntree)

function checkEntree(){
   let sum = 0;
   let checkEntree = $('#entrees input[type="number"]');
   for(let i=0; i<checkEntree.length; i++){
       sum += parseInt($(checkEntree[i]).val()) || 0; 
       console.log(sum) 
   }
   if(sum > 0){
       $("#entreeWarning").hide();
   }
   else{
       $("#entreeWarning").show();
   }
}

// total cost
// find a way to get the qty stored in a variable
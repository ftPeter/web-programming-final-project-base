$(document).ready(function () {
    // Logout the customer
    $("#logout").click(function logout() {
        // Clear the local token created on login
        localStorage.clear();
        // TODO: FIX THE BUG HERE 
        console.log("THIS METHOD IS CALLED")
    })
});


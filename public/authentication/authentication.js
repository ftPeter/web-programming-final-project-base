$(document).ready(function () {
  // Login customer 
  $("#login").click(login);
  // Logout customer
  $("#logout").click(logout);
});

function login() {
  let username = $("#username").val();
  let password = $("#password").val();

  if (username != "" && password != "") {
    $("#error").hide();

    const requestAuth = {
      username: username,
      password: password
    }
    // POST a request with the JSON-encoded username and password to /api/auth
    $.ajax({
        url: "/api/auth",
        type: "POST",
        data: JSON.stringify(requestAuth),
        contentType: "application/json"
    }).done(function (data) {
        // Reset the form after saving the login
        $("form").trigger("reset");
        localStorage.setItem("token", data.token);
        localStorage.setItem("customerID", data.customer_id);
        open("../index.html", "_self");
    }).fail(function (jqXHR) {
        $("#error").show();
    });
  } else {
      $("#error").show();
  }
  
}

function logout() {
    const token = localStorage.getItem("token");
    $.ajax({
        url: "/api/status",
        type: "GET",
        headers: {"X-Auth": token}
    }).done(function (data) {
        // Clear the local token created on login amd the customer's id
      localStorage.clear();
        // Redirect back to home page
        location.href = "/";
    }).fail(function (jqXHR) {
        $("#error").html = ("Error logging out");
        $("#error").show();
    });
}

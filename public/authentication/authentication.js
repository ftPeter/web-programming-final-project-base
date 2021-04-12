$(document).ready(function () {
  // Login customer 
  $("#login").click(login);
  // Logout customer
  $("#logout").click(logout);
});

// Login the user from the login page
async function login() {
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
      // Add the token to local storage for later access in logout
      localStorage.setItem("token", data.token);
      // Add the customer id to local storage for access accross the website
      localStorage.setItem("customer_id", data.customer_id);
      // Open the home page in the same window
      open("../index.html", "_self");
    }).fail(function () {
        $("#error").show();
    });
  } else {
      // Tell user that they have given an invalid login
      $("#error").show();
  }
  
}

// Logout the user from the website
async function logout() {
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
    }).fail(function () {
      $("#error").html = ("Error logging out");
      $("#error").show();
    });
}

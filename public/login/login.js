$(document).ready(function () {
    $("#login").click(login)
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
        type: "POST",
        url: "/api/auth",
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
  } 
  $("#error").show();
  
}

function logout() {

}

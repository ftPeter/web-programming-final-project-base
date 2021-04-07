$(document).ready(function () {
    $("#login").click(login)
});

function login() {
  var username = $("#username").val();
  var password = $("#password").val();

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
        // Reset the form after saving the order
      $("form").trigger("reset");
      const token = data.token;
      window.localStorage.setItem("token", token);
      window.open("../index.html", "_self");
    }).fail(function (jqXHR) {
        $("error").html("Invalid Login");
    });
}

function logout() {

}

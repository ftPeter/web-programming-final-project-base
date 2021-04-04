firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    document.getElementById("use").style.display = "block";
    document.getElementById("pass").style.display = "initial";

    var user = firebase.auth().currentUser;

    if (user != null) {
      var email = user.email;
      uid = user.uid;
      document.getElementById("p").innerHTML = "Welcome" + " " + email;
    }
  } else {
    document.getElementById("use").style.display = "initial";
    document.getElementById("pass").style.display = "block";
  }
});
document.getElementById("button").addEventListener("click", login);

function login() {
  var email = document.getElementById("use").value;
  var password = document.getElementById("pass").value;

  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      var user = userCredential.user;
      // ...
    })
    .catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
      // ..

      window.alert(errorMessage);
    });

  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      var user = userCredential.user;
      // ...
    })
    .catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
    });
}

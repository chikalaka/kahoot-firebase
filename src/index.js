import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import firebase from "firebase";

const firebaseConfig = {
  apiKey: "AIzaSyBca-Bcu8EdAUO-B7N6KqiYwEtTLh4UCFE",
  authDomain: "kahoot-fac46.firebaseapp.com",
  databaseURL: "https://kahoot-fac46.firebaseio.com",
  projectId: "kahoot-fac46",
  storageBucket: "",
  messagingSenderId: "909807521563",
  appId: "1:909807521563:web:3fead182c52f2ef1"
};

firebase.initializeApp(firebaseConfig);

ReactDOM.render(<App />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

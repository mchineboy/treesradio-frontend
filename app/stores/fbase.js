import {observable, action, computed, toJS} from 'mobx';
import ax from 'utils/ax';
import firebase from 'firebase';

export default new class FirebaseSetup {
  constructor() {
    this.getEnv(() => {
      firebase.initializeApp(this.env.fbConfig);
      this.f = firebase;
      this.db = firebase.database();
      this.auth = firebase.auth();
      firebase.auth().onAuthStateChanged((user) => {
        this.user = user;
        firebase.database().ref(`users/${user.uid}`).on('value', (snap) => {
          this.profile = snap.val();
          this.profileInit = true;
        })
      });
      this.init = true;
    });
  }

  @observable init = false;
  @observable env = {};

  getEnv(callback) {
    ax.get('/env').then((resp) => {
      this.env = resp.data;
      console.log('env', toJS(this.env));
      if (callback) {
        callback();
      }
    })
  }

  @observable user = null;
  @observable profile = null;
  @observable profileInit = false;

  login(email, password) {
    firebase.auth().signInWithEmailAndPassword(email, password).then((user) => {
      console.log('user', user);
    }).catch((error) => {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(error);
      // ...
    });
  }

  logout() {
    firebase.auth().signOut().then(function() {
      // Sign-out successful.
    }, function(error) {
      // An error happened.
    });
  }

  @computed get noName() {
    console.log(this.profile);
    return this.user !== null && this.profileInit === true && (this.profile === null || !this.profile.username);
  }

  getToken() {
    return firebase.auth().currentUser.getToken(true); //returns promise with token
  }

  @computed get safeUsername() {
    if (this.profile === null) {
      return undefined;
    } else {
      return this.profile.username;
    }
  }

  @observable registrationError = '';

  clearRegError() {
    this.registrationError = '';
  }

  register(email, password) {
    this.clearRegError();
    firebase.auth().createUserWithEmailAndPassword(email, password).catch((error) => {
      console.log('registration error', error);
      this.registrationError = error.message;
    }).then((user) => {
      //something
    })
  }

  @observable resettingPassword = false;
  @observable resetPassError = '';
  @observable resetPassSuccess = false;
  @observable lastResetEmail = '';

  startResettingPassword() {
    this.clearPassResetError();
    this.clearPassResetSuccess();
    this.resettingPassword = true;
  }

  stopResettingPassword() {
    this.resettingPassword = false;
  }

  clearPassResetError() {
    this.resetPassError = '';
  }

  clearPassResetSuccess() {
    this.lastResetEmail = '';
    this.resetPassSuccess = false;
  }

  sendPassReset(email) {
    this.clearPassResetError();
    firebase.auth().sendPasswordResetEmail(email).catch((error) => {
      this.resetPassError = error.message;
      this.stopResettingPassword();
    }).then(() => {
      this.lastResetEmail = email;
      this.resetPassSuccess = true;
      this.stopResettingPassword();
    });
  }
}

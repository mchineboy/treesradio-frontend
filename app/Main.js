//MAIN JS

// Sentry Error Reporting
// Raven is defined globally in index.html
Raven.config('https://870758af6d504cf08cda52138702ccd9@app.getsentry.com/61873', {
  release: '0.1.0'
}).install();

// React
import React from 'react';

// Firebase
import Firebase from 'firebase';
import Rebase from 're-base';
var base = Rebase.createClass(window.__env.firebase_origin);

// More libraries
import sweetAlert from 'sweetalert';
import _ from 'lodash';
import axios from 'axios';
import moment from 'moment';
import url from 'url';
import querystring from 'querystring';
import Favico from 'favico.js';
import buzz from 'node-buzz';


// TreesRadio utility functions
import emitUserError from './utils/userError';
import trYouTube from './utils/youTube.js';
import { countArrayOccurences, mentionTotaler } from './utils/mentionUtils.js';

// Components
import Nav from './components/Nav/Nav';
import Sidebar from './components/Sidebar/Sidebar';
import Video from './components/Video/Video';
import Playlists from './components/Playlists/Playlists';

// (S)CSS
import './Main.scss';

// YouTube API Key
var ytAPIkey = 'AIzaSyDXl5mzL-3BUR8Kv5ssHxQYudFW1YaQckA';
trYouTube.setKey(ytAPIkey);


var appOpenTimestamp = moment().unix();


var Main = React.createClass({
    ///////////////////////////////////////////////////////////////////////
    // REACT-SPECIFIC & CONSTRUCTION
    ///////////////////////////////////////////////////////////////////////
    getInitialState: function(){
      var devCheckResult = false;
      if (window.__env.firebase_origin === "https://treesradio-dev.firebaseio.com") {
        devCheckResult = true;
        document.title = "TreesRadio Dev";
      }
      return {
          devCheck: devCheckResult,
          loginstate: false,
          user: {
            inWaitlist: {
              waiting: false,
              id: ""
            }
          },
          userLevel: 0,
          chat: [],
          userPresence: [],
          playlistsOpen: false,
          currentPlaylist: {
            name: "",
            id: -1,
            key: ""
          },
          playlistsPanelView: "blank",
          playlists: [],
          currentSearch: {
            data: {},
            items: []
          },
          currentSidebar: 0, // 0 - 3 Chat -> About
          controls: {
            volume: 0.25,
            playing: true
          },
          playingMedia: {
            info: {
              title: "Loading...",
              url: ""
            },
            playback: {
              time: 0,
              user: "Nobody"
            },
            feedback: {
              dislikes: 0,
              likes: 0,
              grabs: 0
            }
          },
          userFeedback: {
            opinion: "none",
            grab: false
          },
          waitlist: [],
          localPlayerPos: {
            position: 0
          },
          staff: {},
          banned: false,
          mention: {
            mentioned: '',
            numInMsg: 0,
            notifyNum: 0
          },
          chatlock: false
      }
    },
    componentWillMount: function(){
      var favicon = new Favico({
        animation:'slide'
      });
      var faviconNum = 0;
      this.faviconInterval = setInterval(function() {
        if (this.state.mention.notifyNum !== faviconNum) {
          favicon.badge(this.state.mention.notifyNum);
          faviconNum = this.state.mention.notifyNum;
        }
      }.bind(this), 500);
      this.audioAlert = new buzz.sound("/audio/tr-notify", {
        formats: ["ogg", "mp3"],
        loop: false
      });
    },
    componentDidMount: function(){
        // grab base ref and listen for auth
        this.ref = new Firebase(window.__env.firebase_origin);
        this.ref.onAuth(this.authDataCallback);

        // grab chat messages and bind to chat array in state
        base.syncState('chat/messages', {
            context: this,
            state: 'chat',
            asArray: true,
            queries: {
              limitToLast: 100
            }
        });

        base.bindToState('moderator', {
          context: this,
          state: 'staff'
        });

        base.bindToState('presence', {
          context: this,
          state: 'userPresence',
          asArray: true
        });

        base.bindToState('playing_media', {
          context: this,
          state: 'playingMedia'
        });

        base.bindToState('waitlist/tasks', {
          context: this,
          state: 'waitlist',
          asArray: true
        });

        base.bindToState('backend/chatlock', {
          context: this,
          state: 'chatlock'
        });

        base.listenTo('playing_media/info/url', {
          context: this,
          then() {
            this.setState({
              userFeedback: {
                opinion: "none",
                grab: false
              }
            });
          }
        });

        base.listenTo('playing_media/playback/playing', {
          context: this,
          then(playing){
            if (playing) {
              var setControlsOff = {
                controls: {
                  volume: this.state.controls.volume,
                  playing: false
                }
              }
              this.setState(setControlsOff);
              var setControlsOn = {
                controls: {
                  volume: this.state.controls.volume,
                  playing: true
                }
              }
              this.setState(setControlsOn);
            }
          }
        })
    },
    ///////////////////////////////////////////////////////////////////////
    // LOGIN & REGISTRATION
    ///////////////////////////////////////////////////////////////////////
    authenticateUser: function(eml, pw){
        this.ref.authWithPassword({
            email: eml,
            password: pw
        }, this.authHandler);
    },
    authHandler: function(error){ //hidden authData second param
        if (error) {
            // console.log("Auth", error);
            emitUserError("Login Error", error);
        } else {
            // console.log("Auth success", authData);
            location.reload();
        }

    },
    authDataCallback: function(authData){
        if (authData) {
          //
          // START UPON LOGIN
          //
          Raven.setUserContext({ // Raven is defined globally in index.html
            id: authData.uid
          });


          base.listenTo('bans/'+authData.uid, {
            context: this,
            then(banData){
              // console.log(banData);
              if (banData) {
                if (banData.forever === true) {
                  // console.log('you are banned!');
                  this.setState({
                    banned: true
                  });
                  emitUserError("Banned","You have been banned forever!");
                  return;
                } else if (banData.time > _.now()) {
                  // console.log('you are banned!');
                  this.setState({
                    banned: true
                  });
                  var bannedUntil = new Date(banData.time);
                  var humanBannedUntil = bannedUntil.toString();
                  emitUserError("Banned", "You are banned until: "+ humanBannedUntil);
                  return;
                }
              }
              if (this.state.banned) {
                this.setState({
                  banned: false
                });
                sweetAlert({
                  "title": "Unbanned",
                  "text": "You've been unbanned, welcome back!",
                  "type": "success"
                });
              }
            }
          });

          this.userBindRef = base.syncState('users/' + authData.uid, {
            context: this,
            state: 'user',
            then(){

              var presenceRef = new Firebase(window.__env.firebase_origin + '/presence/' + this.state.user.username);
              this.presenceRef = presenceRef; // for use elsewhere
              // var username = this.state.username; // for use below
              // eslint says unused for above
              presenceRef.child('uid').set(authData.uid);
              presenceRef.child('online').onDisconnect().set(false);
              presenceRef.child('online').set(true);
              //
              // this.presencePing();
              // window.setInterval(this.presencePing, 30000);
              // stopped using presence pings in favor of the below
              // see https://www.firebase.com/docs/web/guide/offline-capabilities.html
              //
              var connectedRef = new Firebase(window.__env.firebase_origin + '/.info/connected');
              connectedRef.on('value', function(snap) {
                if (snap.val() === true) {
                  // var presenceRef = new Firebase(window.__env.firebase_origin + '/presence/' + username);
                  presenceRef.child('online').onDisconnect().set(false);
                  presenceRef.child('online').set(true);
                  presenceRef.child('lastseen').onDisconnect().set(Firebase.ServerValue.TIMESTAMP);
                }
              });




              // check for missing user items
              if (!this.state.user.inWaitlist) {
                base.post('users/' + authData.uid + '/inWaitlist', {
                  data: {
                    waiting: false,
                    id: ""
                  }
                });
              }
              if (!this.state.user.uid) {
                base.post('users/' + authData.uid + '/uid', {
                  data: authData.uid
                });
              }

              if (this.state.user.settings && this.state.user.settings.player && this.state.user.settings.player.volume) {
                this.updateVolume(this.state.user.settings.player.volume);
              }

              this.playlistsBindRef = base.syncState('playlists/' + authData.uid, {
                context: this,
                state: 'playlists',
                asArray: true,
                then(){
                  if (this.state.user.settings && this.state.user.settings.playlists) {
                    if (this.state.user.settings.playlists.selected || this.state.user.settings.playlists.selected === 0) {
                      this.selectPlaylist(this.state.user.settings.playlists.selected);
                    }
                  }
                }
              });


              ////
              // MENTIONS HANDLER
              //
              base.listenTo('chat/messages', {
                context: this,
                asArray: true,
                queries: {
                  limitToLast: 1
                },
                then(msgNode) {
                  var mentionString = '@'+this.state.user.username;
                  mentionString = mentionString.toUpperCase();
                  if (msgNode[0].mentions) {
                    var mentions = msgNode[0].mentions.map(function(item) {
                      return item.toUpperCase();
                    });
                    if (_.includes(mentions, mentionString)) {
                      var numInMsg = countArrayOccurences(mentions, mentionString);
                      if (this.state.mention.mentioned !== msgNode[0].key || this.state.mention.numInMsg < numInMsg) {
                        this.state.mention.notifyNum += 1;
                        mentionTotaler(function resetMentionNumCallback() {
                          this.state.mention.notifyNum = 0;
                        }.bind(this));
                        if (moment().unix() > appOpenTimestamp + 30) {
                          this.audioAlert.play();
                        }
                        this.state.mention.mentioned = msgNode[0].key;
                        this.state.mention.numInMsg = numInMsg;
                      }
                    }
                  }
                }
              });

            } // end after user data loaded

          });
          this.setState({ loginstate: true });

          //
          // END UPON LOGIN
          //
      } else {
          // console.log("Logged out");
          this.setState({ loginstate: false });
      }
    },
    presencePing: function() {
      // console.log("Sending presence ping...");
      // this.presenceRef.child('online').set(true);
      let timestamp = _.now();
      this.presenceRef.child('lastseen').set(timestamp);
      this.presenceRef.child('online').set(true);
    },
    logoutUser: function(){
        this.ref.unauth();
        location.reload();
    },
    handleRegister: function(desiredEml, desiredPw){
      sweetAlert({
        title: "Register",
        text: "Choose your username! (No spaces!)\nYou must be 18 years of age or older to register!",
        type: "input",
        showCancelButton: true,
        closeOnConfirm: false,
        animation: "slide-from-top",
        inputPlaceholder: "Username"
      }, function(inputValue){
        if (inputValue === false) return false;
        if (inputValue === "") {
          sweetAlert.showInputError("Error: Username is empty?");
          return false;
        }
        var desiredUn = inputValue.replace(/ /g, '');
        var userNameMaxLength = 20;
        if (desiredUn.length > userNameMaxLength) {
          emitUserError("Registration Error", "Desired username " + desiredUn + " is too long! The maximum length is " + userNameMaxLength + " characters");
          return false; //break function
        }
        var presenceRef = new Firebase(window.__env.firebase_origin + "/presence");
        presenceRef.once("value", function(snapshot){
          if (snapshot.child(desiredUn).exists()) {
            emitUserError("Registration Error", "Desired username " + desiredUn + " already exists!");
          } else {
            let regRef = new Firebase(window.__env.firebase_origin);
            regRef.createUser({
              email: desiredEml,
              password: desiredPw
            },function(error, userData){
              if (error) {
                switch (error.code) {
                  case "EMAIL_TAKEN":
                    emitUserError("Registration Error", "That email address is already registered: " + desiredEml);
                  break;
                  case "INVALID_EMAIL":
                    emitUserError("Registration Error", "That is not a valid email address: " + desiredEml);
                  break;
                  default:
                    emitUserError("Registration Error", "An unknown registration error occurred: " + error);
                }
              } else {
                var userRef = new Firebase(window.__env.firebase_origin + "/users/" + userData.uid);
                // create user entry
                userRef.set({
                  username: desiredUn,
                  inWaitlist: {
                    waiting: false
                  },
                  registered: Firebase.ServerValue.TIMESTAMP
                });
                // create presence entry
                presenceRef.child(desiredUn).child("uid").set(userData.uid);
                presenceRef.child(desiredUn).child("email").set(desiredEml);
                sweetAlert({
                  "title": "Registration Successful",
                  "text": "You have succesfully registered! Welcome " + desiredUn + "! You may now log in.",
                  "type": "success"
                }, function() {
                  location.reload();
                });
              }
            });

          }

        })

      });
    },
    ///////////////////////////////////////////////////////////////////////
    // CHAT
    ///////////////////////////////////////////////////////////////////////
    handleSendMsg: function(newMsgData) {
      if (this.state.banned === true) {
        emitUserError("Banned", "You can't do that, you're banned!");
        return;
      }

      var chatQueue = "queues/chat/tasks";

      var userAvatar;
      if (this.state.user.avatar) {
        userAvatar = this.state.user.avatar;
      } else {
        userAvatar = false;
      }

      let lastMsg = this.state.chat[this.state.chat.length - 1];
      if (!lastMsg) {
        base.push(chatQueue, {
          data: {
            user: newMsgData.user,
            uid: this.state.user.uid,
            avatar: userAvatar,
            msg: newMsgData.msg,
            isAddition: false
          }
        });
      }

      if (lastMsg.user === this.state.user.username) {

        base.push(chatQueue, {
          data: {
            user: newMsgData.user,
            uid: this.state.user.uid,
            avatar: userAvatar,
            msg: newMsgData.msg,
            isAddition: true,
            addToKey: lastMsg.key
          }
        });
      } else {
        base.push(chatQueue, {
          data: {
            user: newMsgData.user,
            uid: this.state.user.uid,
            avatar: userAvatar,
            msg: newMsgData.msg,
            isAddition: false
          }
        });
      }
    },
    ///////////////////////////////////////////////////////////////////////
    // PLAYLISTS
    ///////////////////////////////////////////////////////////////////////
    playlistsOpenToggle: function() {
      if (!this.state.playlistsOpen) {
        this.setState({ playlistsOpen: true });
      } else {
        this.setState({ playlistsOpen: false });
      }
    },
    playlistImport: function() {
      // var addNewPlaylist = this.addNewPlaylist;

      sweetAlert({
        title: "Import YouTube Playlist",
        text: "Input the YouTube playlist URL:",
        type: 'input',
        showCancelButton: true,
        closeOnConfirm: false,
        inputPlaceholder: "YouTube Playlist URL",
        showLoaderOnConfirm: true
      }, function(inputValue) {
        if (inputValue === false) {
          return false;
        }
        if (inputValue === '') {
            sweetAlert.showInputError('URL is empty!');
            return false;
        }

        var youtube = url.parse(inputValue);
        var query = querystring.parse(youtube.query);
        if (!query.list) {
          sweetAlert.showInputError('No playlist found in that URL!');
          return false;
        }
        if (query.list) {
          trYouTube.parsePlaylist(query.list, function(playlist) {
            // console.log(playlistItems);
            if (playlist.error) {
              sweetAlert.showInputError('YouTube API error! (Playlist not found.)');
              return false;
            }
            axios.all(playlist.items.map(function(item) {
              return axios.get('https://www.googleapis.com/youtube/v3/videos', {
                params: {
                  id: item.contentDetails.videoId,
                  part: 'contentDetails,snippet',
                  key: ytAPIkey
                }
              }).then(function(response) {
                return response.data.items[0];
              });
            })).then(function(response) {
              // console.log(response);
              var cleanItems = response.filter(function(item) {
                if (!item || item.snippet.title === 'Deleted video') {
                  // console.log('skipping', item);
                  return false;
                } else {
                  return true;
                }
              }).map(function(item) {
                return {
                    url: "https://www.youtube.com/watch?v=" + item.id,
                    title: item.snippet.title,
                    thumb: item.snippet.thumbnails.default.url,
                    channel: item.snippet.channelTitle,
                    duration: moment.duration(item.contentDetails.duration).valueOf()
                  }
              });
              // console.log(cleanItems);
              sweetAlert({
                title: "Import YouTube Playlist",
                text: "Choose a name for your new playlist:",
                type: 'input',
                showCancelButton: true,
                closeOnConfirm: false,
                inputPlaceholder: "Playlist Name",
                showLoaderOnConfirm: true
              }, function(inputValue) {
                if (inputValue === false) {
                  return false;
                }
                if (inputValue === '') {
                    emitUserError('Playlist Import Error', 'No name given!');
                    return false;
                }
                let currentAuth = base.getAuth();
                var newPlaylist = base.push('playlists/' + currentAuth.uid, {
                  data: { name: inputValue }
                });
                newPlaylist.child('entries').set(cleanItems, function() {
                  sweetAlert("Playlist Imported!", "Your new playlist "+ inputValue +" has been created!", "success");
                });
              });
            });
          });
        } else {
          //
        }
      });
    },
    searchForVideo: function(searchQuery) {
      axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          maxResults: '25',
          type: 'video',
          videoEmbeddable: 'true',
          key: ytAPIkey,
          q: searchQuery
        }
      }).then(function (response) {
          var search = response.data.items.map(function(data) {
            return data.id.videoId;
          }, this);
          var ids = "";
          search.forEach(function(currentValue) {
            ids += currentValue + ",";
          });
          axios.get('https://www.googleapis.com/youtube/v3/videos?id='+ ids +'&part=contentDetails,snippet&key='+ ytAPIkey, {
            params: {
              id: ids,
              part: 'contentDetails,snippet',
              key: ytAPIkey
            }
          }).then(function (response) {
              // console.log(response.data);
              this.setState({ currentSearch: {
                data: response.data,
                items: response.data.items
              } });
            }.bind(this));

        }.bind(this));
      this.setState({ playlistsPanelView: "search" });
    },
    addNewPlaylist: function() {
      let currentAuth = base.getAuth();
      // debugger;
      if (currentAuth === null) {
        emitUserError("Unable to Create Playlist", "You are not logged in!");
        return;
      }
      sweetAlert({
        title: "New Playlist",
        text: "Choose a name for your playlist!\n Note: Playlists will be limited to 20 characters.",
        type: "input",
        showCancelButton: true,
        closeOnConfirm: false,
        animation: "slide-from-top",
        inputPlaceholder: "Playlist Name"
      }, function(inputValue){
        if (inputValue) {
          let newPlaylistName = inputValue;
          let newPlaylistCallback = function() {
            sweetAlert({
              "title": "Playlist Created",
              "text": "Playlist " + newPlaylistName + " is now created!",
              "type": "success",
              timer: 3000
            });
          }
          base.push('playlists/' + currentAuth.uid, {
            data: { name: newPlaylistName },
            then(){
              newPlaylistCallback();
            }
          });
        } else {
          return;
        }
      });
    },
    removePlaylist: function(index) {
      // debugger;
      let currentAuth = base.getAuth();
      let copyofPlaylists = this.state.playlists.slice(); //get copy of array
      var playlistName = this.state.playlists[index].name;
      sweetAlert({
        title: "Are you sure?",
        text: "You are about to remove the playlist "+ playlistName +", are you sure?",
        type: "warning",
        showCancelButton: true,
        closeOnConfirm: false
      }, function(inputValue){
        if (inputValue) {
          // console.log("Removing playlist of index", index);
          copyofPlaylists.splice(index, 1); //remove item from copy of array
          base.post('playlists/' + currentAuth.uid, { data: copyofPlaylists }); //update Firebase
          sweetAlert({
            "title": "Playlist Removed",
            "text": "Playlist has been removed!",
            "type": "success",
            timer: 3000
          });
        } else {
          return;
        }
      });
      this.setState({
        currentPlaylist: {
          name: "",
          id: -1
        },
        playlistsPanelView: "blank"
      });
    },
    selectPlaylist: function(index) {
      let nameToSelect = this.state.playlists[index].name;
      let keyToSelect = this.state.playlists[index].key;
      if (nameToSelect.length > 23) {
        let maxLength = 23;
        nameToSelect = nameToSelect.substring(0,maxLength) + "...";
      }
      this.setState({
        currentPlaylist: {
          name: nameToSelect,
          id: index,
          key: keyToSelect
        }
      });

      clearTimeout(this.selPlaylistTimer);
      this.selPlaylistTimer = setTimeout(this.saveSelPlaylist, 5000);
      this.setState({ playlistsPanelView: "playlist" });
      this.updateMediaRequest();
    },
    saveSelPlaylist: function() {
      var updateMediaRequest = this.updateMediaRequest;
      base.post('users/'+this.state.user.uid+'/settings/playlists/selected', {
        data: this.state.currentPlaylist.id,
        then() {
          updateMediaRequest();
        }
      });
    },
    addToPlaylist: function(grabBool, searchIndex, grabPlaylistIndex) {
      let currentAuth = base.getAuth();
      if (!this.state.playlists[this.state.currentPlaylist.id]) {
        emitUserError("No Playlist Selected", "You don't have a playlist selected to add to!");
        return;
      }

      var itemToAdd
      var videoUrl;
      var videoTitle;
      var videoThumb;
      var videoChannel;
      var videoDuration;

      if (grabBool) {
        // grab from currently playing
        itemToAdd = this.state.playingMedia.info;
        videoUrl = itemToAdd.url;
        videoTitle = itemToAdd.title;
        videoThumb = itemToAdd.thumb;
        videoChannel = itemToAdd.channel;
        videoDuration = this.state.playingMedia.playback.duration * 1000; //seconds to miliseconds
      } else {
        // grab from search item
        itemToAdd = this.state.currentSearch.items[searchIndex];
        // console.log(itemToAdd);
        videoUrl = "https://www.youtube.com/watch?v=" + itemToAdd.id;
        videoTitle = itemToAdd.snippet.title;
        videoThumb = itemToAdd.snippet.thumbnails.default.url;
        videoChannel = itemToAdd.snippet.channelTitle;
        videoDuration = moment.duration(itemToAdd.contentDetails.duration).valueOf();
      }
      var objectToAdd = {
        url: videoUrl,
        title: videoTitle,
        thumb: videoThumb,
        channel: videoChannel,
        duration: videoDuration
      }
      var updateMediaRequest = this.updateMediaRequest;
      var playlistIdentifier = grabBool ? grabPlaylistIndex : this.state.currentPlaylist.id;
      var playlistEndptKey = grabBool ? this.state.playlists[grabPlaylistIndex].key : this.state.currentPlaylist.key;
      if (this.state.playlists[playlistIdentifier].entries instanceof Array) { // check if there's already an array there
        let copyofPlaylist = this.state.playlists[playlistIdentifier].entries.slice(); // get copy of array
        if (grabBool) {
          copyofPlaylist.push(objectToAdd); // push new item onto end of array
        } else {
          copyofPlaylist.unshift(objectToAdd); // push new item onto front of array
        }
        base.post('playlists/' + currentAuth.uid + "/" + playlistEndptKey + "/entries", { // push new array to Firebase
          data: copyofPlaylist,
          then(){
            updateMediaRequest();
          }
        });
      } else {
        base.post('playlists/' + currentAuth.uid + "/" + playlistEndptKey + "/entries", {
          data: [objectToAdd],
          then(){
            updateMediaRequest();
          }
        });
      }
      this.setState({ playlistsPanelView: "playlist" });
    },
    removeFromPlaylist: function(index){
      // console.log("Removing playlist item of index", index);
      let currentAuth = base.getAuth();
      let copyofPlaylist = this.state.playlists[this.state.currentPlaylist.id].entries.slice();
      copyofPlaylist.splice(index, 1); //remove item from copy of array
      var updateMediaRequest = this.updateMediaRequest;
      base.post('playlists/' + currentAuth.uid + "/" + this.state.currentPlaylist.key + "/entries", { //update Firebase
        data: copyofPlaylist,
        then(){
          if (index === 0) {
            updateMediaRequest();
          }
        }
      });

    },
    moveTopPlaylist: function(index){
      // console.log("Moving top", index);
      // let currentAuth = base.getAuth();
      let copyofPlaylist = this.state.playlists[this.state.currentPlaylist.id].entries.slice(); // get copy of array
      let movingItem = copyofPlaylist.splice(index, 1); // remove item from array
      // console.log(copyofPlaylist);
      // console.log("Moving item", movingItem);
      copyofPlaylist.unshift(movingItem[0]); // put item at front of array
      // console.log(copyofPlaylist);
      var updateMediaRequest = this.updateMediaRequest;
      base.post('playlists/' + this.state.user.uid + "/" + this.state.currentPlaylist.key + "/entries", {
        context: this,
        data: copyofPlaylist,
        then(){
          updateMediaRequest();
        }
      }); // push update to Firebase

    },
    shufflePlaylist: function() {
      if (this.state.currentPlaylist.id != -1 && this.state.playlists[this.state.currentPlaylist.id].entries) {
        var copyofPlaylist = this.state.playlists[this.state.currentPlaylist.id].entries.slice();
        var shuffledPlaylist = _.shuffle(copyofPlaylist);
        var updateMediaRequest = this.updateMediaRequest;
        base.post('playlists/' + this.state.user.uid + "/" + this.state.currentPlaylist.key + "/entries", {
          context: this,
          data: shuffledPlaylist,
          then(){
            updateMediaRequest();
          }
        });
      }
    },

    ///////////////////////////////////////////////////////////////////////
    // SIDEBAR CHANGER
    ///////////////////////////////////////////////////////////////////////
    changeSidebar: function(n) {
      this.setState({ currentSidebar: n });
    },



    ///////////////////////////////////////////////////////////////////////
    // VIDEO CONTROLS
    ///////////////////////////////////////////////////////////////////////
    updateVolume: function(value) {
      this.setState({
        controls: {
          volume: value,
          playing: this.state.controls.playing
        }
      });
      clearTimeout(this.volTimer);
      this.volTimer = setTimeout(this.volSave, 5000);

    },
    volumeNudge: function(direction) {
      var volInterval = 0.05;
      var newVol = this.state.controls.volume;
      if (direction === "up") {
        newVol += volInterval;
      } else {
        newVol -= volInterval;
      }
      this.updateVolume(newVol);
    },
    volSave: function() {
      var saveVol = this.state.controls.volume;
      if (saveVol < 0.05) {
        saveVol = 0.05
      }
      base.post('users/'+this.state.user.uid+'/settings/player/volume', {
        data: saveVol
      });
    },

    ///////////////////////////////////////////////////////////////////////
    // WAITLIST CONTROLS
    ///////////////////////////////////////////////////////////////////////
    toggleWaiting: function() {
      if (this.state.banned === true) {
        emitUserError("Banned", "You can't do that, you're banned!");
        return;
      }
      if (this.state.user.inWaitlist.waiting) {
        if (this.state.waitlist[0] && this.state.user.inWaitlist.id === this.state.waitlist[0].key) {
          var chatQueue = "queues/chat/tasks";
          base.push(chatQueue, {
            data: {
              user: this.state.user.username,
              uid: this.state.user.uid,
              msg: "/uskip",
              isAddition: false
            }
          });
          return;
        }
        if (this.state.user.inWaitlist.id != "") {
          var waitlistPlaceRef = new Firebase(window.__env.firebase_origin + "/waitlist/tasks/" + this.state.user.inWaitlist.id);
          waitlistPlaceRef.remove();
        }
        base.post('users/' + this.state.user.uid + '/inWaitlist',{
          data: {
            waiting: false,
            id: ""
          }
        });
      } else {
        var waitlistRef = new Firebase(window.__env.firebase_origin + "/waitlist/tasks");
        var currentPlaylistId;
        if (this.state.currentPlaylist.id === -1) {
          emitUserError("Join Waitlist Error", "You don't have a playlist selected!");
          return;
        } else {
          currentPlaylistId = this.state.currentPlaylist.id;
        }
        if (!this.state.playlists[currentPlaylistId].entries) {
          emitUserError("Join Waitlist Error", "Your playlist is empty!");
          return;
        }


        var userAvatar;
        if (this.state.user.avatar) {
          userAvatar = this.state.user.avatar;
        } else {
          userAvatar = false;
        }

        var waitlistId = waitlistRef.push({
          user: this.state.user.username,
          uid: this.state.user.uid,
          url: this.state.playlists[currentPlaylistId].entries[0].url,
          title: this.state.playlists[currentPlaylistId].entries[0].title,
          thumb: this.state.playlists[currentPlaylistId].entries[0].thumb,
          channel: this.state.playlists[currentPlaylistId].entries[0].channel,
          avatar: userAvatar,
          playlist: this.state.currentPlaylist.key
          }
        );


        var waitlistIdUrl = waitlistId.toString();

        var waitlistDiscRef = new Firebase(waitlistIdUrl);
        waitlistDiscRef.onDisconnect().remove();

        var waitlistIdExplode = waitlistIdUrl.split("/");

        var waitlistIdKey = waitlistIdExplode[waitlistIdExplode.length - 1];

        base.post('users/' + this.state.user.uid + '/inWaitlist', {
          data: {
            waiting: true,
            id: waitlistIdKey
          }
        });
      }
    },
    updateMediaRequest: function() {
      if (this.state.user.inWaitlist.waiting === true) {
        var userAvatar;
        if (this.state.user.avatar) {
          userAvatar = this.state.user.avatar;
        } else {
          userAvatar = false;
        }
        var currentPlaylistId;
        if (this.state.currentPlaylist.id === -1) {
          return;
        } else {
          currentPlaylistId = this.state.currentPlaylist.id;
        }
        if (!this.state.playlists[currentPlaylistId].entries) {
          return;
        }
        var taskEndpt = 'waitlist/tasks/' + this.state.user.inWaitlist.id;
        base.fetch(taskEndpt, {
          context: this,
          then(data){
            if (data && !data._state) {
              base.post(taskEndpt, {
                context: this,
                data: {
                  user: this.state.user.username,
                  uid: this.state.user.uid,
                  url: this.state.playlists[currentPlaylistId].entries[0].url,
                  title: this.state.playlists[currentPlaylistId].entries[0].title,
                  thumb: this.state.playlists[currentPlaylistId].entries[0].thumb,
                  channel: this.state.playlists[currentPlaylistId].entries[0].channel,
                  avatar: userAvatar,
                  playlist: this.state.currentPlaylist.key
                }
              });
            }
          }
        });
      }
    },

    ///////////////////////////////////////////////////////////////////////
    // VIDEO DATA HANDLING
    ///////////////////////////////////////////////////////////////////////
    videoOnProgress: function(progress) {
      this.setState({
        localPlayerPos: {
          position: progress.played
        }
      });
    },

    ///////////////////////////////////////////////////////////////////////
    // FEEDBACK BUTTONS
    ///////////////////////////////////////////////////////////////////////
    handleGrabButton: function(index) {
      if (this.state.user.uid) {
        base.push('queues/feedback/tasks', {
          data: {type: 'grab', user: this.state.user.uid}
        });
        this.setState({userFeedback: {
          opinion: this.state.userFeedback.opinion,
          grab: true
        }});
        this.addToPlaylist(true, false, index);
      }
    },
    handleLikeButton: function() {
      if (this.state.banned === true) {
        emitUserError("Banned", "You can't do that, you're banned!");
        return;
      }
      if (this.state.user.uid) {
        base.push('queues/feedback/tasks', {
          data: {type: 'like', user: this.state.user.uid}
        });
        this.setState({userFeedback: {
          opinion: "like",
          grab: this.state.userFeedback.grab
        }});
      }
    },
    handleDislikeButton: function() {
      if (this.state.banned === true) {
        emitUserError("Banned", "You can't do that, you're banned!");
        return;
      }
      if (this.state.user.uid) {
        base.push('queues/feedback/tasks', {
          data: {type: 'dislike', user: this.state.user.uid}
        });
        this.setState({userFeedback: {
          opinion: "dislike",
          grab: this.state.userFeedback.grab
        }});
      }
    },
    ///////////////////////////////////////////////////////////////////////
    // USER PROFILE
    ///////////////////////////////////////////////////////////////////////
    setAvatar: function() {
      var uid = this.state.user.uid;
      var username = this.state.user.username;
      sweetAlert({
        title: "Set Your Avatar",
        text: "Give us the link (URL) to your custom avatar here:",
        type: "input",
        inputPlaceholder: "https://i.imgur.com/iTanI13.gif",
        showCancelButton: true,
        closeOnConfirm: false,
        showLoaderOnConfirm: true
      }, function(inputValue) {
        if (inputValue === false) return false;
        if (inputValue === '') {
          sweetAlert.showInputError("Error: No avatar found.");
          return false;
        }
        if (inputValue) {
          var cleanInput = inputValue.replace(/.*?:\/\//g, "");
          base.post("users/" + uid + "/avatar", {
            data: cleanInput,
            then() {
              base.post("presence/" + username + "/avatar", {
                data: cleanInput,
                then() {
                  setTimeout(function() {
                    sweetAlert("Avatar set!");
                  }, 1000);
                }
              });

            }
          });
        }
      });
    },
    toggleSize: function() {
      if (!this.state.user.playerSize) {
        base.post('users/' + this.state.user.uid + '/playerSize', {
          data: true
        });
      } else {
        base.post('users/' + this.state.user.uid + '/playerSize', {
          data: false
        });
      }
    },
    ///////////////////////////////////////////////////////////////////////
    // RENDER
    ///////////////////////////////////////////////////////////////////////
    render: function(){
      return (
          <div>
              <Nav
                loginstate={this.state.loginstate}
                loginhandler={this.authenticateUser}
                logouthandler={this.logoutUser}
                logindata={this.state.user}
                handleRegister={this.handleRegister}
                devCheck={this.state.devCheck}
                setAvatar={this.setAvatar}
                toggleSize={this.toggleSize}
              />
            {/* Start Container */}
              <div className="container-fluid">
                  <div className="row">
            {/* Video Component */}
                      <div className="col-lg-9 col-md-9 col-sm-9 col-xs-9 no-float" id="videotoplevel">
                          <div id="vidcontainer" className="">
                            <Video
                              controls={this.state.controls}
                              playingMedia={this.state.playingMedia}
                              videoOnProgress={this.videoOnProgress}
                              localPlayerPos={this.state.localPlayerPos.position}
                              user={this.state.user}
                              />
                          </div>
                          <div id="playlists-container">
                            <Playlists
                              playlistsOpen={this.state.playlistsOpen}
                              playlistsOpenToggle={this.playlistsOpenToggle}
                              searchForVideo={this.searchForVideo}
                              playlistsPanelView={this.state.playlistsPanelView}
                              currentSearch={this.state.currentSearch}
                              addNewPlaylist={this.addNewPlaylist}
                              playlists={this.state.playlists}
                              currentPlaylist={this.state.currentPlaylist}
                              removePlaylist={this.removePlaylist}
                              selectPlaylist={this.selectPlaylist}
                              addToPlaylist={this.addToPlaylist}
                              removeFromPlaylist={this.removeFromPlaylist}
                              moveTopPlaylist={this.moveTopPlaylist}
                              updateVolume={this.updateVolume}
                              controls={this.state.controls}
                              playingMedia={this.state.playingMedia}
                              inWaitlist={this.state.user.inWaitlist}
                              toggleWaiting={this.toggleWaiting}
                              handleLikeButton={this.handleLikeButton}
                              handleDislikeButton={this.handleDislikeButton}
                              handleGrabButton={this.handleGrabButton}
                              userFeedback={this.state.userFeedback}
                              volumeNudge={this.volumeNudge}
                              shufflePlaylist={this.shufflePlaylist}
                              waitlist={this.state.waitlist}
                              user={this.state.user}
                              playlistImport={this.playlistImport}
                               />
                          </div>
                      </div>
            {/* Chat Component */}
                      <div className="col-lg-3 col-md-3 col-sm-3 col-xs-3 no-float" id="chattoplevel" >
                        <Sidebar
                          loginData={this.state.user}
                          chatData={this.state.chat}
                          sendMsg={this.handleSendMsg}
                          loginState={this.state.loginstate}
                          currentSidebar={this.state.currentSidebar}
                          changeSidebar={this.changeSidebar}
                          userPresence={this.state.userPresence}
                          waitlist={this.state.waitlist}
                          staff={this.state.staff}
                          chatlock={this.state.chatlock}
                          />
                      </div>
            {/* End Container */}
                  </div>
                </div>
      </div>
    )
  }
});

export default Main;

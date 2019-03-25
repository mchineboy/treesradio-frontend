import {observable, computed, autorun} from "mobx";
import toast from "utils/toast";
import fbase from "libs/fbase";
import profile from "stores/profile";
// import ax from 'utils/ax';
import moment from "moment";
import {padStart} from "lodash";
// import events from 'stores/events';
import playlists from "stores/playlists";
import {send} from "libs/events";

import spacePineapples from "img/spacepineapples.jpg";

const PLAYER_SYNC_CAP = 20; //seconds on end of video to ignore syncing
const PLAYER_SYNC_SENSITIVITY = 30; //seconds
export const VOLUME_NUDGE_FRACTION = 0.05; // out of 1

export default new class Playing {
  constructor() {
    this.fbase = fbase;

    localforage.getItem("volume").then(v => (v ? (this.volume = v) : false));
    localforage.getItem("playerSize").then(s => (s ? (this.playerSize = s) : false));

    autorun(() => {
      fbase
        .database()
        .ref("playing")
        .on("value", snap => {
          var data = snap.val();
          if (data) {
            this.data = data;
          }
        });
      this.localLikeState = this.liked;
      this.localDislikeState = this.disliked;
      this.localGrabState = this.grabbed;
    });
  }

  @observable data = {
    info: {},
    feedback: {},
    feedback_users: {
      likes: [],
      dislikes: [],
      grabs: []
    }
  };

  @computed get humanDuration() {
    var mo = moment.duration(this.data.info.duration, "milliseconds");
    var str = `${padStart(mo.minutes(), 2, "0")}:${padStart(mo.seconds(), 2, "0")}`;
    if (mo.hours() > 0) {
      str = `${padStart(mo.hours(), 2, "0")}:` + str;
    }
    return str;
  }

  @computed get humanCurrent() {
    var mo = moment.duration(this.playerSeconds, "seconds");
    var str = `${padStart(mo.minutes(), 2, "0")}:${padStart(mo.seconds(), 2, "0")}`;
    if (mo.hours() > 0) {
      str = `${padStart(mo.hours(), 2, "0")}:` + str;
    }
    return str;
  }

  @computed get time() {
    //SECONDS
    if (!this.data.time || !this.data.info.duration || !this.data.playing) {
      return 0;
    } else {
      return this.data.time;
    }
  }

  @computed get elapsed() {
    return this.time;
  }

  @computed get fraction() {
    if (!this.data.time || !this.data.info.duration) {
      return 0;
    }
    return this.data.time / (this.data.info.duration / 1000);
  }

  @observable playerProgress = 0; //fraction (0.12, 0.57, etc.)

  @observable playerDuration = 0; //seconds

  @computed get playerSeconds() {
    return this.playerDuration * this.playerProgress;
  }

  @computed get shouldSync() {
    if (!this.data.time || !this.data.info.duration || !this.data.playing) {
      return false;
    }
    var serverSeconds = this.time;
    var durationSeconds = this.data.info.duration / 1000;
    var cap = durationSeconds - PLAYER_SYNC_CAP;
    if (serverSeconds > cap) {
      return false;
    }
    var slow = serverSeconds - PLAYER_SYNC_SENSITIVITY;
    var fast = serverSeconds + PLAYER_SYNC_SENSITIVITY;
    var player = this.playerSeconds;
    if (player < slow || player > fast) {
      return true;
    }
    return false;
  }

  @observable volume = 0.15;

  setVolume(v) {
    this.volume = v;
    localforage.setItem("volume", v);
  }

  nudgeVolume(dir) {
    if (dir === "UP") {
      this.setVolume(this.volume + VOLUME_NUDGE_FRACTION);
    } else if (dir === "DOWN") {
      this.setVolume(this.volume - VOLUME_NUDGE_FRACTION);
    }
  }

  @observable localLikeState = false;
  @computed get likeLoading() {
    return this.localLikeState !== this.liked;
  }

  like() {
    // reset our state if the user clicks again while loading
    if (this.likeLoading) {
      this.localLikeState = this.liked;
      return;
    }

    if (this.liked) {
      toast.error("You've already liked this song!");
      return false;
    }
    send("like");
    this.localLikeState = true;
  }

  @observable localDislikeState = false;
  @computed get dislikeLoading() {
    return this.localDislikeState !== this.disliked;
  }

  dislike() {
    // reset our state if the user clicks again while loading
    if (this.dislikeLoading) {
      this.localDislikeState = this.disliked;
      return;
    }

    if (this.disliked) {
      toast.error("You've already disliked this song!");
    }
    send("dislike");
    this.localDislikeState = true;
  }

  @observable localGrabState = false;
  @computed get grabLoading() {
    return this.localGrabState !== this.grabbed;
  }

  grab(playlistKey) {
    playlists.addSong(this.data.info, playlistKey, true);
    if (!this.grabbed) {
      send("grab");
      // this.localGrabState = true;
    }
  }

  @computed get liked() {
    if (!this.data.feedback_users || !this.data.feedback_users.likes || !profile.user) {
      return false;
    }
    if (this.data.feedback_users.likes.includes(profile.user.uid)) {
      return true;
    } else {
      return false;
    }
  }

  @computed get disliked() {
    if (!this.data.feedback_users || !this.data.feedback_users.dislikes || !profile.user) {
      return false;
    }
    if (this.data.feedback_users.dislikes.includes(profile.user.uid)) {
      return true;
    } else {
      return false;
    }
  }

  @computed get grabbed() {
    if (!this.data.feedback_users || !this.data.feedback_users.grabs || !profile.user) {
      return false;
    }
    if (this.data.feedback_users.grabs.includes(profile.user.uid)) {
      return true;
    } else {
      return false;
    }
  }

  @computed get likes() {
    if (!this.data.feedback || !this.data.feedback.likes) {
      return 0;
    }
    return this.data.feedback.likes;
  }

  @computed get dislikes() {
    if (!this.data.feedback || !this.data.feedback.dislikes) {
      return 0;
    }
    return this.data.feedback.dislikes;
  }

  @computed get grabs() {
    if (!this.data.feedback || !this.data.feedback.grabs) {
      return 0;
    }
    return this.data.feedback.grabs;
  }

  @observable playerSize = "BIG";

  togglePlayerSize() {
    if (this.playerSize === "BIG") {
      this.playerSize = "SMALL";
    } else if (this.playerSize === "SMALL") {
      this.playerSize = "BIG";
    }
    localforage.setItem("playerSize", this.playerSize);
  }

  @observable backgroundImage = spacePineapples;
}();

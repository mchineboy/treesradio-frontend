import {observable, computed, toJS} from 'mobx';
import toast from 'utils/toast';
import fbase from 'libs/fbase';
import profile from 'stores/profile';
import ax from 'utils/ax';
import moment from 'moment';
import _ from 'lodash';
import localforage from 'localforage';
import events from 'stores/events';

const PLAYER_SYNC_CAP = 20; //seconds on end of video to ignore syncing
const PLAYER_SYNC_SENSITIVITY = 30; //seconds

export default new class Playing {
  constructor() {
    this.fbase = fbase;
    fbase.database().ref('playing').on('value', (snap) => {
      var data = snap.val();
      if (data) {
        this.data = data;
      }
    });
    localforage.getItem('volume').then(v => v ? this.volume = v : false);
    events.register('new_song', () => this.feedback = []);
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
    var mo = moment.duration(this.data.info.duration, 'milliseconds');
    var str = `${_.padStart(mo.minutes(), 2, '0')}:${_.padStart(mo.seconds(), 2, '0')}`;
    if (mo.hours() > 0) {
      str = `${_.padStart(mo.hours(), 2, '0')}:`+str;
    }
    return str;
  }

  @computed get humanCurrent() {
    var mo = moment.duration(this.playerSeconds, 'seconds');
    var str = `${_.padStart(mo.minutes(), 2, '0')}:${_.padStart(mo.seconds(), 2, '0')}`;
    if (mo.hours() > 0) {
      str = `${_.padStart(mo.hours(), 2, '0')}:`+str;
    }
    return str;
  }

  @computed get elapsed() {
    if (!this.data.time || !this.data.info.duration || !this.data.playing) {
      return 0;
    }
    return this.data.info.duration - this.data.time;
  }

  @computed get fraction() {
    if (!this.data.time || !this.data.info.duration) {
      return 0;
    }
    return this.elapsed / this.data.info.duration;
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
    var serverSeconds = this.elapsed / 1000;
    var durationSeconds = this.data.info.duration / 1000;
    var cap = durationSeconds - PLAYER_SYNC_CAP;
    if (serverSeconds > cap) {
      return false;
    }
    var slow = serverSeconds - PLAYER_SYNC_SENSITIVITY;
    var fast = serverSeconds + PLAYER_SYNC_SENSITIVITY;
    var player = this.playerSeconds;
    // console.log('player', this.playerSeconds, 'server', serverSeconds);
    if (player < slow || player > fast) {
      return true;
    }
  }

  @observable volume = 0.15;

  setVolume(v) {
    this.volume = v;
    localforage.setItem('volume', v);
  }

  nudgeVolume(dir) {
    if (dir === 'UP') {
      this.setVolume(this.volume + 0.01);
    } else if (dir === 'DOWN') {
      this.setVolume(this.volume - 0.01);
    }
  }

  @observable feedback = []

  sendFeedback(type) {
    if (this.feedback.includes(type)) {
      return false;
    }
    ax.post('/feedback/send', {type}).then(resp => {
      if (resp.data && resp.data.error) {
        toast.error(resp.data.error);
      }
      this.feedback.push(type);
    });
  }

  like() {
    this.sendFeedback('like');
  }

  dislike() {
    this.sendFeedback('dislike');
  }

  grab() {
    // send grab to playlist
    this.sendFeedback('grab');
  }

  @computed get liked() {
    return this.feedback.includes('like');
    // if (!this.data.feedback_users || !this.data.feedback_users.likes || !profile.user) {
    //   return false;
    // }
    // if (this.data.feedback_users.likes.includes(profile.user.uid)) {
    //   return true;
    // } else {
    //   return false;
    // }
  }

  @computed get disliked() {
    return this.feedback.includes('dislike');
    // if (!this.data.feedback_users || !this.data.feedback_users.dislikes || !profile.user) {
    //   return false;
    // }
    // if (this.data.feedback_users.dislikes.includes(profile.user.uid)) {
    //   return true;
    // } else {
    //   return false;
    // }
  }

  @computed get grabbed() {
    return this.feedback.includes('grab');
    // if (!this.data.feedback_users || !this.data.feedback_users.grabs || !profile.user) {
    //   return false;
    // }
    // if (this.data.feedback_users.grabs.includes(profile.user.uid)) {
    //   return true;
    // } else {
    //   return false;
    // }
  }
}
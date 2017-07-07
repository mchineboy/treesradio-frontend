import {observable, computed, autorunAsync} from "mobx";
import fbase from "libs/fbase";
import getUsername from "libs/username";
import playing from "stores/playing";
import {getRank,getAllRanks} from "libs/rank";
import _ from 'underscore';

export default new class Online {
  constructor() {
    this.fbase = fbase;

    fbase.database().ref("presence").on("value", snap => {
      let list = [];
      const user = snap.val();

      for (let uid in user) {
        list.push({uid});
      }

      this.list = list;
    });

    autorunAsync(
      () => {
        // async list updates
        this.usernames = [];
        this.list.forEach(async user => {
          this.usernames.push(await getUsername(user.uid));
        });
      },
      5000
    );
  }

  @observable list = [];
  @observable usernames = [];

  @computed get listWithFeedback() {
    const feedbackUsers = playing.data.feedback_users;
    let userlist = [];

    getAllRanks((allRanks) => {
        return this.list.forEach(u => {
          let user = {...u};
          if (feedbackUsers) {
            if (feedbackUsers.likes && feedbackUsers.likes.includes(user.uid)) {
              user.liked = true;
            }
            if (feedbackUsers.dislikes && feedbackUsers.dislikes.includes(user.uid)) {
              user.disliked = true;
            }
            if (feedbackUsers.grabs && feedbackUsers.grabs.includes(user.uid)) {
              user.grabbed = true;
            }
          }
          user.rank = allRanks[user.uid] || 'User';
          userlist.push(user);
        });
    });

    // This is not always consistently working. And I don't know why.
    userlist.sort(
        function (a,b) {
          if ( a.rank > b.rank ) return -1;
          if ( b.rank > a.rank ) return 1;
          return 0;
        }
    );

    return userlist;
  }

  @computed get onlineCount() {
    return this.list.length;
  }

  @computed get uids() {
    return this.list.map(u => u.uid);
  }

}();

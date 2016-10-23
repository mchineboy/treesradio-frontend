import React from 'react';
import {observable} from 'mobx';
import {observer} from 'mobx-react';
// import fbase from 'stores/fbase';
import chat from 'stores/chat';
import profile from 'stores/profile';
import toast from 'utils/toast';

// const noop = () => {};

export default @observer class ChatSend extends React.Component {

  // @observable msg = '';

  // onKeyDown(e) {
  //   console.log('keyDown', e);
  // }
  //
  // onKeyUp(e) {
  //   console.log('keyUp', e);
  // }

  onKeyPress(e) {
    var key = e.keyCode || e.which;
    if (key == 13) {
      if (chat.mentionMatches.length > 0) {
        chat.replaceMention(0);
      } else {
        chat.pushMsg();
      }
    }
  }

  onChange(e) {
    // console.log('onChange', e);
    if (!profile.user) {
      toast.error('You must be logged in to chat!');
    } else {
      chat.updateMsg(e.target.value);
    }
  }

  render() {
    var matchContainer;

    if (chat.mentionMatches.length > 0) {
      var matches = chat.mentionMatches.map((m, i) => {
        return <span key={i} className="mention-item" onClick={() => chat.replaceMention(i)}>@{m}<br/></span>;
      })
      matchContainer = (
        <div className="mentions-container">
          {matches}
        </div>
      );
    }

    return (
      <div>
        {matchContainer}
        <div id="sendbox">
          <input
            type="text"
            placeholder="enter to send"
            id="chatinput"
            className="form-control"
            value={chat.msg}
            onKeyPress={e => this.onKeyPress(e)}
            onChange={e => this.onChange(e)}
          />
        </div>
      </div>
    );
  }
}

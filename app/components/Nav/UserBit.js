import React from "react";
import {observer} from "mobx-react";
import {computed, observable} from "mobx";
import classNames from "classnames";

import profile from "stores/profile";
import playing from "stores/playing";
import HelpList from "stores/help";

import imageWhitelist, {allowedDomains} from "libs/imageWhitelist";
import UserAvatar from "components/utility/User/UserAvatar";
import waitlist from "stores/waitlist";
import $ from "jquery";
import Modal from "components/utility/Modal";
import {toast} from "react-toastify";

@observer
export default class UserBit extends React.Component {

    onEnterKey(e, cb) {
        var key = e.keyCode || e.which;
        if (key === 13) {
            cb();
        }
    }

    addUsername() {
        profile.updateUsername(this._username.value.substr(0, 24));
    }


    @observable
    legacyInterface = false;

    @observable
    gifsHidden = false;

    @observable
    showHelp = false;

    @observable
    settingAvatar = false;
    @observable
    avatarField = "";

    @observable
    changingPassword = false;

    @observable
    changingEmail = false;

    @computed
    get avatarFieldValid() {
        return this.avatarField && imageWhitelist(this.avatarField);
    }

    changePassword() {
        const password = this._newPassword.value;
        this._newPassword.value = "";
        profile.changePassword(password).then(res => !!res && (this.changingPassword = false));
    }

    changeEmail() {
        const email = this._newEmail.value;
        this._newEmail.value = "";
        profile.changeEmail(email).then(res => !!res && (this.changingEmail = false));
    }

    toggleNotifications() {
        profile.notifications ? (profile.notifications = false) : (profile.notifications = true);
    }

    toggleShowMute() {
        profile.showmuted ? (profile.showmuted = false) : (profile.showmuted = true);
    }

    toggleInterface() {
        this.legacyInterface ? (this.legacyInterface = false) : (this.legacyInterface = true);
    }

    hideBlazebot() {
        profile.hideBlazebot ? (profile.hideBlazebot = false) : (profile.hideBlazebot = true);
    }

    toggleHelp() {
        this.showHelp ? (this.showHelp = false) : (this.showHelp = true);
    }

    hideGifs() {
        if (this.gifsHidden === false) {
            $("<div id='hidegifs' />")
                .html(
                    '&shy;<style>span.chat-text p img[src$=".gif"] { display: none; } span.chat-text p img[src$=".gifv"] {display: none;}</style>'
                )
                .appendTo("body");
            this.gifsHidden = true;
        } else {
            $("#hidegifs").remove();
            this.gifsHidden = false;
        }
    }

    logoutAndDisableButtons() {
        profile.logout().then(function () {
            let buttons = document.querySelectorAll('disabledNoLogin');

            for (let i = 0; i < buttons.length; i++) {
                buttons[i].classList.add('greyDisabled');
            }
        });
    }

    disableIfNecessary() {
        return this.userLoggedIn() ? "" : " greyDisabled";
    }


    render() {
        let emailVerificationResendIcon;
        if (profile.resendVerificationLoading) {
            emailVerificationResendIcon = (
                <span>
            <i className="fa fa-spin fa-circle-o-notch"/>
          </span>
            );
        } else if (profile.resendVerificationResult) {
            emailVerificationResendIcon = (
                <span>
            <i className="fa fa-check"/>
          </span>
            );
        }

        let resendVerification;

        if (profile.unverified && profile.user !== null) {
            resendVerification = (
                <Modal
                    show={profile.unverified}
                    hideModal={profile === null || !profile.unverified}
                    title="Please Verify Your Email"
                    noClose={true}
                >
                    <p>
                        Your email hasn&apos;t been verified yet! Please click the link in the activation
                        email that was sent to your address or use one of the buttons below to help you.
                    </p>
                    <button className="btn btn-primary" onClick={() => window.location.reload()}>
                        Re-check Verification Status
                    </button>
                    <button className="btn btn-info" onClick={() => profile.resendVerification()}>
                        Re-send Verification Email {emailVerificationResendIcon}
                    </button>
                </Modal>
            );
        } else {
            resendVerification = "";
        }

        // if (profile.user !== null) {
        //     let resendVerification = "";
        // } else {
        //     let resendVerification = (
        //
        //     );
        // }

        const helpCommands = [];
        const allUserCommands = [
            "join",
            "toke",
            "em",
            "me",
            "spirittoke",
            "gif",
            "gelato",
            "score",
            "leaderboard",
            "roll",
            "timelimit",
            "spooky",
            "joint",
            "duckhunt",
            "bang",
            "friend",
            "save",
            "hype",
            "t"
        ];
        if (HelpList.helpCommands !== undefined)
            HelpList.helpCommands.forEach((item, key, map) => {
                if (
                    profile.rankPermissions.admin === true ||
                    (profile.rankPermissions.commands && profile.rankPermissions.commands.includes(key)) ||
                    allUserCommands.indexOf(key) !== -1
                )
                    helpCommands.push(
                        <tr>
                            <td>
                                /{key} {item.helpstring.split(" -- ")[0].replace(/^\/(\w+)\s/, " ")}
                            </td>
                            <td>{item.helpstring.split(" -- ")[1]}</td>
                        </tr>
                    );
            });
        return (
            <div id="userbit-wrapper">
                <div id="userbitContainer" className="btn-group">
                    <a className={"btn btn-primary" + this.disableIfNecessary()} id="usernametop">
                        <div className="userbit-avatar">
                            {this.showAvatar()}
                        </div>
                        <span id="username" className={"userLevel"}>
                <b>{profile.safeUsername}</b>
              </span>
                    </a>
                    <a
                        className={"btn btn-primary dropdown-toggle" + this.disableIfNecessary()}
                        id="usernamedropdown"
                        data-toggle="dropdown"
                    >
                        <span className="fa fa-caret-down" id="userbit-expander"/>
                    </a>
                    <ul className="dropdown-menu">
                        {this.showSetAvatar()}
                        <li onClick={() => (playing.togglePlayerSize())}>
                            <a href="#">
                                <i
    className={classNames(
        "fa",
        playing.playerSize === "BIG" ? "fa-compress" : "fa-expand"
    )}
    />
                                {playing.playerSize === "BIG" ? " Collapse Player" : " Expand Player"}
                            </a>
                        </li>
                        {this.showChangeEmail()}
                        {this.showChangePassword()}
                        <li>
                            <a
                                href={`https://polsy.org.uk/stuff/ytrestrict.cgi?ytid=${playing.data.info.url}`}
                                target="blank"
                            >
                                <i className="fa fa-youtube-play"/> Region Check
                            </a>
                        </li>
                        <li onClick={() => this.hideGifs()}>
                            <a href="#">
                                <i
    className={classNames(
        "fa",
        this.gifsHidden === true ? "fa-check-square-o" : "fa-square-o"
    )}
    />{" "}
                                Hide Gifs?
                            </a>
                        </li>
                        <li onClick={() => this.hideBlazebot()}>
                            <a href="#">
                                <i
    className={classNames(
        "fa",
        profile.hideBlazebot === true ? "fa-check-square-o" : "fa-square-o"
    )}
    />{" "}
                                Hide BlazeBot?
                            </a>
                        </li>
                        {this.showMentionAudio()}
                        {this.showMute()}
                        {this.showAutoplay()}
                        {this.showLogout()}
                        <li onClick={() => this.toggleHelp()}>
                            <a href="#">
                                <i className="fa fa-question-circle"/> Help
                            </a>
                        </li>
                        <li onClick={() => this.toggleInterface()}>
                            <a href="#">
                                <i
    className={classNames(
        "fa",
        this.legacyInterface === true ? "fa-check-square-o" : "fa-square-o"
    )}
    />{" "}
                                Gelato?
                            </a>
                        </li>
                    </ul>
                </div>
                {/*  */}
                {/* LOGGED-IN MODALS */}
                {/*  */}
                {/* Missing Username Modal */}
                <Modal
                    show={profile.noName}
                    hideModal={!profile.noName}
                    title="Missing Username"
                    noClose={true}
                    leftButton={() => this.addUsername()}
                    leftButtonText="Go!"
                >
                    <p>
                        We&apos;re missing a username for you! Please choose one. This will be your permanent
                        username, so choose wisely!
                    </p>
                    <input
                        className="form-control"
                        type="text"
                        maxLength={24}
                        ref={c => (this._username = c)}
                        onKeyPress={e => this.onEnterKey(e, () => this.addUsername())}
                        placeholder="Username"
                    />
                </Modal>
                {/*  */}
                {/* Show Help */}
                {/*  */}
                <Modal
                    show={this.showHelp}
                    hideModal={() => {
                        this.toggleHelp();
                    }}
                    title="Blazebot Commands"
                    noClose={false}
                >
                    <p>Note that all commands may not be available.</p>
                    <table>{helpCommands}</table>
                </Modal>

                {resendVerification}
                {/*  */}
                {/* Avatar Setting Modal */}
                {/*  */}
                <Modal
                    show={this.settingAvatar}
                    hideModal={() => {
                        this.settingAvatar = false;
                    }}
                    title="Set Your Avatar"
                >
                    <p>Avatars must be hosted at one of the following sites:</p>
                    <ul>
                        {allowedDomains.map((d, i) => (
                            <li key={i}>{d}</li>
                        ))}
                    </ul>
                    <hr/>
                    <div className="row">
                        <div className="col-md-8">
                            <div className="form-group">
                                <label>Avatar URL</label>
                                <div className="input-group">
                                    <input
                                        className="form-control"
                                        placeholder="e.g. http://i.imgur.com/1y3IemI.gif"
                                        onChange={e => (this.avatarField = e.target.value)}
                                    />
                                    <div className="input-group-addon">
                                        <i className={this.avatarFieldValid ? "fa fa-check" : "fa fa-times"}></i>
                                    </div>
                                </div>
                                <br/>
                                <div className="btn-group">
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => profile.setAvatar(this.avatarField)}
                                    >
                                        Set Avatar
                                    </button>
                                    <button className="btn" onClick={() => profile.clearAvatar()}>
                                        Clear Avatar
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <UserAvatar
                                uid={profile.uid}
                                className="user-avatar-preview"
                                imgClass="user-avatar-preview-img"
                            />
                        </div>
                    </div>
                </Modal>
                {/*  */}
                {/* Changing Password Modal */}
                {/*  */}
                <Modal
                    show={this.changingPassword}
                    hideModal={() => (this.changingPassword = false)}
                    title="Change Your Password"
                >
                    <div className="form-group">
                        <label>New Password</label>
                        <input className="form-control" type="password" ref={c => (this._newPassword = c)}/>
                    </div>
                    <br/>
                    <div>
                        <button className="btn btn-primary" onClick={() => this.changePassword()}>
                            Change Password
                        </button>
                    </div>
                </Modal>
                {/*  */}
                {/* Changing Email Modal */}
                {/*  */}
                <Modal
                    show={this.changingEmail}
                    hideModal={() => (this.changingEmail = false)}
                    title="Change Your Email"
                >
                    <div className="form-group">
                        <label>New Email</label>
                        <input className="form-control" type="email" ref={c => (this._newEmail = c)}/>
                    </div>
                    <br/>
                    <div>
                        <button className="btn btn-primary" onClick={() => this.changeEmail()}>
                            Change Email
                        </button>
                    </div>
                </Modal>
            </div>
        );
    }

    showMute() {
        return profile.rank && profile.rank.match(/Admin|Mod|Dev/) ?
            (
                <li onClick={() => this.toggleShowMute()}>
                    <a href="#">
                        <i
    className={classNames(
        "fa",
        profile.showmuted ? "fa-check-square-o" : "fa-square-o"
    )}
    />{" "}
                        Show Muted Users
                    </a>
                </li>
            ) : (
                <li></li>
            )
    }

    showMentionAudio() {
        return this.userLoggedIn() ? (<li onClick={() => this.toggleNotifications()}>
                <a href="#">
                    <i
    className={classNames(
        "fa",
        profile.notifications === true ? "fa-check-square-o" : "fa-square-o"
    )} reset
    />{" "}
                    Mention Audio?
                </a>
            </li>
        ) : (
            <li></li>
        );
    }

    triggerIfLoggedIn(action, errorMessage) {
        return this.userLoggedIn() ? action : () => (toast.error(errorMessage));
    }

    userLoggedIn() {
        return profile.user !== null;
    }

    showAutoplay() {
        return profile.rank && profile.rank !== "User" ? (
            <li onClick={() => waitlist.setAutojoin()}>
                <a href="#">
                    <i
    className={classNames("fa", profile.autoplay ? "fa-check-square-o" : "fa-square-o")}
    />{" "}
                    Auto Join Waitlist
                </a>
            </li>
        ) : (
            <li></li>
        )
    }

    showLogout() {
        return this.userLoggedIn() ? (
            <li onClick={() => this.logoutAndDisableButtons()}>
                <a href="#">
                    <i className="fa fa-sign-out"/> Logout
                </a>
            </li>
        ) : (
            <li></li>
        )
    }

    showChangePassword() {
        return this.userLoggedIn() ? (
            <li onClick={this.triggerIfLoggedIn(() => (this.changingPassword = true), "Log in to change Password")}>
                <a href="#">
                    <i className="fa fa-key"/> Change Password
                </a>
            </li>
        ) : (
            <li/>
        )
    }

    showChangeEmail() {
        return this.userLoggedIn() ? (
            <li onClick={this.triggerIfLoggedIn(() => (this.changingEmail = true), "log in to change Email")}>
                <a href="#">
                    <i className="fa fa-envelope"/> Change Email
                </a>
            </li>
        ) : (
            <li></li>
        )
    }

    showSetAvatar() {
        return this.userLoggedIn() ? (
            <li onClick={this.triggerIfLoggedIn(() => this.settingAvatar = true, "Log in to change Avatar")}>
                <a href="#">
                    <i className="fa fa-pencil fa-fw"/> Set Avatar
                </a>
            </li>
        ) : (
            <li></li>
        )
    }

    showAvatar() {
        return this.userLoggedIn() ? (
            <UserAvatar uid={profile.uid}/>
        ) : (
            <span>
            <img className="avatarimg" src="img/nothing.png" alt="avatar"/>
        </span>
        )
    }
}

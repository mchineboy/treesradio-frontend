import React from "react";
import {observer} from "mobx-react";

import toketimer from "stores/toke";

@observer
export default class TokeTimer extends React.Component {
    joinToke = () => {
        toketimer.joinToke();
    };

    render() {
        return (
            <div
                style={{
                    display: "inline-block",
                    marginRight: "1vw",
                    marginTop: ".75vh",
                    height: "1.5vh"
                }}
            >
                <div>
                    <a
                        id="toke-button"
                        className={toketimer.tokeUnderway ? "btn btn-warning" : "btn btn-success"}
                        onClick={this.joinToke}>
                        Toke
                        <span style={{display: toketimer.tokeUnderway ? "inherit" : "none"}}>
              &nbsp;in: <b>{millisToMinutesAndSeconds(toketimer.remainingTime)}</b>
            </span>
                    </a>
                </div>
            </div>
        );
    }
}

function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

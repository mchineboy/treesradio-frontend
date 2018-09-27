import React from "react";
import {observer} from "mobx-react";
import {observable} from "mobx";
import _ from "lodash";

import UserBit from "./Nav/UserBit";

import file from "src/version.json";

@observer
export default (class Nav extends React.Component {
  @observable hoveredTitle = false;
  @observable title = "[tr]";

  onHover = _.debounce(
    () => {
      this.hoveredTitle = true;
      this.title = "[treesradio]";
    },
    500,
    {leading: true}
  );
  offHover = _.debounce(() => {
    this.hoveredTitle = false;
    this.title = "[tr]";
  }, 500);

  render() {
    const title = (
      <span className="nav-title">
        <span>{this.title}</span> <Version show={this.hoveredTitle} />
      </span>
    );
    return (
      <div id="tr-nav">
        <nav className="navbar navbar-default">
          <div className="container-fluid">
            <div className="navbar-header">
              <a
                className="navbar-brand"
                href="#"
                onMouseOver={() => this.onHover()}
                onMouseOut={() => this.offHover()}
              >
                {title}
              </a>
            </div>

            <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
              {/* <ul className="nav navbar-nav" id="nav-about">
                <li><a>About</a></li>
              </ul> */}
              <div className="nav navbar-nav navbar-right">
                <UserBit />
              </div>
            </div>
            {/* .navbar-collapse */}
          </div>{" "}
          {/* .container-fluid */}
        </nav>
        <div id="nav-divider" />
      </div>
    );
  }
});

function Version({show}) {
  if (show === false) return null;
  return (
    <span className="version-tag">
      v{file.version.version}-{file.version.short}
    </span>
  );
}

// NEW MAIN COMPONENT

import { type FC, useState, useEffect } from "react";
import { observer } from "mobx-react";

import app from "../stores/app";

import { Nav } from "./Nav";
import Sidebar from "./Sidebar";
import { Toolbar } from "./Toolbar";
import { Player } from "./Player";
import { ToastContainer } from "react-toastify";
import PlaylistsPanel from "./Toolbar/PlaylistsPanel"
import playlists from "../stores/playlists";
import "react-toastify/dist/ReactToastify.css";
import cn from "classnames";
import TokeManager from "./toke/TokeManager";
import TOSAgreement from "./TOSAgreement";
import { hasTosBeenAccepted, setTosAccepted } from "../libs/tos";

// both are 1-indexed
type DateTuple = [month: number, day: number];

const specialOccasions = {
    "420": [4, 20],
    "april-fools": [4, 1],
} as const satisfies Readonly<Record<string, DateTuple>>;

type SpecialOccasion = keyof typeof specialOccasions;

const splashTexts = [
    // No messages over 40 characters
    "Grab a Bong and Sing A Long!",
    "Pimp Squad, Holdin it Down",
    "Livin' Young 'n Wild 'n Freeee",
    "Loaded... Or am I?",
    "Grinding Vigorously",
    "More uptime than Facebook",
    "Poking Badgers with Spoons",
    "Where's my Lighter?",
    'No officer, it\'s "Hi, how are you?"',
    "Home of the original musical inspiration",
] as const;

const randomSplash = () =>
    splashTexts[Math.floor(Math.random() * splashTexts.length)];

const isSpecialOccasion = (event: SpecialOccasion) =>
    new Date().getDate() === specialOccasions[event][0] && (new Date().getMonth() + 1) === specialOccasions[event][1];

const Main: FC = () => {
    // State to track TOS acceptance
    const [tosAccepted, setTosAcceptedState] = useState<boolean>(hasTosBeenAccepted());
    
    // Handler for when TOS is accepted
    const handleTosAccept = () => {
        console.log("TOS accepted in Main component");
        setTosAcceptedState(true);
        setTosAccepted(true);
    };
    
    // Log the current state for debugging
    useEffect(() => {
        console.log("TOS accepted state in Main:", tosAccepted);
    }, [tosAccepted]);
    
    //TODO April Fools Shenanigans
    if (!app.init) {
        return (
            <div className="main-load">
                <div className="container main-loadingcard">
                    <div className="main-vcenter">
                        <div className="main-center">
                            <center className="loading-txt">
                                {" "}
                                {randomSplash()} <br />
                                <i className="fa fa-spin fa-2x fa-circle-o-notch loadingscreenwheel" />
                            </center>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const appClasses = cn({
        "april-fools": isSpecialOccasion("april-fools"),
        "playlist-open": false,
    });

    return (
        <>
            {/* TOS Agreement Dialog - only render when app is initialized */}
            <TOSAgreement onAccept={handleTosAccept} />
            
            {/* Main App UI - will be visually obscured by the TOS dialog until accepted */}
            <div
                className={appClasses}
                id="app-grid"
            >
                <link
                    href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"
                    rel="stylesheet"
                    integrity="sha384-wvfXpqpZZVQGK6TAh5PVlGOfQNHSoD2xbE+QkPxCAFlNEevoEH3Sl0sibVcOQVnN"
                    crossOrigin="anonymous"
                />

                {/* Add TokeManager component which will handle the toke dialog visibility */}
                <TokeManager />

                <Nav show420={isSpecialOccasion("420")} /> {/* Start Container */}{" "}

                <div id="videotoplevel">
                    <Player />
                </div>

                <div id="toolbar">
                    <div id="playlists-container">
                        <Toolbar />
                    </div>
                    <a id="exportPlaylistDownload" />
                </div>

                <div id="chattoplevel">
                    <ToastContainer />{" "}
                    <Sidebar />
                </div>
            </div>

            <PlaylistsPanel
                onClose={() => playlists.setPanelOpen(false)}
                open={playlists.init && playlists.panelOpen}
            />
        </>
    );
};

const $Main = observer(Main);

export { $Main as Main };
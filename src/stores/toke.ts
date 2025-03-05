// src/store/toke.ts
// Frontend
import { computed, observable, autorun, action, makeObservable } from "mobx";
import { getDatabaseRef } from "../libs/fbase";
import { send } from "../libs/events";
import { TokeState, TokeUser, TokeDisplayData } from "../types/toke";

export default new (class TokeTimer {
  constructor() {
    makeObservable(this); // Required for newer MobX versions
    
    autorun(() => {
      getDatabaseRef("toke").on("value", snap => {
        const tokestatus = snap.val() as TokeState | null;
        if (tokestatus != null) {
          this.updateTokeState(tokestatus);
        }
      });
    });
  }

  @observable accessor underway = false;
  @observable accessor time = 0;
  @observable accessor totalTime = 0;
  @observable accessor initiator = "";
  @observable accessor participants: TokeUser[] = [];
  @observable accessor currentSession = 1;
  @observable accessor totalSessions = 1;
  @observable accessor sessionUid = "";
  @observable accessor notifications: string[] = [];
  @observable accessor completedTokes = 0;
  @observable accessor initialTotalSessions = 1;

  @action
  updateTokeState(tokeState: TokeState) {
    this.underway = tokeState.tokeUnderway;
    this.time = tokeState.remainingTime;
    this.totalTime = tokeState.tokeLength;
    this.initiator = tokeState.tokeUser || "";
    this.participants = tokeState.seshtoker || [];
    this.sessionUid = tokeState.uid || "";
    this.notifications = tokeState.notifications || [];
    
    // Get completed tokes from backend
    this.completedTokes = tokeState.completedTokes || 0;
    
    // For initialTotalSessions, first try to use the value from the backend
    if (tokeState.initialTotalSessions && tokeState.initialTotalSessions > 1) {
      this.initialTotalSessions = tokeState.initialTotalSessions;
    } 
    // If not available or it's 1, determine it from the first participant (usually the initiator)
    else if (this.participants.length > 0) {
      // Find the initiator if possible
      const initiatorParticipant = this.participants.find(p => p.username === `@${this.initiator}`);
      
      if (initiatorParticipant) {
        // Use the initiator's times value + completed tokes to get total
        this.initialTotalSessions = initiatorParticipant.times + this.completedTokes;
      } else {
        // Fallback to the first participant's times + completed tokes
        this.initialTotalSessions = this.participants[0].times + this.completedTokes;
      }
    } else {
      // Default to 1 if no other data is available
      this.initialTotalSessions = 1;
    }
    
    // Calculate current toke number as completed + 1
    // But if completedTokes is 0 and we have multiple tokes scheduled, we need additional checks
    if (this.completedTokes > 0) {
      // If we have completed tokes, it's simple: completedTokes + 1
      this.currentSession = this.completedTokes + 1;
    } else {
      // When completedTokes is 0, we need to check if this is the initial toke or if we're starting a new session
      // We can determine this by checking how many tokes the initiator has left compared to the initial total
      const initiatorParticipant = this.participants.find(p => p.username === `@${this.initiator}`);
      if (initiatorParticipant && this.initialTotalSessions > 1) {
        // Calculate how many tokes have been done based on what's left vs total
        const tokesRemaining = initiatorParticipant.times;
        const tokesDone = this.initialTotalSessions - tokesRemaining;
        this.currentSession = tokesDone + 1;
      } else {
        // Default to 1 if we can't determine or it's a single toke
        this.currentSession = 1;
      }
    }
    
    // Total sessions is the initial number requested
    this.totalSessions = this.initialTotalSessions;

    // Debug logging
    console.log("Toke State Updated:", {
      participants: this.participants,
      completedTokes: this.completedTokes,
      initialTotalSessions: this.initialTotalSessions,
      currentSession: this.currentSession,
      totalSessions: this.totalSessions
    });
  }

  @computed get tokeUnderway() {
    return this.underway;
  }

  @computed get remainingTime() {
    return this.time;
  }

  @computed get formattedTimeRemaining() {
    const totalSeconds = Math.floor(this.time / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  @computed get percentRemaining() {
    if (this.totalTime <= 0) return 0;
    return (this.time / this.totalTime) * 100;
  }

  @computed get displayData(): TokeDisplayData {
    return {
      isActive: this.underway,
      totalDuration: this.totalTime,
      remainingTime: this.time,
      initiator: this.initiator,
      participants: this.participants,
      currentSession: this.currentSession,
      totalSessions: this.totalSessions,
      formattedTimeRemaining: this.formattedTimeRemaining,
      percentRemaining: this.percentRemaining,
      notifications: this.notifications,
    };
  }

  @action
  joinToke() {
    if (this.underway) {
      send("chat", { mentions: [], msg: "/join" });
    } else {
      send("chat", { mentions: [], msg: "/toke" });
    }
  }
  
  @action
  joinTokeMultiple(times: number) {
    if (this.underway) {
      send("chat", { mentions: [], msg: `/join ${times}` });
    }
  }
  
  @action
  cancelToke() {
    send("chat", { mentions: [], msg: "/canceltoke" });
  }
})();
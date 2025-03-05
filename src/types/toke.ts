// src/types/toke.ts

export interface TokeUser {
    username: string;
    times: number;
  }
  
  export interface TokeState {
    tokeUnderway: boolean;
    tokeLength: number;
    remainingTime: number;
    tokeUser?: string;
    seshtoker: TokeUser[];
    uid?: string;
    notifications: string[];
    completedTokes: number;
    initialTotalSessions: number;
  }
  
  // This interface represents the processed data for display
  export interface TokeDisplayData {
    isActive: boolean;
    totalDuration: number;
    remainingTime: number;
    initiator: string;
    participants: TokeUser[];
    currentSession: number;
    totalSessions: number;
    formattedTimeRemaining: string;
    percentRemaining: number;
    notifications?: string[];
  }
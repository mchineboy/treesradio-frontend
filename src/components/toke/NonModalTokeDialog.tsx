// src/components/NonModalTokeDialog.tsx
// FrontEnd
import React, { useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import tokeStore from '../../stores/toke';
import { XMarkIcon, UserPlusIcon, ClockIcon, FireIcon } from '@heroicons/react/24/outline';
import profile from '../../stores/profile';
import cn from 'classnames';

// Check if it's 4/20
const is420 = () => {
  const now = new Date();
  return now.getMonth() === 3 && now.getDate() === 20; // April is month 3 (zero-indexed)
};

const NonModalTokeDialog: React.FC = observer(() => {
  const tokeData = tokeStore.displayData;
  const [is420Day] = useState(is420());
  const [minimized, setMinimized] = useState(profile.minimizedTokeDefault);
  const [visible, setVisible] = useState(false);
  
  // Dragging state
  const dialogRef = useRef<HTMLDivElement>(null);
  const minimizedRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 16 }); // Default position

  // Show dialog when toke becomes active, hide when inactive
  useEffect(() => {
    setVisible(tokeData.isActive);
    
    // Set minimized state based on user preference when a new toke session starts
    if (tokeData.isActive) {
      setMinimized(profile.minimizedTokeDefault);
    }
  }, [tokeData.isActive]);

  // Animation frames for the special 420 effect (smoke puffs)
  const [showSmoke, setShowSmoke] = useState(false);

  useEffect(() => {
    if (is420Day && tokeData.isActive) {
      const smokeInterval = setInterval(() => {
        setShowSmoke(true);
        setTimeout(() => setShowSmoke(false), 2000);
      }, 10000);

      return () => clearInterval(smokeInterval);
    }
  }, [is420Day, tokeData.isActive]);

  // Dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button

    setIsDragging(true);

    // Store the initial mouse position and dialog position
    const dragStartX = e.clientX;
    const dragStartY = e.clientY;
    const initialX = position.x;
    const initialY = position.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - dragStartX;
      const dy = moveEvent.clientY - dragStartY;

      setPosition({
        x: initialX + dx,
        y: initialY + dy
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!tokeData.isActive && !visible) {
    return null;
  }

  const handleJoin = () => {
    tokeStore.joinToke();
  };

  const handleJoinMultiple = () => {
    // Join for all remaining sessions
    tokeStore.joinTokeMultiple(tokeData.totalSessions);
  };

  const handleCancel = () => {
    tokeStore.cancelToke();
  };

  // Minimized version that appears when the dialog is collapsed
  if (minimized) {
    return (
      <div
        ref={minimizedRef}
        className={cn(
          "fixed flex items-center py-1.5 px-3 rounded-full shadow-md z-40 select-none transition-transform hover:scale-105",
          is420Day ? "bg-gradient-to-r from-green-500 to-teal-600" : "bg-gray-800",
          "text-gray-100 text-sm"
        )}
        onClick={() => setMinimized(false)}
        onMouseDown={handleMouseDown}
        style={{
          top: `${position.y}px`,
          left: `${position.x}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {is420Day ? (
          <FireIcon className="w-5 h-5 mr-1 text-orange-500" />
        ) : (
          <ClockIcon className="w-5 h-5 mr-1" />
        )}
        <span>{tokeData.formattedTimeRemaining}</span>
      </div>
    );
  }

  return (
    <div
      ref={dialogRef}
      className="fixed z-50 select-none"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        maxWidth: '320px',
        width: '100%'
      }}
    >
      {showSmoke && is420Day && (
        <div className="absolute -top-5 right-2.5 z-30 opacity-70">
          <div className="absolute w-2.5 h-2.5 rounded-full bg-white/60 blur left-1.5 animate-smoke-1"></div>
          <div className="absolute w-2.5 h-2.5 rounded-full bg-white/60 blur left-0 animate-smoke-2"></div>
          <div className="absolute w-2.5 h-2.5 rounded-full bg-white/60 blur -left-1.5 animate-smoke-3"></div>
        </div>
      )}

      <div className={cn(
        "rounded-lg shadow-xl overflow-hidden",
        is420Day ? "bg-gradient-to-br from-emerald-900 to-gray-900" : "bg-gray-800",
        "text-gray-100"
      )}>
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-white/10 cursor-grab"
          onMouseDown={handleMouseDown}
        >
          <div className={cn(
            "text-lg font-medium",
            is420Day ? "text-green-400" : "text-gray-200"
          )}>
            {is420Day ? '🔥 420 Toke Session 🔥' : 'Toke Session'}
          </div>
          <button
            onClick={() => setMinimized(true)}
            className="p-1 text-gray-400 rounded-md hover:text-gray-200"
          >
            <XMarkIcon className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/10">
          <div
            className={cn(
              "h-full transition-width duration-1000 ease-linear",
              is420Day ? "bg-green-500" : "bg-orange-500"
            )}
            style={{ width: `${tokeData.percentRemaining}%` }}
          ></div>
        </div>

        <div className="p-4">
          <div className="mt-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Time Remaining:</span>
              <span className={cn(
                "font-medium",
                is420Day ? "text-green-400" : "text-orange-400"
              )}>
                {tokeData.formattedTimeRemaining}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Toke #:</span>
              <span className={cn(
                "font-medium",
                is420Day ? "text-green-400" : "text-orange-400"
              )}>
                {tokeData.currentSession} of {tokeData.totalSessions}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Initiated by:</span>
              <span className={cn(
                "font-medium",
                is420Day ? "text-green-400" : "text-orange-400"
              )}>
                {tokeData.initiator}
              </span>
            </div>

            {tokeData.participants.length > 0 && (
              <div>
                <span className="block mb-1 text-sm text-gray-400">Participants:</span>
                <div className="flex flex-wrap gap-2">
                  {tokeData.participants.map((participant, index) => (
                    <div
                      key={index}
                      className={cn(
                        "rounded px-1.5 py-0.5 text-xs",
                        is420Day ? "bg-green-500/20" : "bg-orange-500/20"
                      )}
                    >
                      {participant.username} ({participant.times}x)
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notifications */}
            {tokeData.notifications && tokeData.notifications.length > 0 && (
              <div>
                <span className="block mb-1 text-sm text-gray-400">Notifications:</span>
                <ul className="overflow-y-auto text-sm max-h-48">
                  {tokeData.notifications.map((notification, index) => (
                    <li key={index}>{notification}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Join/Cancel buttons */}
          <div className="flex justify-between mt-4 space-x-2">
            <div className="flex space-x-2">
              <button
                type="button"
                className={cn(
                  "px-3 py-1.5 rounded flex items-center text-sm text-white",
                  is420Day ? "bg-green-600 hover:bg-green-700" : "bg-orange-500 hover:bg-orange-600"
                )}
                onClick={handleJoin}
              >
                <UserPlusIcon className="w-4 h-4 mr-1" />
                Join
              </button>

              {tokeData.totalSessions > 1 && (
                <button
                  type="button"
                  className={cn(
                    "px-3 py-1.5 rounded text-sm text-white",
                    is420Day ? "bg-green-600 hover:bg-green-700" : "bg-orange-500 hover:bg-orange-600"
                  )}
                  onClick={handleJoinMultiple}
                >
                  Join All ({tokeData.totalSessions}x)
                </button>
              )}
            </div>

            {/* Only show cancel for moderators or the initiator */}
            <button
              type="button"
              className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-sm text-white"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default NonModalTokeDialog;
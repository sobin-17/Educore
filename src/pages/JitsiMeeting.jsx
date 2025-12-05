import React, { useState, useRef, useEffect } from 'react';
import { JitsiMeeting, JitsiMeetingAPI } from '@jitsi/react-sdk';
import { Video, X } from 'lucide-react';

const JitsiMeetingPage = ({ roomName, displayName, onEndMeeting }) => {
    const apiRef = useRef(null);

    // This function is called when the Jitsi API is ready
    const handleApiReady = (api) => {
        apiRef.current = api;
        api.addEventListener('videoConferenceLeft', onEndMeeting);
        console.log("Jitsi API is ready!");
    };

    const handleJitsiError = (error) => {
        console.error("Jitsi error:", error);
    };

    // Clean up the Jitsi API instance when the component unmounts
    useEffect(() => {
        return () => {
            if (apiRef.current) {
                apiRef.current.dispose();
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="relative w-full h-full max-w-4xl max-h-screen bg-gray-800 rounded-lg shadow-2xl overflow-hidden flex flex-col">
                {/* Meeting Header */}
                <div className="flex justify-between items-center bg-gray-700 text-white p-4">
                    <div className="flex items-center space-x-2">
                        <Video className="w-6 h-6 text-blue-400" />
                        <h3 className="text-xl font-semibold">Live Meeting: {roomName}</h3>
                    </div>
                    <button
                        onClick={onEndMeeting}
                        className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Meeting Embed Container */}
                <div className="flex-grow">
                    <JitsiMeeting
                        roomName={roomName}
                        displayName={displayName}
                        onApiReady={handleApiReady}
                        onApiError={handleJitsiError}
                        configOverwrite={{
                            prejoinPageEnabled: false,
                            startWithAudioMuted: false,
                            startWithVideoMuted: false,
                            disableSelfView: true,
                        }}
                        interfaceConfigOverwrite={{
                            APP_NAME: "LearnFlow", // Customize app name
                            DEFAULT_REMOTE_DISPLAY_NAME: "Student",
                            TOOLBAR_BUTTONS: [
                                'microphone', 'camera', 'closedcaptions', 'fullscreen',
                                'fodeviceselection', 'hangup', 'profile', 'chat',
                                'livestreaming', 'etherpad', 'sharedvideo', 'shortcuts',
                                'tileview', 'toggle-camera', 'videoquality', 'filmstrip'
                            ],
                            SHOW_JITSI_WATERMARK: false,
                            SHOW_WATERMARK_FOR_GUESTS: false,
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default JitsiMeetingPage;

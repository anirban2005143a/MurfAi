// // components/WebcamSection.jsx
// import { useState, useRef, useEffect } from "react";
// import { showToast } from "../utils/showToast";

// const WebcamSection = ({
//   isSessionActive,
//   onStartSession,
//   onStopSession,
//   startCapturingFrames,
//   videoRef,
// }) => {
//   const [isLoading, setIsLoading] = useState(false);
//   const streamRef = useRef(null);
//   // Start Webcam
//   const handleStartClick = async () => {
//     try {
//       setIsLoading(true);
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { width: 1280, height: 720 },
//         audio: false,
//       });
//       streamRef.current = stream;

//       if (videoRef.current) {
//         videoRef.current.srcObject = stream;
//         // Remove the manual play() call and let the autoPlay attribute handle it
//       }

//       // Start capturing frames
//       startCapturingFrames();

//       onStartSession();
//     } catch (error) {
//       console.error("Error accessing webcam:", error);
//       showToast(`Could not access webcam: ${error.message}`, 1);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Stop Webcam
//   const handleStopClick = () => {
//     if (videoRef.current) {
//       videoRef.current.srcObject = null;
//     }
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach((track) => track.stop());
//       streamRef.current = null;
//     }

//     onStopSession();
//   };

//   // Clean up on unmount
//   useEffect(() => {
//     return () => {
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach((track) => track.stop());
//       }
//     };
//   }, []);

//   return (
//     <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-6 max-w-[900px] mx-auto transition-all duration-300">
//       <h2 className="text-xl font-bold text-blue-400 mb-4 text-center">
//         Sign Language Input
//       </h2>

//       <div className="relative aspect-video bg-gray-950 rounded-xl mb-6 overflow-hidden flex items-center justify-center">
//         {/* Always render video element but control visibility */}
//         <video
//           ref={videoRef}
//           autoPlay
//           playsInline
//           muted
//           className={`w-full h-full object-cover ${
//             isSessionActive ? "block" : "hidden"
//           }`}
//         />

//         {!isSessionActive && (
//           <div className="text-gray-400 text-center p-4">
//             <i className="fas fa-video text-5xl opacity-60 mb-3"></i>
//             <p>Webcam feed will appear here when session starts</p>
//           </div>
//         )}

//         {isLoading && (
//           <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
//             <div className="text-white text-center">
//               <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
//               <p>Initializing webcam...</p>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Buttons */}
//       <div className="flex flex-col sm:flex-row gap-4">
//         <button
//           onClick={handleStartClick}
//           disabled={isSessionActive || isLoading}
//           className={`flex-1 py-3 px-6 rounded-xl font-semibold flex items-center justify-center transition-all duration-300 transform ${
//             isSessionActive || isLoading
//               ? "bg-gray-600 text-gray-300 cursor-not-allowed"
//               : "bg-blue-600 hover:bg-blue-700 text-white hover:-translate-y-1 shadow-lg"
//           }`}
//         >
//           <i className="fas fa-play-circle mr-2"></i>
//           {isLoading ? "Initializing..." : "Start Session"}
//         </button>

//         <button
//           onClick={handleStopClick}
//           disabled={!isSessionActive}
//           className={`flex-1 py-3 px-6 rounded-xl font-semibold flex items-center justify-center transition-all duration-300 transform ${
//             !isSessionActive
//               ? "bg-gray-600 text-gray-300 cursor-not-allowed"
//               : "bg-red-600 hover:bg-red-700 text-white hover:-translate-y-1 shadow-lg"
//           }`}
//         >
//           <i className="fas fa-stop-circle mr-2"></i> Stop Session
//         </button>
//       </div>
//     </div>
//   );
// };

// export default WebcamSection;

// components/WebcamSection.jsx
import { useState, useRef, useEffect } from "react";
import { showToast } from "../utils/showToast";

const WebcamSection = ({
  isSessionActive,
  onStartSession,
  onStopSession,
  startCapturingFrames,
  videoRef,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);

  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Start Webcam
  const handleStartClick = async () => {
    try {
      setIsLoading(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Setup MediaRecorder for preview video storage
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "video/webm; codecs=vp9",
      });

      chunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setRecordedVideoUrl(URL.createObjectURL(blob));
      };

      mediaRecorderRef.current.start();

      // Start capturing frames
      startCapturingFrames();
      onStartSession();
    } catch (error) {
      console.error("Error accessing webcam:", error);
      showToast(`Could not access webcam: ${error.message}`, 1);
    } finally {
      setIsLoading(false);
    }
  };

  // Stop Webcam
  const handleStopClick = () => {
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Stop recording
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    onStopSession();
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-6 max-w-[900px] mx-auto transition-all duration-300">
      <h2 className="text-xl font-bold text-blue-400 mb-4 text-center">
        Sign Language Input
      </h2>

      <div className="relative aspect-video bg-gray-950 rounded-xl mb-6 overflow-hidden flex items-center justify-center">
        {/* Always render video element but control visibility */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${
            isSessionActive ? "block" : "hidden"
          }`}
        />

        {!isSessionActive && (
          <div className="text-gray-400 text-center p-4">
            <i className="fas fa-video text-5xl opacity-60 mb-3"></i>
            <p>Webcam feed will appear here when session starts</p>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p>Initializing webcam...</p>
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          onClick={handleStartClick}
          disabled={isSessionActive || isLoading}
          className={`flex-1 py-3 px-6 rounded-xl font-semibold flex items-center justify-center transition-all duration-300 transform ${
            isSessionActive || isLoading
              ? "bg-gray-600 text-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white hover:-translate-y-1 shadow-lg"
          }`}
        >
          <i className="fas fa-play-circle mr-2"></i>
          {isLoading
            ? "Initializing..."
            : recordedVideoUrl
            ? "Retake Session"
            : "Start Session"}
        </button>

        <button
          onClick={handleStopClick}
          disabled={!isSessionActive}
          className={`flex-1 py-3 px-6 rounded-xl font-semibold flex items-center justify-center transition-all duration-300 transform ${
            !isSessionActive
              ? "bg-gray-600 text-gray-300 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700 text-white hover:-translate-y-1 shadow-lg"
          }`}
        >
          <i className="fas fa-stop-circle mr-2"></i> Stop Session
        </button>
      </div>

      {/* Recorded Video Preview */}
      {recordedVideoUrl && (
        <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">
            Preview of Recorded Session
          </h3>
          <video
            src={recordedVideoUrl}
            controls
            className="w-full rounded-lg shadow-md"
          />
        </div>
      )}
    </div>
  );
};

export default WebcamSection;

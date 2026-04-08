import { useRef, useState, useCallback } from 'react';

export function useRecorder() {
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null); // attach to <video> for live preview

  const startRecording = useCallback(async () => {
    try {
      // Try with audio first, fall back to video-only if mic is unavailable
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, frameRate: 24 },
          audio: true,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, frameRate: 24 },
          audio: false,
        });
      }
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Let the browser pick the best supported format automatically
      // Manually specifying codecs (e.g. vp8) can silently fail on some Chrome versions with audio
      const mimeType =
        MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' :
        MediaRecorder.isTypeSupported('video/mp4')  ? 'video/mp4' :
                                                      '';

      const options = { videoBitsPerSecond: 400000 };
      if (mimeType) options.mimeType = mimeType;

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onerror = (e) => {
        console.error('MediaRecorder error:', e.error);
        setCameraError(e.error?.message || 'Recording error');
      };

      recorder.start(1000);
      setIsRecording(true);
      setCameraError(null);
    } catch (err) {
      setCameraError(err.message);
      // Stop stream if recording failed to start
      streamRef.current?.getTracks().forEach((t) => t.stop());
      throw err; // re-throw so caller can detect camera failure
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const type = chunksRef.current[0]?.type || recorder.mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type });
        // Stop camera
        streamRef.current?.getTracks().forEach((t) => t.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
        setIsRecording(false);
        resolve(blob);
      };

      recorder.stop();
    });
  }, []);

  return { startRecording, stopRecording, videoRef, isRecording, cameraError };
}

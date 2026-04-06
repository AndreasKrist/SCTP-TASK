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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, frameRate: 24 },
        audio: true,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Pick a supported mimeType — webm on Chrome/Firefox, fallback for Safari
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : '';

      const options = { videoBitsPerSecond: 400000 }; // ~400kbps keeps files small
      if (mimeType) options.mimeType = mimeType;

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(1000); // collect a chunk every 1s
      setIsRecording(true);
      setCameraError(null);
    } catch (err) {
      setCameraError(err.message);
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
        const type = chunksRef.current[0]?.type || 'video/webm';
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

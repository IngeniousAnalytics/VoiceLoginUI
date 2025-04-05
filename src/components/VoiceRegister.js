import React, { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaSpinner } from 'react-icons/fa';
import axios from 'axios';

const VoiceRegister = ({ onSwitch }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const countdownRef = useRef(null);

  // Phrase containing all English vowels (A, E, I, O, U)
  const VOWEL_PHRASE = "Please say: 'The quick brown fox jumps over the lazy dog'";
  const MIN_RECORDING_TIME = 5; // seconds

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setMessage(null);
      audioChunksRef.current = [];
      setCountdown(MIN_RECORDING_TIME);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      const options = { 
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000 
      };

      mediaRecorderRef.current = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);

      // Start countdown
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      setMessage({ type: 'error', text: `Microphone error: ${err.message}` });
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    
    clearInterval(countdownRef.current);
    const stopped = new Promise((resolve) => {
      mediaRecorderRef.current.onstop = resolve;
    });

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    await stopped;
    setIsRecording(false);
  };

  const handleRegister = async () => {
    if (!username || username.length < 3) {
      setMessage({ type: 'error', text: 'Username must be at least 3 characters' });
      return;
    }

    if (audioChunksRef.current.length === 0) {
      setMessage({ type: 'error', text: 'Please record your voice first' });
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: 'audio/webm;codecs=opus' 
      });

      const formData = new FormData();
      formData.append('username', username);
      formData.append('audio', audioBlob, `${username}_registration.webm`);

      const response = await axios.post('http://localhost:8000/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 15000
      });

      setMessage({ type: 'success', text: response.data.message });
    } catch (err) {
      const errorText = err.response?.data?.detail || 
                       err.message || 
                       'Registration failed';
      setMessage({ type: 'error', text: errorText });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="voice-auth-box">
      <h2>Voice Registration</h2>
      
      <div className="input-group">
        <label>Username</label>
        <input
          type="text"
          placeholder="Choose a username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isProcessing || isRecording}
        />
      </div>

      <div className="recording-instructions">
        <p>{VOWEL_PHRASE}</p>
        <p>This helps us capture all vowel sounds</p>
        {isRecording && (
          <div className="countdown">
            Recording: {countdown}s remaining (minimum {MIN_RECORDING_TIME}s)
          </div>
        )}
      </div>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`record-button ${isRecording ? 'active' : ''}`}
      >
        {isProcessing ? (
          <FaSpinner className="spinner" />
        ) : (
          <FaMicrophone />
        )}
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>

      <button
        onClick={handleRegister}
        disabled={!username || isProcessing || isRecording || audioChunksRef.current.length === 0}
        className="register-button"
      >
        Complete Registration
      </button>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <p className="switch-link" onClick={onSwitch}>
        Already registered? Login instead
      </p>
    </div>
  );
};

export default VoiceRegister;
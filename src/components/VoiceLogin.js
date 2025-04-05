import React, { useState, useRef } from 'react';
import { FaMicrophone, FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const VoiceLogin = ({ onSwitch }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [authStatus, setAuthStatus] = useState(null);
  const [message, setMessage] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      setMessage('');
      setAuthStatus(null);
      audioChunksRef.current = [];
      
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
    } catch (err) {
      setMessage(`Microphone error: ${err.message}`);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;
    
    const stopped = new Promise((resolve) => {
      mediaRecorderRef.current.onstop = resolve;
    });

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    await stopped;
    setIsRecording(false);
  };

  const handleLogin = async () => {
    if (audioChunksRef.current.length === 0) {
      setMessage('Please record your voice first');
      return;
    }

    setIsProcessing(true);
    setMessage('');
    setAuthStatus(null);

    try {
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: 'audio/webm;codecs=opus' 
      });

      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice_login.webm');

      const response = await axios.post('http://localhost:8000/verify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 10000
      });

      if (response.data.authenticated) {
        setAuthStatus('success');
        setMessage(`Welcome back, ${response.data.username}!`);
      } else {
        setAuthStatus('error');
        setMessage('Voice not recognized. Please try again.');
      }
    } catch (err) {
      setAuthStatus('error');
      // Properly extract error message
      if (err.response) {
        // Handle FastAPI validation errors
        if (err.response.data?.detail) {
          if (typeof err.response.data.detail === 'string') {
            setMessage(err.response.data.detail);
          } else if (Array.isArray(err.response.data.detail)) {
            setMessage(err.response.data.detail.map(e => e.msg).join(', '));
          } else {
            setMessage(JSON.stringify(err.response.data.detail));
          }
        } else {
          setMessage(err.response.statusText);
        }
      } else if (err.request) {
        setMessage('No response from server');
      } else {
        setMessage(err.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="voice-auth-box">
      <h2>Login with Voice</h2>

      <div className="voice-auth-status">
        {authStatus === 'success' && <FaCheck className="status-icon success" />}
        {authStatus === 'error' && <FaTimes className="status-icon error" />}
      </div>

      <div className="recording-status">
        {isRecording && <div className="recording-indicator">● Recording</div>}
      </div>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`voice-button ${isRecording ? 'recording' : ''}`}
      >
        {isProcessing ? (
          <FaSpinner className="spinner" />
        ) : (
          <FaMicrophone />
        )}
        {isRecording ? "Stop Recording" : "Start Voice Login"}
      </button>

      <button
        onClick={handleLogin}
        disabled={isProcessing || !audioChunksRef.current.length}
        className="login-button"
      >
        {isProcessing ? "Verifying..." : "Authenticate"}
      </button>

      {message && (
        <div className={`alert ${authStatus || ''}`.trim()}>
          {message}
        </div>
      )}

      <p className="switch-link" onClick={onSwitch}>
        Don't have an account? Register with voice
      </p>
    </div>
  );
};

export default VoiceLogin;
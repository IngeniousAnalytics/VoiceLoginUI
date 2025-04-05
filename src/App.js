import React, { useState } from 'react';
import VoiceLogin from './components/VoiceLogin';
import VoiceRegister from './components/VoiceRegister';
import './App.css';

function App() {
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <div className="app">
      <div className="auth-container">
        {isRegistering ? (
          <VoiceRegister onSwitch={() => setIsRegistering(false)} />
        ) : (
          <VoiceLogin onSwitch={() => setIsRegistering(true)} />
        )}
      </div>
    </div>
  );
}

export default App;
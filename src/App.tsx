import React from 'react';
import './App.css';
import { WalletConnect } from './components/WalletConnect';


function App() {

  return (
    <div className="App" data-testid="app">
      <WalletConnect></WalletConnect>
    </div >
  );
}

export default App;

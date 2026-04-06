import React from 'react';
import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content animate-fade-in">
        {children}
      </main>
    </div>
  );
}

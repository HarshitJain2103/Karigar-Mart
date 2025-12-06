import React from 'react';
import './spinner.css';

export default function Spinner() {
  return (
    <div className="spinner-wrapper">
      <div className="spinner-ring"></div>

      <img
        src="/karigar.png"
        alt="Loading"
        className="spinner-logo"
      />
    </div>
  );
}

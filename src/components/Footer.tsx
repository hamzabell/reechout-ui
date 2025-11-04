import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="px-6 py-16 mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Company Info */}
          <div className="flex items-center space-x-3 mb-8 md:mb-0">
            <img src="/logo.svg" alt="ReechOut" className="w-10 h-10 object-contain" />
            <h3 className="text-xl font-bold text-white">Reechout</h3>
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-slate-400 text-sm">
              © 2024 Reechout. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
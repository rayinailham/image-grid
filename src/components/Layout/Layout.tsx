import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`app-layout ${className}`}>
      <header className="app-header">
        <h1>Image Grid Editor</h1>
        <p>Edit images pixel by pixel on a 500×500 grid</p>
      </header>
      
      <main className="app-main">
        {children}
      </main>
      
      <footer className="app-footer">
        <p>&copy; 2025 Image Grid Editor</p>
      </footer>
    </div>
  );
};

export default Layout;
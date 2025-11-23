import React from 'react';
import { Outlet } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <div style={{ fontFamily: 'Inter, Roboto, system-ui, -apple-system' }}>
      <header style={{ padding: 12, borderBottom: '1px solid #eee' }}>
        <h1>Inventory Management</h1>
      </header>
      <main style={{ padding: 12 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default App;

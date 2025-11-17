import { PropsWithChildren } from 'react';

export const MainLayout = ({ children }: PropsWithChildren) => {
  return (
    <main className="layout">
      <header className="layout__header">
        <h1>Workspace Booking System</h1>
      </header>
      <div className="layout__content">{children}</div>
    </main>
  );
};

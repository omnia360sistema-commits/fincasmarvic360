import { Outlet } from 'react-router-dom';
import GlobalSidebar from './GlobalSidebar';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function AppLayout() {
  return (
    <>
      <GlobalSidebar />
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </>
  );
}

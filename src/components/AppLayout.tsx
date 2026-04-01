import { Outlet } from 'react-router-dom';
import GlobalSidebar from './GlobalSidebar';

export default function AppLayout() {
  return (
    <>
      <GlobalSidebar />
      <Outlet />
    </>
  );
}

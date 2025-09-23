// utils/lazyComponents.js
import { lazy, Suspense } from 'react';
import Loader from '../components/Loader';

const createLazyComponent = (importFn) => {
  const LazyComponent = lazy(importFn);
  
  return (props) => (
    <Suspense fallback={<Loader />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

export const AdminPanel = createLazyComponent(() => import('../AdminDashboard'));
export const MainContent = createLazyComponent(() => import('../components/MainContent'));
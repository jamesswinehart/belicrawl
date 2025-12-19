'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TripPlannerLayout from './components/TripPlannerLayout';

export default function TripPlannerPage() {
  const router = useRouter();

  // Reset state on mount (handles "Search Again" navigation)
  useEffect(() => {
    // This ensures a fresh state when navigating to /trip-planner
    // The component will remount and reset all state
  }, []);

  return <TripPlannerLayout />;
}


import React from 'react';
import { DashboardPage } from './DashboardPage';

interface HomePageProps {
  onNavigate: (view: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  return <DashboardPage onNavigate={onNavigate} />;
}

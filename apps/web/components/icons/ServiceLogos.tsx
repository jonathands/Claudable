/**
 * Service Provider Logos Component
 * Centralized component for GitHub, Supabase, and Vercel logos
 */
import React from 'react';

interface ServiceLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function GitHubLogo({ className = "", width = 16, height = 16 }: ServiceLogoProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 98 96" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="currentColor"/>
    </svg>
  );
}

export function SupabaseLogo({ className = "", width = 16, height = 16 }: ServiceLogoProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 109 113" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#paint0_linear)"/>
      <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#3ECF8E"/>
      <defs>
        <linearGradient id="paint0_linear" x1="53.9738" y1="54.974" x2="94.1635" y2="71.8295" gradientUnits="userSpaceOnUse">
          <stop stopColor="#249361"/>
          <stop offset="1" stopColor="#3ECF8E"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function VercelLogo({ className = "", width = 16, height = 16 }: ServiceLogoProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 76 65" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="m37.5274 0 36.1629 65H1.3645L37.5274 0Z" fill="currentColor"/>
    </svg>
  );
}

// Unified component that can render any service logo
interface ServiceLogoComponentProps extends ServiceLogoProps {
  service: 'github' | 'supabase' | 'vercel';
}

export function ServiceLogo({ service, ...props }: ServiceLogoComponentProps) {
  switch (service) {
    case 'github':
      return <GitHubLogo {...props} />;
    case 'supabase':
      return <SupabaseLogo {...props} />;
    case 'vercel':
      return <VercelLogo {...props} />;
    default:
      return null;
  }
}
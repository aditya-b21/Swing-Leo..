import React from 'react';

interface RocketIconProps {
  className?: string;
}

const RocketIcon: React.FC<RocketIconProps> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74.5 5 2c1.26-1.5 5-2 5-2s-.5-3.74-2-5c1.26 1.5 2 5 2 5s-3.74-.5-5-2z" />
    <path d="M7.8 7.8l-1.4 1.4c-2.83 2.83-2.83 7.39 0 10.22s7.39 2.83 10.22 0l1.4-1.4" />
    <path d="M10.8 10.8l-1.4 1.4c-1.96 1.96-1.96 5.12 0 7.07s5.12 1.96 7.07 0l1.4-1.4" />
    <path d="M13.8 13.8l-1.4 1.4c-1.1 1.1-1.1 2.88 0 3.98s2.88 1.1 3.98 0l1.4-1.4" />
    <path d="M16.8 16.8l-1.4 1.4c-0.55 0.55-0.55 1.44 0 1.99s1.44 0.55 1.99 0l1.4-1.4" />
  </svg>
);

export default RocketIcon;


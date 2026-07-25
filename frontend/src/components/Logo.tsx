import React from 'react'

export default function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Exact teal-blue-violet gradient profile matching the uploaded image */}
        <linearGradient id="ugsLogoGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6C7AEC" />
          <stop offset="50%" stopColor="#4facfe" />
          <stop offset="100%" stopColor="#48C3B5" />
        </linearGradient>
      </defs>
      
      {/* Outer Rounded Octagon Frame */}
      <path 
        d="M 65 15 
           L 135 15 
           A 12 12 0 0 1 143 18
           L 182 57
           A 12 12 0 0 1 185 65
           L 185 135
           A 12 12 0 0 1 182 143
           L 143 182
           A 12 12 0 0 1 135 185
           L 65 185
           A 12 12 0 0 1 57 182
           L 18 143
           A 12 12 0 0 1 15 135
           L 15 65
           A 12 12 0 0 1 18 57
           L 57 18
           A 12 12 0 0 1 65 15 Z" 
        stroke="url(#ugsLogoGrad)" 
        strokeWidth="15" 
        strokeLinejoin="round" 
      />

      {/* Inner Interlocking Loop 1 (Upper Hook) */}
      <path 
        d="M 60 110 
           L 95 75 
           L 135 75 
           L 155 95 
           L 135 115 
           L 115 95" 
        stroke="url(#ugsLogoGrad)" 
        strokeWidth="15" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Inner Interlocking Loop 2 (Lower Hook) */}
      <path 
        d="M 140 90 
           L 105 125 
           L 65 125 
           L 45 105 
           L 65 85 
           L 85 105" 
        stroke="url(#ugsLogoGrad)" 
        strokeWidth="15" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  )
}

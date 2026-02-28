import React from "react";

interface LogoProps {
    size?: number;
    className?: string;
    showText?: boolean;
    textColor?: string;
}

export default function Logo({
    size = 32,
    className = "",
    showText = true,
    textColor = "text-ink"
}: LogoProps) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div
                className="flex items-center justify-center overflow-hidden rounded-xl bg-coral shadow-[var(--shadow-coral)]"
                style={{ width: size, height: size }}
            >
                <svg
                    width={size * 0.8}
                    height={size * 0.8}
                    viewBox="0 0 56 56"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M28 48C16 48 8 40 8 30C8 22 12 16 18 13C16 10 15 6 17 4C19 2 22 4 24 8C25.3 7.5 26.6 7.2 28 7.2C30 7.2 31.8 7.7 33.4 8.6C35 4.5 38 2 40 4C42 6 41 10 39 13.5C44.5 17 48 23 48 30C48 40 40 48 28 48Z"
                        fill="white"
                        fillOpacity="0.95"
                    />
                    <ellipse cx="21" cy="27" rx="3.2" ry="3.5" fill="#1A1208" />
                    <circle cx="22.2" cy="25.5" r="1.1" fill="white" />
                    <ellipse cx="35" cy="27" rx="3.2" ry="3.5" fill="#1A1208" />
                    <circle cx="36.2" cy="25.5" r="1.1" fill="white" />
                </svg>
            </div>
            {showText && (
                <span className={`font-display font-bold tracking-tight ${textColor}`} style={{ fontSize: size * 0.7 }}>
                    Flou<span className="text-coral">pet</span>
                </span>
            )}
        </div>
    );
}

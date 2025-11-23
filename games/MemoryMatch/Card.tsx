import React, { JSX } from 'react';
import { MemoryCard, SHAPE_DEFINITIONS } from '../memoryMatchEngine';

interface CardProps {
  card: MemoryCard;
  onClick: () => void;
  isDisabled: boolean;
}

// Shape SVG components
const ShapeRenderer: React.FC<{ shape: string }> = ({ shape }) => {
  const size = '80%';

  const shapes: Record<string, JSX.Element> = {
    circle: (
      <div className="w-full h-full flex items-center justify-center">
        <div className="rounded-full bg-white" style={{ width: size, height: size }} />
      </div>
    ),
    square: (
      <div className="w-full h-full flex items-center justify-center">
        <div className="bg-white" style={{ width: size, height: size }} />
      </div>
    ),
    triangle: (
      <div className="w-full h-full flex items-center justify-center">
        <div style={{
          width: 0,
          height: 0,
          borderLeft: '40px solid transparent',
          borderRight: '40px solid transparent',
          borderBottom: '70px solid white'
        }} />
      </div>
    ),
    diamond: (
      <div className="w-full h-full flex items-center justify-center">
        <div className="bg-white rotate-45" style={{ width: '60%', height: '60%' }} />
      </div>
    ),
    star: (
      <div className="w-full h-full flex items-center justify-center text-white text-6xl">
        ⭐
      </div>
    ),
    heart: (
      <div className="w-full h-full flex items-center justify-center text-white text-6xl">
        ❤️
      </div>
    ),
    pentagon: (
      <div className="w-full h-full flex items-center justify-center">
        <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
          <polygon points="50,10 90,40 75,85 25,85 10,40" fill="white" />
        </svg>
      </div>
    ),
    hexagon: (
      <div className="w-full h-full flex items-center justify-center">
        <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
          <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="white" />
        </svg>
      </div>
    ),
    oval: (
      <div className="w-full h-full flex items-center justify-center">
        <div className="rounded-full bg-white" style={{ width: '80%', height: '60%' }} />
      </div>
    ),
    cross: (
      <div className="w-full h-full flex items-center justify-center text-white text-7xl font-bold">
        +
      </div>
    )
  };

  return shapes[shape] || shapes.circle;
};

export const Card: React.FC<CardProps> = ({ card, onClick, isDisabled }) => {
  const colors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
    'from-rose-500 to-pink-500',
    'from-teal-500 to-green-500',
    'from-yellow-500 to-orange-500'
  ];

  // Consistent color based on pairId
  const colorGradient = colors[card.pairId % colors.length];

  return (
    <div
      className={`card-container ${card.isMatched ? 'matched' : ''}`}
      onClick={() => !isDisabled && !card.isFlipped && !card.isMatched && onClick()}
    >
      <div className={`card ${card.isFlipped || card.isMatched ? 'flipped' : ''}`}>
        {/* Card Back */}
        <div className="card-face card-back overflow-hidden">
          <div className="absolute inset-0 bg-black" />
          <img
            src={`${import.meta.env.BASE_URL}Card.png`}
            alt="back"
            className="relative w-full h-full object-contain p-2 opacity-90 drop-shadow-md"
          />
        </div>

        {/* Card Front */}
        <div className={`card-face card-front bg-gradient-to-br ${colorGradient}`}>
          <div className="card-content">
            {card.type === 'emoji' ? (
              <span className="card-emoji">{card.value}</span>
            ) : (
              <div className="card-shape">
                <ShapeRenderer shape={card.value} />
              </div>
            )}
          </div>
          {card.isMatched && (
            <div className="match-indicator">
              <span className="checkmark">✓</span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .card-container {
          perspective: 1000px;
          cursor: pointer;
          width: 100%;
          aspect-ratio: 3/4;
          position: relative;
        }

        .card-container.matched {
          animation: matchPulse 0.6s ease-out;
        }

        .card {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card.flipped {
          transform: rotateY(180deg);
        }

        .card-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: box-shadow 0.3s ease;
        }

        .card-container:hover .card-face {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        .card-back {
          transform: rotateY(0deg);
        }

        .card-front {
          transform: rotateY(180deg);
          color: white;
        }

        .card-content {
          z-index: 1;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-emoji {
          font-size: clamp(2rem, 6vw, 3.5rem);
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }

        .card-shape {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.2));
        }

        .match-indicator {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 24px;
          height: 24px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: checkBounce 0.5s ease-out;
          z-index: 10;
        }

        .checkmark {
          color: #10b981;
          font-size: 16px;
          font-weight: bold;
        }

        @keyframes matchPulse {
          0%, 100% {
            transform: scale(1);
          }
          25% {
            transform: scale(1.08);
          }
          50% {
            transform: scale(0.96);
          }
          75% {
            transform: scale(1.04);
          }
        }

        @keyframes checkBounce {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @media (max-width: 640px) {
          .card-face {
            border-radius: 8px;
          }
          
          .card-emoji {
            font-size: clamp(1.5rem, 8vw, 2.5rem);
          }

          .match-indicator {
            width: 20px;
            height: 20px;
            top: 4px;
            right: 4px;
          }

          .checkmark {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

import { useState } from 'react';

export default function TitleScreen({ onEnter }) {
  const [opening, setOpening] = useState(false);

  const handleClick = () => {
    setOpening(true);
    setTimeout(onEnter, 850);
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-box-bg text-white">
      <button
        onClick={handleClick}
        className={`text-7xl leading-none select-none ${opening ? 'animate-box-open' : 'animate-glow'}`}
        aria-label="ボックスを開く"
      >
        📦
      </button>
      <h1 className="mt-8 text-3xl font-bold tracking-wide">もしもボックスAI</h1>
      <p className="mt-2 text-box-accent">タップしてボックスを開く</p>
    </div>
  );
}

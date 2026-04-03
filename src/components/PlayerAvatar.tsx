import { useState } from 'react';

type PlayerAvatarProps = {
  name: string;
  photo: string;
  alt?: string;
  className?: string;
};

export function PlayerAvatar({ name, photo, alt, className = '' }: PlayerAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center rounded-[1.5rem] bg-[linear-gradient(135deg,_rgba(16,185,129,0.35),_rgba(8,15,12,0.95))] text-xl font-black uppercase text-white ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={photo}
      alt={alt ?? name}
      className={`rounded-[1.5rem] object-cover object-top ${className}`}
      onError={() => setFailed(true)}
    />
  );
}

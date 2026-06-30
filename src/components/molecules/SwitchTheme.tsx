'use client';

import { useEffect, useState } from 'react';

export default function SwitchTheme() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      setDark(true);
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    setMounted(true);
  }, []);

  const darkModeHandler = () => {
    if (dark) {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', '');
    } else {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setDark(!dark);
  };

  if (!mounted) return <div className="w-full h-5" />;

  return (
    <input
      checked={dark}
      onChange={darkModeHandler}
      type="checkbox"
      className="switchTheme flex justify-center items-center space-x-2 w-full"
    />
  );
}

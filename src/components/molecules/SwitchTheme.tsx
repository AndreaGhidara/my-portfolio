import { useEffect, useState } from 'react';

export default function SwitchTheme() {

  const [dark, setDark] = useState(false);

  const darkModeHandler = () => {
    if (dark) {
      document.body.classList.remove("dark");
      localStorage.setItem('theme', '')
    } else {
      document.body.classList.add("dark");
      localStorage.setItem('theme', 'dark')
    }
    setDark(!dark);
  };

  useEffect(() => {
    const theme = localStorage.getItem('theme');

    if (theme === 'dark') {
      setDark(true);
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }

  }, []);

  return (
    <>
      <input
        checked={dark}
        onChange={darkModeHandler}
        type="checkbox"
        className="switchTheme"
      />
    </>
  );
}
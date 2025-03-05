import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext'; // Adjust path as needed
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button onClick={toggleTheme} className="text-white bg-black px-4 py-2 rounded-lg hover:bg-gray-800 transition">
      <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} />
    </button>
  );
}

export default ThemeToggle;

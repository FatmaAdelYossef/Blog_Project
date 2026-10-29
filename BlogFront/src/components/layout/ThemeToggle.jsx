import { Moon, Sun } from 'lucide-react';
import { IconButton } from '../ui';
import { useTheme } from '../../context/ThemeContext';

/**
 * Switches between the light and dark surfaces. The label describes the action
 * rather than the current state so it stays unambiguous for screen readers.
 */
export function ThemeToggle({ variant = 'ghost', className }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <IconButton
      label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      icon={isDark ? <Sun /> : <Moon />}
      variant={variant}
      onClick={toggleTheme}
      className={className}
    />
  );
}

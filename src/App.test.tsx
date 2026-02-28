import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('should render the main application component', () => {
    render(<App />);
    expect(screen.getByText('Vite + React')).toBeInTheDocument(); // Assuming App.tsx still has this text
  });
});

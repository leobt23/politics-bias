import { render, screen } from '@testing-library/react';
import HomePage from './pages/Homepage/HomePage';

jest.mock('./components/LatestPollsChart/LatestPollsChart', () => () => (
  <div aria-label="Gráfico de sondagens" />
));

test('renders the editorial homepage', () => {
  render(<HomePage />);
  expect(screen.getByRole('heading', { name: /a política não cabe/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /dossiers em destaque/i })).toBeInTheDocument();
});

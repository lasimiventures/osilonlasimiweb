import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { QuoteProvider } from './context/QuoteContext';

function App() {
  return (
    <BrowserRouter>
      <QuoteProvider>
        <AppRoutes />
      </QuoteProvider>
    </BrowserRouter>
  );
}

export default App;

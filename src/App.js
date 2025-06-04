// App.js
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Puzzle from './Puzzle';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Render Puzzle at "/" without clicking anything */}
        <Route path="/" element={<Puzzle />} />
        {/* You can still have "/puzzle" if you need it */}
        <Route path="/puzzle" element={<Puzzle />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppDEMO1 from './AppDEMO1';
import AppMAIN from './AppMAIN';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppMAIN />} />
        <Route path="/demo" element={<AppDEMO1 />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import SummaryTable from './pages/SummaryTable';
import JobList from './pages/JobList';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="faturalar" element={<Invoices />} />
          <Route path="gelir-icmal" element={<SummaryTable type="GELİR" />} />
          <Route path="gider-icmal" element={<SummaryTable type="GİDER" />} />
          <Route path="gelen-isler" element={<JobList type="GELEN" />} />
          <Route path="giden-isler" element={<JobList type="GİDEN" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

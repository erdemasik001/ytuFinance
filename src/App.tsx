import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import SummaryTable from './pages/SummaryTable';
import JobList from './pages/JobList';
import Companies from './pages/Companies';
import Accounts from './pages/Accounts';
import BankAccounts from './pages/BankAccounts';
import Products from './pages/Products';
import Reports from './pages/Reports';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!user.username) return <Navigate to="/login" replace />;
  } catch {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="faturalar" element={<Invoices />} />
          <Route path="gelir-icmal" element={<SummaryTable type="GELİR" />} />
          <Route path="gider-icmal" element={<SummaryTable type="GİDER" />} />
          <Route path="gelen-isler" element={<JobList type="GELEN" />} />
          <Route path="giden-isler" element={<JobList type="GİDEN" />} />
          <Route path="firmalar" element={<Companies />} />
          <Route path="cariler" element={<Accounts />} />
          <Route path="banka-kasa" element={<BankAccounts />} />
          <Route path="urunler" element={<Products />} />
          <Route path="raporlar" element={<Reports />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

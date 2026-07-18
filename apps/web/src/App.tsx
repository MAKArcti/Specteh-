import { Navigate, Route, Routes } from 'react-router-dom';
import { UserRole } from '@spectech/shared-types';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { RequireAuth } from './components/RequireAuth';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';
import { AddEquipmentPage } from './pages/AddEquipmentPage';
import { CreateRequestPage } from './pages/CreateRequestPage';
import { OffersPage } from './pages/OffersPage';
import { DealPage } from './pages/DealPage';
import { MyDealsPage } from './pages/MyDealsPage';

export function App() {
  return (
    <AuthProvider>
      <Header />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/deals/:dealId" element={<DealPage />} />
        </Route>
        <Route element={<RequireAuth allowedRoles={[UserRole.CUSTOMER]} />}>
          <Route path="/requests/new" element={<CreateRequestPage />} />
          <Route path="/requests/:requestId/offers" element={<OffersPage />} />
        </Route>
        <Route element={<RequireAuth allowedRoles={[UserRole.EQUIPMENT_OWNER]} />}>
          <Route path="/equipment/new" element={<AddEquipmentPage />} />
          <Route path="/deals/mine" element={<MyDealsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

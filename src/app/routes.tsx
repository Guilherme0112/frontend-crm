import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/src/auth/ProtectedRoute';
import { AppLayout } from '@/src/components/layout/AppLayout';
import { LoginPage } from '@/src/features/auth/LoginPage';
import { RegisterPage } from '@/src/features/auth/RegisterPage';
import { DashboardPage } from '@/src/features/dashboard/DashboardPage';
import { CrmsPage } from '@/src/features/crm/CrmsPage';
import { CrmBoardPage } from '@/src/features/crm/CrmBoardPage';
import { LeadDetailPage } from '@/src/features/leads/LeadDetailPage';
import { SendingTemplatesPage } from '@/src/features/templates/SendingTemplatesPage';
import { GroupsPage } from '@/src/features/groups/GroupsPage';
import { BillingPage } from '@/src/features/billing/BillingPage';
import { InvoicesPage } from '@/src/features/billing/InvoicesPage';
import { CompanyPage } from '@/src/features/company/CompanyPage';
import { TeamPage } from '@/src/features/team/TeamPage';
import { ProfilePage } from '@/src/features/profile/ProfilePage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/crms" element={<CrmsPage />} />
          <Route path="/crms/:id/board" element={<CrmBoardPage />} />
          <Route path="/leads/:id" element={<LeadDetailPage />} />
          <Route path="/sending-templates" element={<SendingTemplatesPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/company" element={<CompanyPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

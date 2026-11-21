import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/src/auth/ProtectedRoute';
import { AppLayout } from '@/src/components/layout/AppLayout';
import { LoginPage } from '@/src/features/auth/LoginPage';
import { RegisterPage } from '@/src/features/auth/RegisterPage';
import { DashboardPage } from '@/src/features/dashboard/DashboardPage';
import { CrmsPage } from '@/src/features/crm/CrmsPage';
import { CrmBoardPage } from '@/src/features/crm/CrmBoardPage';
import { IntegrationPage } from '@/src/features/crm-integration/IntegrationPage';
import { LeadDetailPage } from '@/src/features/leads/LeadDetailPage';
import { LeadHistoryPage } from '@/src/features/leads/LeadHistoryPage';
import { SendingTemplatesPage } from '@/src/features/templates/SendingTemplatesPage';
import { GroupsPage } from '@/src/features/groups/GroupsPage';
import { GroupPage } from '@/src/features/groups/GroupPage';
import { GroupHistoryPage } from '@/src/features/groups/GroupHistoryPage';
import { CrmAuditPage } from '@/src/features/audit/CrmAuditPage';
import { CrmDashboardPage } from '@/src/features/dashboard/CrmDashboardPage';
import { CrmsOverviewPage } from '@/src/features/dashboard/CrmsOverviewPage';
import { EmailConfigsPage } from '@/src/features/email-configs/EmailConfigsPage';
import { WhatsappSendersPage } from '@/src/features/whatsapp-senders/WhatsappSendersPage';
import { WhatsappTemplatesPage } from '@/src/features/whatsapp-templates/WhatsappTemplatesPage';
import { WhatsappUnofficialInstancesPage } from '@/src/features/whatsapp-unofficial-instances/WhatsappUnofficialInstancesPage';
import { WhatsappUnofficialTemplatesPage } from '@/src/features/whatsapp-unofficial-templates/WhatsappUnofficialTemplatesPage';
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
          <Route path="/crms/dashboard" element={<CrmsOverviewPage />} />
          <Route path="/crms/:id/board" element={<CrmBoardPage />} />
          <Route path="/crms/:id/integration" element={<IntegrationPage />} />
          <Route path="/crms/:id/audit" element={<CrmAuditPage />} />
          <Route path="/crms/:id/dashboard" element={<CrmDashboardPage />} />
          <Route path="/leads/:id" element={<LeadDetailPage />} />
          <Route path="/leads/:id/history" element={<LeadHistoryPage />} />
          <Route path="/sending-templates" element={<SendingTemplatesPage />} />
          <Route path="/disparos" element={<GroupsPage />} />
          <Route path="/disparos/:id" element={<GroupPage />} />
          <Route path="/disparos/:id/historico" element={<GroupHistoryPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/:id" element={<GroupPage />} />
          <Route path="/groups/:id/historico" element={<GroupHistoryPage />} />
          <Route path="/email-configs" element={<EmailConfigsPage />} />
          <Route path="/whatsapp-senders" element={<WhatsappSendersPage />} />
          <Route path="/whatsapp-templates" element={<WhatsappTemplatesPage />} />
          <Route path="/whatsapp-unofficial-instances" element={<WhatsappUnofficialInstancesPage />} />
          <Route path="/whatsapp-unofficial-templates" element={<WhatsappUnofficialTemplatesPage />} />
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

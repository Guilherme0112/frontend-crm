import { useParams } from 'react-router-dom';
import { GroupSendSection } from './GroupSendSection';
import { WhatsappDispatchLogsSection } from './WhatsappDispatchLogsSection';
import { WhatsappUnofficialDispatchLogsSection } from './WhatsappUnofficialDispatchLogsSection';
import { PageHeader } from '@/src/components/layout/PageHeader';

export function GroupHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const groupId = Number(id);

  return (
    <div className="space-y-5 py-6">
      <PageHeader
        trail={[{ to: `/disparos/${groupId}`, label: 'Voltar para o grupo' }]}
        eyebrow="Disparos"
        title="Histórico de disparos"
        description="Acompanhe envios de e-mail e WhatsApp deste grupo."
      />

      <GroupSendSection groupId={groupId} />
      <WhatsappDispatchLogsSection groupId={groupId} resolveNames={false} />
      <WhatsappUnofficialDispatchLogsSection groupId={groupId} resolveNames={false} />
    </div>
  );
}

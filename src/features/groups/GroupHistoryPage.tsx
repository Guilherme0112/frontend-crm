import { ArrowLeft, History } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { GroupSendSection } from './GroupSendSection';
import { WhatsappDispatchLogsSection } from './WhatsappDispatchLogsSection';
import { WhatsappUnofficialDispatchLogsSection } from './WhatsappUnofficialDispatchLogsSection';

export function GroupHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const groupId = Number(id);

  return (
    <div className="space-y-5 py-6">
      <Link
        to={`/disparos/${groupId}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Voltar para o grupo</span>
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-600/15 dark:bg-blue-950/50 dark:text-blue-400 dark:ring-blue-400/15">
          <History className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500">Disparos</p>
          <h1 className="truncate font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Histórico de disparos
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">Acompanhe envios de e-mail e WhatsApp deste grupo.</p>
        </div>
      </div>

      <GroupSendSection groupId={groupId} />
      <WhatsappDispatchLogsSection groupId={groupId} resolveNames={false} />
      <WhatsappUnofficialDispatchLogsSection groupId={groupId} resolveNames={false} />
    </div>
  );
}

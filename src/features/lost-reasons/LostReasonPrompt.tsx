import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Autocomplete, type AutocompleteOption } from '@/src/components/common/Autocomplete';
import { Modal } from '@/src/components/common/Modal';
import { ModalActions } from '@/src/components/common/ModalActions';
import { FormField } from '@/src/components/common/FormField';
import { useLostReasonsQuery } from './hooks';

/**
 * Pergunta o motivo antes de concluir a perda.
 *
 * O momento é esse e não outro: perguntar depois, numa tela de edição, é
 * perguntar para quem já virou a página — e foi por isso que o gráfico de
 * motivos nasceu vazio. Aqui a escolha é parte do gesto de perder o negócio.
 *
 * Só lista motivos **ativos**: o que foi desativado continua valendo no
 * histórico, mas não deve ser oferecido para novas perdas.
 */
export function LostReasonPrompt({
  open,
  stepName,
  leadName,
  isPending,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  stepName: string;
  leadName: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: (lostReasonId: number) => void;
}) {
  const reasonsQuery = useLostReasonsQuery(true);
  const reasons = reasonsQuery.data ?? [];
  const options: AutocompleteOption[] = reasons.map((reason) => ({
    value: String(reason.id),
    label: reason.name,
  }));
  const [selected, setSelected] = useState<number | null>(null);

  /*
    Pré-seleciona o primeiro para o caminho comum ser "confirmar". Obrigar a
    escolha no meio de um arrastar-e-soltar faria o usuário desistir e voltar o
    card, que é como um campo obrigatório vira campo sempre igual.
  */
  useEffect(() => {
    if (open && selected === null && reasons.length > 0) {
      setSelected(reasons[0].id);
    }
  }, [open, selected, reasons]);

  useEffect(() => {
    if (!open) {
      setSelected(null);
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Por que este negócio foi perdido?"
      description={`${leadName} está indo para "${stepName}".`}
    >
      <form
        noValidate
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();

          if (selected !== null) {
            onConfirm(selected);
          }
        }}
      >
        <FormField label="Motivo" htmlFor="lost-reason">
          <Autocomplete
            id="lost-reason"
            value={selected !== null ? String(selected) : ''}
            onChange={(value) => setSelected(value ? Number(value) : null)}
            options={options}
            placeholder="Selecione o motivo"
            emptyMessage="Nenhum motivo ativo"
            loading={reasonsQuery.isPending}
          />
        </FormField>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Não achou o motivo certo?{' '}
          <Link
            to="/crms?motivos=1"
            className="font-medium text-blue-600 underline underline-offset-2 dark:text-blue-400"
          >
            Cadastre os seus
          </Link>{' '}
          — é o que faz a análise de causa do funil valer alguma coisa.
        </p>

        <ModalActions
          onCancel={onCancel}
          isPending={isPending}
          disabled={selected === null}
          submitLabel="Marcar como perdido"
        />
      </form>
    </Modal>
  );
}

import { useRef, useState, type ReactNode } from 'react';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Tooltip from '@mui/material/Tooltip';

/**
 * O "?" ao lado de uma métrica: explica **como ler** aquele número.
 *
 * Não é decoração. Quase toda métrica destes dashboards tem uma armadilha de
 * leitura — denominador que não é o que parece, janela por fechamento em vez de
 * criação, taxa suprimida por amostra pequena. Quem não souber disso lê o
 * número errado com confiança, que é pior que não ler.
 *
 * **Abre no clique, não só no hover.** Dica que só aparece ao passar o mouse não
 * existe no celular, e é lá que metade das consultas acontece.
 */
export function MetricHelp({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  /*
    Num toque o navegador dispara `pointerenter` e logo depois `click`: sem
    distinguir a origem, o primeiro abriria e o segundo fecharia na mesma
    batida, e no celular o "?" pareceria não funcionar.
  */
  const openedByHover = useRef(false);

  const close = () => {
    openedByHover.current = false;
    setOpen(false);
  };

  return (
    <ClickAwayListener onClickAway={close}>
      <span className="inline-flex align-middle">
        <Tooltip
          open={open}
          title={<span className="block text-[12px] leading-relaxed">{children}</span>}
          placement="top"
          arrow
          // Controlado de ponta a ponta: os gatilhos ficam no botão, para o
          // comportamento ser o mesmo no mouse, no toque e no teclado.
          disableFocusListener
          disableHoverListener
          disableTouchListener
          slotProps={{
            tooltip: {
              sx: {
                maxWidth: 280,
                padding: '10px 12px',
                fontSize: 12,
                backgroundColor: 'rgb(24 24 27)',
              },
            },
            arrow: { sx: { color: 'rgb(24 24 27)' } },
          }}
        >
          <button
            type="button"
            aria-label={`Como ler: ${label}`}
            aria-expanded={open}
            onPointerEnter={(event) => {
              if (event.pointerType !== 'mouse') {
                return;
              }

              openedByHover.current = true;
              setOpen(true);
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === 'mouse' && openedByHover.current) {
                close();
              }
            }}
            onClick={() => {
              // Já aberto pelo mouse: o clique fixa, em vez de fechar o que o
              // usuário acabou de abrir.
              if (openedByHover.current) {
                openedByHover.current = false;

                return;
              }

              setOpen((previous) => !previous);
            }}
            onFocus={() => setOpen(true)}
            onBlur={close}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                close();
              }
            }}
            className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-zinc-950/[0.12] text-[10px] font-semibold leading-none text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-white/[0.15] dark:text-zinc-500 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
          >
            ?
          </button>
        </Tooltip>
      </span>
    </ClickAwayListener>
  );
}

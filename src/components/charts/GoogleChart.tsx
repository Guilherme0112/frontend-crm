import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/src/theme/ThemeContext';

/**
 * Adaptador único sobre o Google Charts.
 *
 * **Nenhuma tela fala com a biblioteca direto.** Trocar Google Charts por outra
 * coisa deve tocar só este arquivo — foi a condição para adotar uma dependência
 * de gráfico no projeto, que até aqui não tinha nenhuma.
 *
 * O carregamento é por script externo e **sob demanda**: só a primeira tela de
 * gráfico paga o custo, e quem nunca abrir o funil não baixa nada. A promessa é
 * compartilhada, então duas telas montadas juntas carregam uma vez só.
 */
type ChartType = 'ColumnChart' | 'BarChart' | 'LineChart' | 'PieChart';

/** Linha de dados: primeiro item é o rótulo, os demais são valores. */
export type ChartRow = [string, ...(number | string)[]];

interface GoogleChartProps {
  type: ChartType;
  /** Cabeçalho das colunas; o primeiro é o eixo de categorias. */
  columns: string[];
  rows: ChartRow[];
  height?: number;
  /** Cores das séries, na ordem. */
  colors?: string[];
  stacked?: boolean;
  /** Texto lido por leitor de tela no lugar do canvas. */
  ariaLabel: string;
}

const LOADER_SRC = 'https://www.gstatic.com/charts/loader.js';

let loaderPromise: Promise<void> | null = null;

function loadGoogleCharts(): Promise<void> {
  if (loaderPromise) {
    return loaderPromise;
  }

  loaderPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${LOADER_SRC}"]`);

    const start = () => {
      const google = (window as unknown as { google?: GoogleNamespace }).google;

      if (!google?.charts) {
        reject(new Error('Google Charts não ficou disponível após o carregamento.'));

        return;
      }

      google.charts.load('current', { packages: ['corechart'] });
      google.charts.setOnLoadCallback(() => resolve());
    };

    if (existing) {
      existing.addEventListener('load', start, { once: true });
      existing.addEventListener('error', () => reject(new Error('Falha ao carregar o Google Charts.')), { once: true });

      return;
    }

    const script = document.createElement('script');
    script.src = LOADER_SRC;
    script.async = true;
    script.onload = start;
    script.onerror = () => reject(new Error('Falha ao carregar o Google Charts.'));
    document.head.appendChild(script);
  });

  return loaderPromise;
}

/** Tipagem mínima do que este adaptador usa — evita uma dependência só de tipos. */
interface GoogleNamespace {
  charts: {
    load: (version: string, options: { packages: string[] }) => void;
    setOnLoadCallback: (callback: () => void) => void;
  };
  visualization: {
    arrayToDataTable: (data: unknown[][]) => unknown;
    [chart: string]: unknown;
  };
}

export function GoogleChart({
  type,
  columns,
  rows,
  height = 240,
  colors,
  stacked = false,
  ariaLabel,
}: GoogleChartProps) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;

    loadGoogleCharts()
      .then(() => {
        if (!cancelled) {
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== 'ready' || !container.current) {
      return;
    }

    const google = (window as unknown as { google?: GoogleNamespace }).google;

    if (!google) {
      return;
    }

    const dark = resolvedTheme === 'dark';
    const text = dark ? '#a1a1aa' : '#52525b';

    const data = google.visualization.arrayToDataTable([columns, ...rows]);
    const ChartCtor = google.visualization[type] as new (el: Element) => {
      draw: (data: unknown, options: unknown) => void;
    };

    const chart = new ChartCtor(container.current);

    /*
      Opções num objeto só, usado no primeiro desenho **e** no redesenho do
      resize. O redesenho passava apenas altura e fundo, então qualquer
      mudança de tamanho da janela devolvia o gráfico ao padrão do Google:
      legenda à direita (com os rótulos cortados), paleta azul/vermelho/
      laranja no lugar da nossa, e as séries empilhadas voltando a ser barras
      separadas. O gráfico mentia sobre a própria forma depois de um resize.
    */
    /*
      Opções recalculadas a cada desenho, não congeladas num objeto: a
      margem do eixo depende da largura disponível, e o redesenho do resize
      é justamente quando ela muda.
    */
    const buildOptions = () => {
      // `left` fixo em 90px comia um quarto de um celular de 360px e
      // espremia o gráfico contra a borda direita.
      const narrow = (container.current?.clientWidth ?? 0) < 480;

      return {
        height,
        // Fundo transparente: o cartão por trás já tem a cor do tema, e um
        // fundo fixo apareceria como um retângulo branco no modo escuro.
        backgroundColor: 'transparent',
        chartArea: {
          left: narrow ? 52 : 90,
          top: 12,
          width: narrow ? '74%' : '70%',
          height: '80%',
        },
        colors,
        isStacked: stacked,
        /*
          Sempre sem legenda do Google: ela não cabia no `chartArea` em tela
          larga e, no celular, virava um paginador "◀ 1/2 ▶" dentro do
          gráfico. Quem identifica as cores é a lista de números abaixo,
          que tem os marcadores e é a mesma fonte dos valores.
        */
        legend: { position: 'none' },
        hAxis: { textStyle: { color: text }, gridlines: { color: dark ? '#27272a' : '#e4e4e7' } },
        vAxis: { textStyle: { color: text }, gridlines: { color: dark ? '#27272a' : '#e4e4e7' } },
        tooltip: { textStyle: { fontSize: 12 } },
        fontName: 'inherit',
      };
    };

    chart.draw(data, buildOptions());

    const redraw = () => chart.draw(data, buildOptions());
    window.addEventListener('resize', redraw);

    return () => window.removeEventListener('resize', redraw);
  }, [status, type, columns, rows, height, colors, stacked, resolvedTheme]);

  if (status === 'error') {
    return (
      <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Não foi possível carregar o gráfico. Os números da tabela abaixo continuam válidos.
      </p>
    );
  }

  return (
    <div
      ref={container}
      role="img"
      aria-label={ariaLabel}
      style={{ height }}
      className="w-full [&_svg]:block"
    />
  );
}

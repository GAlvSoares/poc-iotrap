const API_URL = process.env.EXPO_PUBLIC_IOTRAP_API_URL;

if (!API_URL) {
  throw new Error('Defina EXPO_PUBLIC_IOTRAP_API_URL no arquivo .env.local');
}

const TEMPO_LIMITE_MS = 8000;

export const LIMITE_TENTATIVAS = 3;

export type TipoEvento = 'cowrie.login.failed' | 'cowrie.login.success' | 'cowrie.command.input';

export type Ataque = {
  id: string;
  timestamp: string;
  eventid: TipoEvento;
  src_ip: string;
  pais: string | null;
  username: string | null;
  password: string | null;
  input: string | null;
};

type RespostaAtaques = {
  gerado_em: string;
  fonte: string;
  ataques: Ataque[];
};

export async function buscarAtaques(signal: AbortSignal): Promise<Ataque[]> {
  const controle = new AbortController();
  let estourouTempo = false;
  const cancelar = () => controle.abort();
  const temporizador = setTimeout(() => {
    estourouTempo = true;
    controle.abort();
  }, TEMPO_LIMITE_MS);
  signal.addEventListener('abort', cancelar);

  try {
    const resposta = await fetch(`${API_URL}/ataques?limite=50`, { signal: controle.signal });
    if (!resposta.ok) {
      throw new Error(`O IoTrap respondeu com erro ${resposta.status}`);
    }
    const corpo: RespostaAtaques = await resposta.json();
    return corpo.ataques;
  } catch (erro) {
    if (estourouTempo) {
      throw new Error(`O IoTrap não respondeu em ${TEMPO_LIMITE_MS / 1000} segundos`);
    }
    throw erro;
  } finally {
    clearTimeout(temporizador);
    signal.removeEventListener('abort', cancelar);
  }
}

export function ipsBloqueados(ataques: Ataque[]): Set<string> {
  const falhas = new Map<string, number>();
  for (const ataque of ataques) {
    if (ataque.eventid === 'cowrie.login.failed') {
      falhas.set(ataque.src_ip, (falhas.get(ataque.src_ip) ?? 0) + 1);
    }
  }
  return new Set([...falhas].filter(([, total]) => total >= LIMITE_TENTATIVAS).map(([ip]) => ip));
}

export function formatarHora(momento: string | number): string {
  return new Date(momento).toLocaleTimeString('pt-BR');
}

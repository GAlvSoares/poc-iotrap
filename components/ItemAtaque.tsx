import { StyleSheet, Text, View } from 'react-native';

import { Ataque, TipoEvento, formatarHora } from '../servicos/iotrap';

const ROTULOS: Record<TipoEvento, string> = {
  'cowrie.login.failed': 'Login recusado',
  'cowrie.login.success': 'Login aceito',
  'cowrie.command.input': 'Comando',
};

const CORES: Record<TipoEvento, string> = {
  'cowrie.login.failed': '#f5a524',
  'cowrie.login.success': '#f31260',
  'cowrie.command.input': '#7c5cff',
};

type Props = {
  ataque: Ataque;
  bloqueado: boolean;
};

export function ItemAtaque({ ataque, bloqueado }: Props) {
  const detalhe = ataque.eventid === 'cowrie.command.input'
    ? `$ ${ataque.input}`
    : `${ataque.username} / ${ataque.password}`;

  return (
    <View style={estilos.item}>
      <View style={estilos.linha}>
        <Text style={[estilos.tipo, { color: CORES[ataque.eventid] }]}>{ROTULOS[ataque.eventid]}</Text>
        <Text style={estilos.hora}>{formatarHora(ataque.timestamp)}</Text>
      </View>
      <View style={estilos.linha}>
        <Text style={estilos.ip}>
          {ataque.src_ip}
          {ataque.pais ? ` · ${ataque.pais}` : ''}
        </Text>
        {bloqueado && <Text style={estilos.bloqueado}>BLOQUEADO</Text>}
      </View>
      <Text style={estilos.detalhe} numberOfLines={1}>{detalhe}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2a2f3a',
    gap: 4,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tipo: {
    fontWeight: '700',
  },
  hora: {
    color: '#8b93a7',
    fontVariant: ['tabular-nums'],
  },
  ip: {
    color: '#e6e9ef',
  },
  bloqueado: {
    color: '#0d0f14',
    backgroundColor: '#f31260',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
  },
  detalhe: {
    color: '#8b93a7',
    fontFamily: 'monospace',
  },
});

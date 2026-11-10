import { StyleSheet, Text, View } from 'react-native';

import { formatarHora } from '../servicos/iotrap';

type Props = {
  semConexao: boolean;
  comErro: boolean;
  atualizadoEm: number;
};

export function AvisoConexao({ semConexao, comErro, atualizadoEm }: Props) {
  if (!semConexao && !comErro) {
    return null;
  }

  const hora = formatarHora(atualizadoEm);
  const texto = semConexao
    ? `Sem conexão. Mostrando os dados salvos às ${hora}.`
    : `O IoTrap não respondeu. Mostrando os dados de ${hora}.`;

  return (
    <View style={[estilos.aviso, semConexao ? estilos.offline : estilos.erro]}>
      <Text style={estilos.texto}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  aviso: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
  },
  offline: {
    backgroundColor: '#3b3f4a',
  },
  erro: {
    backgroundColor: '#5c1a2b',
  },
  texto: {
    color: '#e6e9ef',
  },
});

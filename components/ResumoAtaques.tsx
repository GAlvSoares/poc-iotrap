import { StyleSheet, Text, View } from 'react-native';

type Props = {
  eventos: number;
  ips: number;
  bloqueados: number;
};

export function ResumoAtaques({ eventos, ips, bloqueados }: Props) {
  return (
    <View style={estilos.resumo}>
      <Numero valor={eventos} rotulo="eventos" />
      <Numero valor={ips} rotulo="IPs atacantes" />
      <Numero valor={bloqueados} rotulo="bloqueados" />
    </View>
  );
}

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <View style={estilos.numero}>
      <Text style={estilos.valor}>{valor}</Text>
      <Text style={estilos.rotulo}>{rotulo}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  resumo: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  numero: {
    flex: 1,
    backgroundColor: '#171b24',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  valor: {
    color: '#e6e9ef',
    fontSize: 22,
    fontWeight: '700',
  },
  rotulo: {
    color: '#8b93a7',
    fontSize: 12,
  },
});

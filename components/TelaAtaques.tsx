import { useIsRestoring, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { buscarAtaques, ipsBloqueados } from '../servicos/iotrap';
import { AvisoConexao } from './AvisoConexao';
import { ItemAtaque } from './ItemAtaque';
import { ResumoAtaques } from './ResumoAtaques';

const INTERVALO_MS = 5000;

export function TelaAtaques() {
  const restaurando = useIsRestoring();
  const [puxando, setPuxando] = useState(false);
  const consulta = useQuery({
    queryKey: ['ataques'],
    queryFn: ({ signal }) => buscarAtaques(signal),
    refetchInterval: INTERVALO_MS,
    retry: 1,
  });

  const semConexao = consulta.fetchStatus === 'paused';

  async function atualizar() {
    setPuxando(true);
    await consulta.refetch();
    setPuxando(false);
  }

  if (restaurando) {
    return <Centro texto="Abrindo os dados salvos..." carregando />;
  }

  if (!consulta.data) {
    if (consulta.isError) {
      return (
        <Centro texto={`Não foi possível falar com o IoTrap.\n${consulta.error.message}`}>
          <Pressable style={estilos.botao} onPress={() => consulta.refetch()}>
            <Text style={estilos.textoBotao}>Tentar de novo</Text>
          </Pressable>
        </Centro>
      );
    }
    if (semConexao) {
      return <Centro texto="Sem conexão e nenhum dado salvo ainda. Conecte o celular à rede para buscar os ataques." />;
    }
    return <Centro texto="Buscando ataques no IoTrap..." carregando />;
  }

  const ataques = consulta.data;
  const bloqueados = ipsBloqueados(ataques);
  const ips = new Set(ataques.map((ataque) => ataque.src_ip));

  return (
    <FlatList
      data={ataques}
      keyExtractor={(ataque) => ataque.id}
      renderItem={({ item }) => <ItemAtaque ataque={item} bloqueado={bloqueados.has(item.src_ip)} />}
      ListHeaderComponent={
        <View>
          <Text style={estilos.titulo}>IoTrap · ataques recentes</Text>
          <AvisoConexao semConexao={semConexao} comErro={consulta.isError} atualizadoEm={consulta.dataUpdatedAt} />
          <ResumoAtaques eventos={ataques.length} ips={ips.size} bloqueados={bloqueados.size} />
        </View>
      }
      ListEmptyComponent={<Text style={estilos.vazio}>Nenhum ataque capturado ainda.</Text>}
      refreshControl={<RefreshControl refreshing={puxando} onRefresh={atualizar} tintColor="#e6e9ef" />}
    />
  );
}

function Centro({ texto, carregando, children }: { texto: string; carregando?: boolean; children?: React.ReactNode }) {
  return (
    <View style={estilos.centro}>
      {carregando && <ActivityIndicator color="#e6e9ef" />}
      <Text style={estilos.mensagem}>{texto}</Text>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  titulo: {
    color: '#e6e9ef',
    fontSize: 20,
    fontWeight: '700',
    padding: 16,
  },
  vazio: {
    color: '#8b93a7',
    textAlign: 'center',
    padding: 32,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  mensagem: {
    color: '#e6e9ef',
    textAlign: 'center',
  },
  botao: {
    backgroundColor: '#7c5cff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  textoBotao: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

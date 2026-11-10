import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, AppStateStatus, Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { TelaAtaques } from './components/TelaAtaques';

const UM_DIA_MS = 1000 * 60 * 60 * 24;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: UM_DIA_MS,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((estado) => {
    setOnline(!!estado.isConnected);
  });
});

function aoMudarEstadoDoApp(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

export default function App() {
  useEffect(() => {
    const inscricao = AppState.addEventListener('change', aoMudarEstadoDoApp);
    return () => inscricao.remove();
  }, []);

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: UM_DIA_MS }}>
      <SafeAreaProvider>
        <SafeAreaView style={estilos.tela}>
          <TelaAtaques />
          <StatusBar style="light" />
        </SafeAreaView>
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: '#0d0f14',
  },
});

# Diário de pesquisa

## Contexto do TCC
O IoTrap é um honeypot de alta interação (Cowrie) que captura tentativas de invasão SSH/Telnet contra dispositivos IoT, enriquece os IPs com VirusTotal e GeoIP, bloqueia os atacantes no iptables e indexa tudo no Elasticsearch para análise no Kibana. Hoje só dá para acompanhar os ataques pelo Kibana, no computador.

## Pergunta de pesquisa
Como o `@tanstack/react-query` permite que um app Expo mostre os ataques capturados pelo IoTrap quase em tempo real, tratando a espera, as falhas da API e a falta de conexão do celular sem perder os últimos dados vistos?

Trilha: consumo de API (o TCC não tem app, então a PoC é um cliente móvel mínimo para ele).

## Alternativas consideradas
| Opção | Serve para | Funciona no Expo Go? | Decisão |
|-------|------------|----------------------|---------|
| `fetch` + `useEffect` (hook `useFetch` próprio) | Buscar dados uma vez por tela | Sim, é JS puro | Não. Polling, nova tentativa, cache e estado offline teriam que ser escritos à mão |
| `@tanstack/react-query` | Cache de dados do servidor, polling (`refetchInterval`), retry e pausa quando offline | Sim, é JS puro e a doc diz que funciona com React Native | Sim. Resolve espera, erro e offline com configuração, não com código próprio |
| App consultando o Elasticsearch direto | Ler o índice `cowrie-log-*` sem servidor no meio | Sim | Não. Exigiria pôr usuário e senha do `elastic` no app, e a doc do Expo avisa que variáveis `EXPO_PUBLIC_` ficam legíveis no binário |
| `@react-native-community/netinfo` | Saber se o aparelho tem rede, para o `onlineManager` | Sim ("Included in Expo Go" na doc do SDK 58) | Sim |
| `expo-network` | Mesma função do NetInfo | Não conferido | Não. A doc do TanStack mostra as duas, fiquei com o exemplo principal |
| `@react-native-async-storage/async-storage` + persister do TanStack | Guardar o cache da consulta e restaurar ao abrir o app | Sim (doc do SDK 58, versão recomendada 2.2.0) | Sim. São só os últimos 50 eventos, chave-valor resolve |
| `expo-sqlite` | Banco local com consultas | Não conferido | Não. Seria preciso para histórico grande e filtros, não para um cache de tela |

## Como funciona
1. `servidor.py` expõe `GET /ataques?limite=50` com eventos no formato do Cowrie (`eventid`, `src_ip`, `username`, `password`, `input`, país do GeoIP). No modo `elasticsearch` ele consulta o índice `cowrie-log-*` que o Logstash do IoTrap já alimenta.
2. `useQuery` busca a lista e repete a cada 5 s (`refetchInterval`). Falhou: tenta mais uma vez (`retry: 1`) e, se continuar falhando, mantém os últimos dados e marca `isError`.
3. `onlineManager` ouve o NetInfo. Sem rede, a consulta fica `paused` em vez de falhar, e a tela mostra o aviso de sem conexão. Quando a rede volta, a consulta é refeita sozinha.
4. `focusManager` ouve o `AppState`: o app volta do segundo plano e já atualiza.
5. `PersistQueryClientProvider` salva o cache no AsyncStorage. Ao abrir o app, os últimos ataques aparecem antes da primeira resposta da API. O `gcTime` precisa ser maior ou igual ao `maxAge` do persister (24 h nos dois).
6. A etiqueta BLOQUEADO é calculada a partir da lista (3 logins recusados, mesma regra do `bloquear.py`), sem virar estado.

## Fontes oficiais lidas
- TanStack Query, React Native (https://tanstack.com/query/latest/docs/framework/react/react-native)
- TanStack Query, persistQueryClient (https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient)
- TanStack Query, createAsyncStoragePersister (https://tanstack.com/query/latest/docs/framework/react/plugins/createAsyncStoragePersister)
- TanStack Query, referência de useIsRestoring (https://tanstack.com/query/latest/docs/framework/react/reference/functions/useIsRestoring)
- Expo SDK 58, @react-native-community/netinfo (https://docs.expo.dev/versions/v58.0.0/sdk/netinfo/)
- Expo SDK 58, @react-native-async-storage/async-storage (https://docs.expo.dev/versions/v58.0.0/sdk/async-storage/)
- Expo, Environment variables (https://docs.expo.dev/guides/environment-variables/)
- Expo, MCP Server (https://docs.expo.dev/mcp/)
- Repositório do IoTrap: `logstash-cowrie.conf` e `bloquear.py` (https://github.com/LCDAndrade/IoTrap-TCC)

## Onde a IA errou

### 1. Import do pacote errado
- Pedido: montar o `App` com o cache do react-query salvo no AsyncStorage e uma tela de carregamento enquanto o cache é restaurado.
- O que veio: `import { useIsRestoring } from '@tanstack/react-query-persist-client'`. O Claude tirou esse import de uma página de documentação não oficial que apareceu na busca.
- Como percebi: `npx tsc --noEmit` falhou com `TS2305: Module '"@tanstack/react-query-persist-client"' has no exported member 'useIsRestoring'`.
- O certo: a referência oficial mostra o hook definido em `react-query/src/IsRestoringProvider.ts`, então o import é `import { useIsRestoring } from '@tanstack/react-query'`.

### 2. Exemplo com o pacote trocado
- Pedido: buscar como ligar o `onlineManager` à rede do aparelho.
- O que veio: uma página de documentação gerada por IA (tessl.io) mostrava `const NetInfo = require('@react-native-async-storage/async-storage')` no exemplo de detecção de rede. Esse é o pacote de armazenamento, não o de rede.
- Como percebi: comparando com a página oficial do TanStack e com a doc do Expo.
- O certo: `import NetInfo from '@react-native-community/netinfo'` e `NetInfo.addEventListener(...)`, como está na doc oficial.

### 3. Erros do Copilot durante a construção
- Pedido: [preencher]
- O que veio: [preencher]
- Como percebi: [preencher]
- O certo: [preencher]

## Outras descobertas
- O npm entrega `@react-native-async-storage/async-storage` 3.1.1, mas a doc do SDK 58 recomenda 2.2.0. `npx expo install` instalou a 2.2.0. Com `npm install` direto, a versão do JS não bateria com o módulo nativo do Expo Go.
- `EXPO_PUBLIC_IOTRAP_API_URL` só funciona escrito como `process.env.EXPO_PUBLIC_IOTRAP_API_URL`. A doc do Expo diz que `process.env['...']` ou desestruturar `process.env` não é substituído no build.
- A apostila diz que o MCP do Expo precisa só de uma conta gratuita. A doc do Expo pede uma conta, mas marca a ferramenta `search_documentation` como exclusiva de plano pago. `read_documentation` não tem essa marcação. A doc também não lista ferramenta de instalar pacotes: a instalação continua sendo `npx expo install` no terminal.
- O Expo Go carrega o JavaScript do Metro no computador. Por isso o teste de abrir o app totalmente sem rede não funciona no Expo Go: o teste de fechar e abrir é feito com a API desligada, e o modo avião é testado com o app já aberto. Abrir sem rede de verdade exigiria uma development build.
- O `logstash-cowrie.conf` do repositório público do IoTrap tem a senha do `elastic` escrita no arquivo. Na API da PoC ela vem de variável de ambiente.

## Resultado e próximos passos no TCC
- [preencher depois de testar no aparelho: quais critérios passaram e o que se viu na tela]
- O app pode virar um painel móvel do IoTrap: a API `/ataques` lê o Elasticsearch que já existe, sem mudar o pipeline.
- Próximo passo natural: alerta no celular quando um IP for bloqueado (`expo-notifications`, que pede development build para push).
- Tirar a senha do `elastic` do repositório público e passar para variável de ambiente.

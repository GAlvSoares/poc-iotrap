# PoC IoTrap Mobile

Prova de conceito da disciplina de Desenvolvimento de Aplicativos Híbridos: um app Expo que mostra os ataques capturados pelo IoTrap quase em tempo real, usando `@tanstack/react-query`.

## Como rodar

O celular e o computador precisam estar na mesma rede Wi-Fi.

### 1. API

Descubra o IP do computador na rede (`ipconfig` no Windows, `ip a` no Linux).

PowerShell:

```powershell
$env:IOTRAP_API_HOST="0.0.0.0"
$env:IOTRAP_API_PORTA="8000"
$env:IOTRAP_API_FONTE="mock"
$env:IOTRAP_API_ATRASO_MS="800"
python api/servidor.py
```

Bash:

```bash
IOTRAP_API_HOST=0.0.0.0 IOTRAP_API_PORTA=8000 IOTRAP_API_FONTE=mock IOTRAP_API_ATRASO_MS=800 python3 api/servidor.py
```

Teste no navegador do celular: `http://IP-DO-COMPUTADOR:8000/ataques`. Se não abrir, libere a porta 8000 no firewall do Windows.

Para ler o Elasticsearch real do IoTrap, troque `IOTRAP_API_FONTE` para `elasticsearch` e defina também `IOTRAP_ES_URL`, `IOTRAP_ES_USUARIO` e `IOTRAP_ES_SENHA`.

### 2. App

```bash
npm install
cp .env.example .env.local
```

Edite o `.env.local` com o IP do computador e rode:

```bash
npx expo start
```

Leia o QR Code com o Expo Go. Se a rede bloquear, use `npx expo start --tunnel` (a API continua precisando estar acessível pelo IP da rede).

## Arquivos

- `App.tsx`: configura o react-query (cache persistido, rede e foco do app)
- `components/TelaAtaques.tsx`: a tela da PoC
- `servicos/iotrap.ts`: chamada à API e regra de bloqueio
- `api/servidor.py`: API do IoTrap (simulada ou lendo o Elasticsearch)
- `CRITERIOS.md`: critérios de aceitação
- `PESQUISA.md`: diário de pesquisa

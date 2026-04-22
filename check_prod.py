#!/usr/bin/env python3
import asyncio
import os
import re
import smtplib
import ssl
import time
from email.message import EmailMessage
from urllib.parse import urljoin

import requests
import redis
import websockets


HEX_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


def c_ok(s: str) -> str:
    return f"\033[32m{s}\033[0m"


def c_bad(s: str) -> str:
    return f"\033[31m{s}\033[0m"


def c_dim(s: str) -> str:
    return f"\033[90m{s}\033[0m"


def timed(fn):
    def wrap(*a, **kw):
        t0 = time.perf_counter()
        try:
            r = fn(*a, **kw)
            return True, r, int((time.perf_counter() - t0) * 1000)
        except Exception as e:
            return False, e, int((time.perf_counter() - t0) * 1000)

    return wrap


@timed
def check_db_and_appconfig():
    # Vérifie /api/health/ (qui fait SELECT AppConfig.load)
    base = os.environ["BASE_URL"].rstrip("/") + "/"
    r = requests.get(urljoin(base, "api/health/"), timeout=5)
    r.raise_for_status()
    data = r.json()
    if data.get("db") != "ok":
        raise RuntimeError(f"db={data.get('db')}")
    if data.get("config") not in ("ok",):
        raise RuntimeError(f"config={data.get('config')}")
    return data


@timed
def check_api_config_colors():
    base = os.environ["BASE_URL"].rstrip("/") + "/"
    r = requests.get(urljoin(base, "api/config/"), timeout=5)
    r.raise_for_status()
    data = r.json()
    for k in ("color_primary", "color_secondary", "color_white"):
        v = data.get(k, "")
        if not HEX_RE.match(v):
            raise RuntimeError(f"{k} invalide: {v}")
    return {k: data[k] for k in ("app_name", "color_primary", "color_secondary", "color_white")}


@timed
def check_redis_ping():
    r = redis.from_url(os.environ["REDIS_URL"], decode_responses=True)
    return r.ping()


@timed
def check_storage_write_delete():
    # S3/R2 via AWS credentials (boto-style) -> on utilise l'API S3 via requests? plus simple: aws cli n'est pas garanti.
    # Ici on teste via boto3-like endpoint en HTTP PUT presigned n'est pas dispo, donc on teste via /api/health/ storage.
    base = os.environ["BASE_URL"].rstrip("/") + "/"
    r = requests.get(urljoin(base, "api/health/"), timeout=5)
    r.raise_for_status()
    data = r.json()
    if data.get("storage") != "ok":
        raise RuntimeError(f"storage={data.get('storage')}")
    return "ok"


@timed
def check_fedapay_sandbox():
    key = os.environ.get("FEDAPAY_API_KEY", "")
    if not key:
        raise RuntimeError("FEDAPAY_API_KEY manquant")
    url = "https://sandbox-api.fedapay.com/v1/transactions"
    r = requests.get(url, headers={"Authorization": f"Bearer {key}"}, timeout=10)
    if r.status_code not in (200, 401, 403):
        r.raise_for_status()
    return {"status_code": r.status_code}


@timed
def check_send_email():
    host = os.environ.get("EMAIL_HOST", "")
    user = os.environ.get("EMAIL_HOST_USER", "")
    pwd = os.environ.get("EMAIL_HOST_PASSWORD", "")
    port = int(os.environ.get("EMAIL_PORT", "587"))
    to = os.environ.get("TEST_EMAIL_TO", user)
    if not host or not user or not pwd or not to:
        raise RuntimeError("EMAIL_* incomplet (host/user/password) ou TEST_EMAIL_TO manquant")

    msg = EmailMessage()
    msg["Subject"] = "PhotoEvent - test email"
    msg["From"] = os.environ.get("DEFAULT_FROM_EMAIL", user)
    msg["To"] = to
    msg.set_content("Test email OK.")

    ctx = ssl.create_default_context()
    with smtplib.SMTP(host, port, timeout=10) as s:
        s.starttls(context=ctx)
        s.login(user, pwd)
        s.send_message(msg)
    return "sent"


async def _ws_check():
    ws_url = os.environ["WS_URL"].rstrip("/")
    t0 = time.perf_counter()
    async with websockets.connect(ws_url + "/ws/photowall/test/", open_timeout=5) as ws:
        await ws.send("ping")
        await asyncio.sleep(0.1)
    return int((time.perf_counter() - t0) * 1000)


def check_ws():
    try:
        ms = asyncio.run(_ws_check())
        return True, "connected", ms
    except Exception as e:
        return False, e, 0


def main():
    required = ["BASE_URL", "WS_URL", "REDIS_URL"]
    for k in required:
        if not os.environ.get(k):
            print(c_bad(f"✗ {k} manquant"))
            return 2

    checks = [
        ("DB + AppConfig (via /api/health/)", check_db_and_appconfig),
        ("/api/config couleurs", check_api_config_colors),
        ("Redis PING", check_redis_ping),
        ("Storage write/delete (via /api/health/)", check_storage_write_delete),
        ("FedaPay sandbox (liste transactions)", check_fedapay_sandbox),
        ("Email test", check_send_email),
    ]

    print(c_dim("PhotoEvent - check production"))

    ok_all = True
    for name, fn in checks:
        ok, res, ms = fn()
        if ok:
            print(f"{c_ok('✔')} {name} {c_dim(f'({ms}ms)')}")
        else:
            ok_all = False
            print(f"{c_bad('✗')} {name} {c_dim(f'({ms}ms)')} -> {res}")

    ok, res, ms = check_ws()
    if ok:
        print(f"{c_ok('✔')} WebSocket /ws/photowall/test/ {c_dim(f'({ms}ms)')}")
    else:
        ok_all = False
        print(f"{c_bad('✗')} WebSocket /ws/photowall/test/ -> {res}")

    return 0 if ok_all else 1


if __name__ == "__main__":
    raise SystemExit(main())


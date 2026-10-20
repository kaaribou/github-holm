"""Client minimal de l'API REST GitHub (jeton personnel), avec requêtes conditionnelles (ETag)."""
from __future__ import annotations

import asyncio
import logging
import re
from typing import Any

import aiohttp

from .const import API

_LOGGER = logging.getLogger(__name__)


class GitHubError(Exception):
    """Erreur de communication avec GitHub."""


class GitHubAuthError(GitHubError):
    """Jeton refusé ou expiré."""


class GitHubClient:
    BASE = API

    def __init__(self, session: aiohttp.ClientSession, token: str, api: str | None = None) -> None:
        self._s = session
        self._api = (api or self.BASE).rstrip("/")
        self._h = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "holm-github-home-assistant",
        }
        self._etags: dict[str, tuple[str, Any, dict]] = {}
        self.rate: dict[str, int] = {}
        self.requests = 0

    async def get(self, path: str, params: dict | None = None) -> tuple[Any, dict]:
        """GET avec cache ETag : une réponse 304 ne consomme pas le quota GitHub."""
        url = path if path.startswith("http") else f"{self._api}{path}"
        key = url + ("?" + "&".join(f"{k}={v}" for k, v in sorted(params.items())) if params else "")
        headers = dict(self._h)
        cached = self._etags.get(key)
        if cached:
            headers["If-None-Match"] = cached[0]
        try:
            async with self._s.get(url, params=params, headers=headers, timeout=aiohttp.ClientTimeout(total=20)) as r:
                self.requests += 1
                if "X-RateLimit-Remaining" in r.headers:
                    self.rate = {"remaining": int(r.headers["X-RateLimit-Remaining"]),
                                 "limit": int(r.headers.get("X-RateLimit-Limit", 0)),
                                 "reset": int(r.headers.get("X-RateLimit-Reset", 0))}
                if r.status == 304 and cached:
                    return cached[1], cached[2]
                if r.status == 401:
                    raise GitHubAuthError("Jeton GitHub refusé")
                if r.status in (403, 429) and r.headers.get("X-RateLimit-Remaining") == "0":
                    raise GitHubError("Quota GitHub épuisé")
                if r.status in (403, 404, 409, 451):
                    return None, {}          # pas de droit, dépôt vide, fonction absente…
                if r.status == 204:
                    return [], {}
                if r.status >= 400:
                    raise GitHubError(f"HTTP {r.status} sur {path}")
                data = await r.json()
                meta = {"link": r.headers.get("Link", "")}
                if r.headers.get("ETag"):
                    self._etags[key] = (r.headers["ETag"], data, meta)
                return data, meta
        except (aiohttp.ClientError, asyncio.TimeoutError) as err:
            raise GitHubError(str(err)) from err

    async def paged(self, path: str, params: dict | None = None, limit: int = 10) -> list:
        """Suit les pages (en-tête Link) jusqu'à `limit` pages."""
        out: list = []
        p = {"per_page": 100, **(params or {})}
        url: str | None = path
        for _ in range(limit):
            data, meta = await self.get(url, p)
            if not data:
                break
            out.extend(data)
            m = re.search(r'<([^>]+)>;\s*rel="next"', meta.get("link", ""))
            if not m:
                break
            url, p = m.group(1), None
        return out

    async def user(self) -> dict:
        data, _ = await self.get("/user")
        if not data:
            raise GitHubAuthError("Impossible de lire le compte GitHub")
        return data

"""Coordinateur : lit tous les dépôts du compte et leurs détails."""
from __future__ import annotations

import asyncio
import logging
import time
from datetime import timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from .api import GitHubAuthError, GitHubClient, GitHubError
from .const import (CONF_ARCHIVED, CONF_EXCLUDE, CONF_FORKS, CONF_SCAN, CONF_TRAFFIC, DEFAULT_SCAN, DOMAIN,
                    EVENT_NEW_ITEM, MAX_PARALLEL, TRAFFIC_EVERY)

_LOGGER = logging.getLogger(__name__)


def _issue(i: dict) -> dict:
    return {
        "number": i.get("number"), "title": i.get("title"), "url": i.get("html_url"),
        "user": (i.get("user") or {}).get("login"), "created": i.get("created_at"), "updated": i.get("updated_at"),
        "comments": i.get("comments", 0), "pr": "pull_request" in i,
        "labels": [{"name": l.get("name"), "color": l.get("color")} for l in i.get("labels") or []],
    }


class GitHubCoordinator(DataUpdateCoordinator[dict]):
    def __init__(self, hass: HomeAssistant, entry: ConfigEntry, client: GitHubClient, login: str) -> None:
        minutes = int(entry.options.get(CONF_SCAN, DEFAULT_SCAN))
        super().__init__(hass, _LOGGER, name=DOMAIN, update_interval=timedelta(minutes=minutes))
        self.entry, self.client, self.login = entry, client, login
        self._traffic: dict[str, dict | None] = {}
        self._traffic_at: float | None = None
        self._known: dict[str, set[int]] | None = None   # issues/PR déjà vues (None = premier passage)

    def _wanted(self, r: dict) -> bool:
        o = self.entry.options
        exclude = {x.strip().lower() for x in str(o.get(CONF_EXCLUDE, "")).split(",") if x.strip()}
        if r.get("name", "").lower() in exclude:
            return False
        if r.get("fork") and not o.get(CONF_FORKS, False):
            return False
        if r.get("archived") and not o.get(CONF_ARCHIVED, False):
            return False
        return True

    async def _details(self, r: dict, traffic: bool) -> dict:
        c, full = self.client, r["full_name"]
        rels, _ = await c.get(f"/repos/{full}/releases", {"per_page": 100})
        issues, _ = await c.get(f"/repos/{full}/issues", {"state": "open", "per_page": 100, "sort": "created"})
        runs, _ = await c.get(f"/repos/{full}/actions/runs", {"per_page": 1})
        commits, _ = await c.get(f"/repos/{full}/commits", {"per_page": 1})
        rels = [x for x in rels or [] if not x.get("draft")]
        latest = next((x for x in rels if not x.get("prerelease")), rels[0] if rels else None)
        items = [_issue(i) for i in issues or []]
        prs = sum(1 for i in items if i["pr"])
        wruns = (runs or {}).get("workflow_runs") or [] if isinstance(runs, dict) else []
        run = wruns[0] if wruns else None
        commit = commits[0] if isinstance(commits, list) and commits else None
        if traffic:
            v, _ = await c.get(f"/repos/{full}/traffic/views")
            cl, _ = await c.get(f"/repos/{full}/traffic/clones")
            if v is None and cl is None:
                self._traffic[full] = None
            else:
                days: dict[str, dict] = {}
                for x in (v or {}).get("views", []):
                    days.setdefault(x["timestamp"][:10], {"v": 0, "c": 0})["v"] = x["count"]
                for x in (cl or {}).get("clones", []):
                    days.setdefault(x["timestamp"][:10], {"v": 0, "c": 0})["c"] = x["count"]
                self._traffic[full] = {
                    "views": (v or {}).get("count", 0), "views_uniques": (v or {}).get("uniques", 0),
                    "clones": (cl or {}).get("count", 0), "clones_uniques": (cl or {}).get("uniques", 0),
                    "days": [{"d": d, **days[d]} for d in sorted(days)],
                }
        return {
            "name": r["name"], "full_name": full, "url": r.get("html_url"), "description": r.get("description") or "",
            "private": r.get("private", False), "archived": r.get("archived", False), "fork": r.get("fork", False),
            "topics": r.get("topics") or [], "language": r.get("language"),
            "stars": r.get("stargazers_count", 0), "forks": r.get("forks_count", 0), "watchers": r.get("subscribers_count"),
            "pushed": r.get("pushed_at"), "created": r.get("created_at"),
            "open_issues": max(0, r.get("open_issues_count", 0) - prs), "open_prs": prs, "issues": items[:30],
            "release": {"tag": latest.get("tag_name"), "name": latest.get("name"), "date": latest.get("published_at"),
                        "url": latest.get("html_url")} if latest else None,
            "releases": len(rels),
            "downloads": sum(a.get("download_count", 0) for x in rels for a in x.get("assets") or []),
            "ci": {"name": run.get("name"), "status": run.get("status"), "conclusion": run.get("conclusion"),
                   "url": run.get("html_url"), "date": run.get("updated_at")} if run else None,
            "commit": {"sha": commit.get("sha", "")[:7], "message": ((commit.get("commit") or {}).get("message") or "").split("\n")[0],
                       "date": ((commit.get("commit") or {}).get("committer") or {}).get("date"), "url": commit.get("html_url")} if commit else None,
            "traffic": self._traffic.get(full),
        }

    def _basic(self, r: dict) -> dict:
        """Données minimales d'un dépôt quand le détail n'a pas pu être lu."""
        return {"name": r["name"], "full_name": r["full_name"], "url": r.get("html_url"), "description": r.get("description") or "",
                "private": r.get("private", False), "archived": r.get("archived", False), "fork": r.get("fork", False),
                "topics": r.get("topics") or [], "language": r.get("language"), "stars": r.get("stargazers_count", 0),
                "forks": r.get("forks_count", 0), "watchers": None, "pushed": r.get("pushed_at"), "created": r.get("created_at"),
                "open_issues": r.get("open_issues_count", 0), "open_prs": 0, "issues": [], "release": None, "releases": 0,
                "downloads": 0, "ci": None, "commit": None, "traffic": self._traffic.get(r["full_name"])}

    async def _async_update_data(self) -> dict[str, Any]:
        try:
            raw = await self.client.paged("/user/repos", {"affiliation": "owner", "sort": "pushed"})
            repos = [r for r in raw if self._wanted(r)]
            traffic = bool(self.entry.options.get(CONF_TRAFFIC, True)) and (self._traffic_at is None or time.monotonic() - self._traffic_at > TRAFFIC_EVERY)
            sem = asyncio.Semaphore(MAX_PARALLEL)

            async def one(r: dict) -> dict:
                async with sem:
                    try:
                        return await self._details(r, traffic)
                    except (GitHubAuthError, GitHubError):
                        raise
                    except Exception:  # noqa: BLE001 — un dépôt inattendu ne doit pas tout bloquer
                        _LOGGER.exception("Lecture du dépôt %s impossible", r.get("full_name"))
                        return self._basic(r)

            details = await asyncio.gather(*(one(r) for r in repos))
            if traffic:
                self._traffic_at = time.monotonic()
        except GitHubAuthError as err:
            raise ConfigEntryAuthFailed(str(err)) from err
        except GitHubError as err:
            raise UpdateFailed(str(err)) from err
        self._announce(details)
        return {"owner": self.login, "updated": dt_util.utcnow().isoformat(), "rate": dict(self.client.rate),
                "requests": self.client.requests, "repos": details}

    def _announce(self, repos: list[dict]) -> None:
        """Évènement pour chaque nouvelle issue ou PR (pas au premier chargement)."""
        now = {r["full_name"]: {i["number"] for i in r["issues"]} for r in repos}
        if self._known is not None:
            for r in repos:
                if r["full_name"] not in self._known:
                    continue        # dépôt nouvellement suivi : pas d'avalanche de notifications
                old = self._known[r["full_name"]]
                for i in r["issues"]:
                    if i["number"] not in old:
                        self.hass.bus.async_fire(EVENT_NEW_ITEM, {
                            "repo": r["name"], "type": "pull_request" if i["pr"] else "issue",
                            "number": i["number"], "title": i["title"], "url": i["url"], "user": i["user"]})
        self._known = now

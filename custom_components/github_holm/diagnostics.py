"""Diagnostic téléchargeable (le jeton est masqué)."""
from __future__ import annotations

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import CONF_TOKEN


async def async_get_config_entry_diagnostics(hass: HomeAssistant, entry: ConfigEntry) -> dict:
    c = entry.runtime_data
    d = c.data or {}
    return {
        "entry": async_redact_data(dict(entry.data), {CONF_TOKEN}),
        "options": dict(entry.options),
        "rate": d.get("rate"), "requests": d.get("requests"),
        "repos": [{k: r.get(k) for k in ("name", "private", "open_issues", "open_prs", "stars", "releases", "downloads")}
                  | {"traffic": r.get("traffic") is not None, "ci": bool(r.get("ci"))} for r in d.get("repos", [])],
    }

"""Commandes websocket : la carte lit le détail des dépôts sans passer par les attributs."""
from __future__ import annotations

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN


@callback
def async_register(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, ws_data)
    websocket_api.async_register_command(hass, ws_refresh)


def _entries(hass: HomeAssistant, entry_id: str | None):
    out = [e for e in hass.config_entries.async_entries(DOMAIN) if getattr(e, "runtime_data", None)]
    if entry_id:
        out = [e for e in out if e.entry_id == entry_id]
    return out


@websocket_api.websocket_command({vol.Required("type"): "github_holm/data", vol.Optional("entry_id"): str})
@callback
def ws_data(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    accounts = []
    for e in _entries(hass, msg.get("entry_id")):
        c = e.runtime_data
        if c.data:
            accounts.append({"entry_id": e.entry_id, "title": e.title, "ok": c.last_update_success, **c.data})
    connection.send_result(msg["id"], {"accounts": accounts})


@websocket_api.websocket_command({vol.Required("type"): "github_holm/refresh", vol.Optional("entry_id"): str})
@websocket_api.async_response
async def ws_refresh(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    for e in _entries(hass, msg.get("entry_id")):
        await e.runtime_data.async_request_refresh()
    connection.send_result(msg["id"], {"ok": True})

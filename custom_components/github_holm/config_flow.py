"""Configuration de HOLM GitHub : jeton personnel saisi dans l'interface."""
from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.selector import (BooleanSelector, NumberSelector, NumberSelectorConfig, NumberSelectorMode,
                                            TextSelector, TextSelectorConfig, TextSelectorType)

from .api import GitHubAuthError, GitHubClient, GitHubError
from .const import CONF_ARCHIVED, CONF_EXCLUDE, CONF_FORKS, CONF_SCAN, CONF_TOKEN, CONF_TRAFFIC, DEFAULT_SCAN, DOMAIN

TOKEN_SCHEMA = vol.Schema({vol.Required(CONF_TOKEN): TextSelector(TextSelectorConfig(type=TextSelectorType.PASSWORD))})


async def _check(hass, token: str) -> tuple[str | None, str | None]:
    try:
        user = await GitHubClient(async_get_clientsession(hass), token.strip()).user()
    except GitHubAuthError:
        return None, "invalid_auth"
    except GitHubError:
        return None, "cannot_connect"
    return user.get("login"), None


class HolmGitHubConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            login, err = await _check(self.hass, user_input[CONF_TOKEN])
            if err:
                errors["base"] = err
            else:
                await self.async_set_unique_id(login.lower())
                self._abort_if_unique_id_configured()
                return self.async_create_entry(title=f"GitHub — {login}", data={CONF_TOKEN: user_input[CONF_TOKEN].strip()},
                                               options={CONF_SCAN: DEFAULT_SCAN, CONF_TRAFFIC: True})
        return self.async_show_form(step_id="user", data_schema=TOKEN_SCHEMA, errors=errors)

    async def async_step_reauth(self, entry_data: Mapping[str, Any]) -> ConfigFlowResult:
        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        entry = self._get_reauth_entry()
        if user_input is not None:
            login, err = await _check(self.hass, user_input[CONF_TOKEN])
            if err:
                errors["base"] = err
            elif login.lower() != entry.unique_id:
                errors["base"] = "wrong_account"
            else:
                return self.async_update_reload_and_abort(entry, data={CONF_TOKEN: user_input[CONF_TOKEN].strip()})
        return self.async_show_form(step_id="reauth_confirm", data_schema=TOKEN_SCHEMA, errors=errors)

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return HolmGitHubOptionsFlow()


class HolmGitHubOptionsFlow(OptionsFlow):
    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(data=user_input)
        o = self.config_entry.options
        schema = vol.Schema({
            vol.Required(CONF_SCAN, default=o.get(CONF_SCAN, DEFAULT_SCAN)):
                NumberSelector(NumberSelectorConfig(min=5, max=180, step=5, mode=NumberSelectorMode.BOX, unit_of_measurement="min")),
            vol.Required(CONF_TRAFFIC, default=o.get(CONF_TRAFFIC, True)): BooleanSelector(),
            vol.Required(CONF_FORKS, default=o.get(CONF_FORKS, False)): BooleanSelector(),
            vol.Required(CONF_ARCHIVED, default=o.get(CONF_ARCHIVED, False)): BooleanSelector(),
            vol.Optional(CONF_EXCLUDE, default=o.get(CONF_EXCLUDE, "")): TextSelector(),
        })
        return self.async_show_form(step_id="init", data_schema=schema)

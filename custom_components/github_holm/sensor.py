"""Capteurs de synthèse de HOLM GitHub (pour les automatisations et la carte)."""
from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

from homeassistant.components.sensor import SensorEntity, SensorEntityDescription, SensorStateClass
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EntityCategory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.util import slugify

from .const import DOMAIN, VERSION
from .coordinator import GitHubCoordinator


def _sum(key: str) -> Callable[[dict], int]:
    return lambda d: sum((r.get(key) or 0) for r in d["repos"])


def _traffic(key: str) -> Callable[[dict], int]:
    return lambda d: sum(((r.get("traffic") or {}).get(key) or 0) for r in d["repos"])


def _per_repo(key: str) -> Callable[[dict], dict]:
    return lambda d: {r["name"]: r.get(key) or 0 for r in d["repos"] if r.get(key)}


@dataclass(frozen=True, kw_only=True)
class GHSensor(SensorEntityDescription):
    value: Callable[[dict], int | None]
    suffix: str = ""
    attrs: Callable[[dict], dict] | None = None


SENSORS: tuple[GHSensor, ...] = (
    GHSensor(key="repos", suffix="depots", translation_key="repos", icon="mdi:source-repository-multiple", state_class=SensorStateClass.MEASUREMENT,
             value=lambda d: len(d["repos"]),
             attrs=lambda d: {"publics": sum(1 for r in d["repos"] if not r["private"]),
                              "prives": sum(1 for r in d["repos"] if r["private"]), "updated": d["updated"], "owner": d["owner"]}),
    GHSensor(key="open_issues", suffix="issues_ouvertes", translation_key="open_issues", icon="mdi:alert-circle-outline", state_class=SensorStateClass.MEASUREMENT,
             value=_sum("open_issues"), attrs=lambda d: {"par_depot": _per_repo("open_issues")(d)}),
    GHSensor(key="open_prs", suffix="pull_requests_ouvertes", translation_key="open_prs", icon="mdi:source-pull", state_class=SensorStateClass.MEASUREMENT,
             value=_sum("open_prs"), attrs=lambda d: {"par_depot": _per_repo("open_prs")(d)}),
    GHSensor(key="stars", suffix="etoiles", translation_key="stars", icon="mdi:star-outline", state_class=SensorStateClass.MEASUREMENT,
             value=_sum("stars"), attrs=lambda d: {"par_depot": _per_repo("stars")(d)}),
    GHSensor(key="forks", suffix="forks", translation_key="forks", icon="mdi:source-fork", state_class=SensorStateClass.MEASUREMENT, value=_sum("forks")),
    GHSensor(key="views", suffix="vues_14_jours", translation_key="views", icon="mdi:eye-outline", state_class=SensorStateClass.MEASUREMENT,
             value=_traffic("views"), attrs=lambda d: {"visiteurs_uniques": _traffic("views_uniques")(d)}),
    GHSensor(key="clones", suffix="clones_14_jours", translation_key="clones", icon="mdi:content-copy", state_class=SensorStateClass.MEASUREMENT,
             value=_traffic("clones"), attrs=lambda d: {"clones_uniques": _traffic("clones_uniques")(d)}),
    GHSensor(key="downloads", suffix="telechargements", translation_key="downloads", icon="mdi:download-outline", state_class=SensorStateClass.TOTAL_INCREASING,
             value=_sum("downloads")),
    GHSensor(key="rate", suffix="quota_api_restant", translation_key="rate", icon="mdi:speedometer", entity_category=EntityCategory.DIAGNOSTIC,
             value=lambda d: d["rate"].get("remaining"), attrs=lambda d: {"limite": d["rate"].get("limit"), "requetes": d["requests"]}),
)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    c: GitHubCoordinator = entry.runtime_data
    async_add_entities(GitHubSensor(c, d) for d in SENSORS)


class GitHubSensor(CoordinatorEntity[GitHubCoordinator], SensorEntity):
    _attr_has_entity_name = True
    entity_description: GHSensor

    def __init__(self, c: GitHubCoordinator, d: GHSensor) -> None:
        super().__init__(c)
        self.entity_description = d
        self._attr_unique_id = f"{c.entry.unique_id}_{d.key}"
        # identifiants stables en français, quelle que soit la langue du système
        self.entity_id = f"sensor.github_{slugify(c.login)}_{d.suffix}"
        self._attr_device_info = DeviceInfo(identifiers={(DOMAIN, c.entry.unique_id)}, name=f"GitHub {c.login}",
                                            manufacturer="GitHub", model="Compte", sw_version=VERSION,
                                            entry_type=DeviceEntryType.SERVICE, configuration_url=f"https://github.com/{c.login}")

    @property
    def native_value(self):
        return self.entity_description.value(self.coordinator.data)

    @property
    def extra_state_attributes(self):
        f = self.entity_description.attrs
        return f(self.coordinator.data) if f else None

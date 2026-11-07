"""Constantes de HOLM GitHub."""
DOMAIN = "github_holm"
VERSION = "1.2.0"

CONF_TOKEN = "token"
CONF_SCAN = "scan_interval"
CONF_FORKS = "include_forks"
CONF_ARCHIVED = "include_archived"
CONF_TRAFFIC = "traffic"
CONF_EXCLUDE = "exclude"
CONF_INCLUDE = "include"                  # dépôts toujours affichés (même forks ou archivés)
CONF_FORKS_ARCHIVED = "forks_of_archived"  # forks dont l'original est archivé

DEFAULT_SCAN = 15          # minutes
TRAFFIC_EVERY = 3600       # s : le trafic GitHub n'évolue qu'une fois par jour environ
MAX_PARALLEL = 4
PARENT_EVERY = 86400       # s : l'original d'un fork est relu une fois par jour

API = "https://api.github.com"
EVENT_NEW_ITEM = "github_holm_new_item"

STATIC_PATH = "/github_holm"
CARD_NAME = "holm-github-card.js"
CARD_URL = f"{STATIC_PATH}/{CARD_NAME}"

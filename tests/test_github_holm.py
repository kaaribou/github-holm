"""Tests HOLM GitHub contre une API GitHub simulée."""
import pytest
from aiohttp import web
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.github_holm.api import GitHubClient
from custom_components.github_holm.const import DOMAIN, EVENT_NEW_ITEM

TOKEN = "ghp_test"


class FakeGitHub:
    def __init__(self):
        self.calls = []
        self.issues = {"alpha": [{"number": 1, "title": "Bug A", "html_url": "u1", "user": {"login": "x"}, "created_at": "2026-10-01T00:00:00Z", "labels": [{"name": "bug", "color": "d73a4a"}]},
                                 {"number": 2, "title": "PR B", "html_url": "u2", "user": {"login": "y"}, "created_at": "2026-10-02T00:00:00Z", "pull_request": {}}]}
        self.repos = [
            {"name": "alpha", "full_name": "me/alpha", "private": False, "stargazers_count": 3, "forks_count": 1, "open_issues_count": 2,
             "pushed_at": "2026-10-19T10:00:00Z", "html_url": "https://github.com/me/alpha", "topics": ["hacs"]},
            {"name": "beta", "full_name": "me/beta", "private": True, "stargazers_count": 0, "forks_count": 0, "open_issues_count": 0,
             "pushed_at": "2026-10-10T10:00:00Z", "html_url": "https://github.com/me/beta"},
            {"name": "gamma", "full_name": "me/gamma", "fork": True, "stargazers_count": 9, "open_issues_count": 0},
            {"name": "delta", "full_name": "me/delta", "fork": True, "stargazers_count": 2, "open_issues_count": 0},
            {"name": "old", "full_name": "me/old", "archived": True, "stargazers_count": 0, "open_issues_count": 0},
        ]
        # original de chaque fork : gamma = fork d'un projet actif, delta = fork d'un projet archivé (repris)
        self.parents = {"gamma": {"full_name": "up/gamma", "html_url": "https://github.com/up/gamma", "archived": False, "owner": {"login": "up"}},
                        "delta": {"full_name": "the8tre/delta", "html_url": "https://github.com/the8tre/delta", "archived": True, "owner": {"login": "the8tre"}}}

    async def handle(self, request: web.Request):
        self.calls.append(request.path)
        if request.headers.get("Authorization") != f"Bearer {TOKEN}":
            return web.json_response({"message": "Bad credentials"}, status=401)
        h = {"X-RateLimit-Remaining": "4990", "X-RateLimit-Limit": "5000", "ETag": f'"{request.path}"'}
        if request.headers.get("If-None-Match") == f'"{request.path}"' and request.path == "/user/repos":
            return web.Response(status=304, headers=h)
        p = request.path
        if p == "/user":
            return web.json_response({"login": "Me"}, headers=h)
        if p == "/user/repos":
            return web.json_response(self.repos, headers=h)
        name = p.split("/")[3]
        if p.count("/") == 3:                                   # /repos/me/<nom> : détail du dépôt (original du fork)
            return web.json_response({"full_name": f"me/{name}", "parent": self.parents.get(name)}, headers=h)
        if p.endswith("/releases"):
            data = [{"tag_name": "v1.1.0", "name": "1.1.0", "published_at": "2026-10-18T00:00:00Z", "html_url": "r",
                     "assets": [{"download_count": 7}]}, {"tag_name": "v1.0.0", "assets": [{"download_count": 3}]}] if name == "alpha" else []
            return web.json_response(data, headers=h)
        if p.endswith("/issues"):
            return web.json_response(self.issues.get(name, []), headers=h)
        if p.endswith("/actions/runs"):
            if name == "beta":
                return web.json_response({"total_count": 0, "workflow_runs": []}, headers=h)   # dépôt sans workflow
            return web.json_response({"workflow_runs": [{"name": "Validate", "status": "completed", "conclusion": "failure", "html_url": "ci"}]}, headers=h)
        if p.endswith("/commits"):
            return web.json_response([{"sha": "abcdef123", "html_url": "c", "commit": {"message": "Fix\n\ndetails", "committer": {"date": "2026-10-19T10:00:00Z"}}}], headers=h)
        if p.endswith("/traffic/views"):
            if name == "beta":
                return web.json_response({"message": "Must have push access"}, status=403, headers=h)
            return web.json_response({"count": 40, "uniques": 12, "views": [{"timestamp": "2026-10-18T00:00:00Z", "count": 15}, {"timestamp": "2026-10-19T00:00:00Z", "count": 25}]}, headers=h)
        if p.endswith("/traffic/clones"):
            if name == "beta":
                return web.json_response({"message": "Must have push access"}, status=403, headers=h)
            return web.json_response({"count": 5, "uniques": 2, "clones": [{"timestamp": "2026-10-19T00:00:00Z", "count": 5}]}, headers=h)
        return web.json_response({"message": "Not Found"}, status=404, headers=h)


@pytest.fixture
async def gh(socket_enabled, aiohttp_server, monkeypatch):
    fake = FakeGitHub()
    app = web.Application()
    app.router.add_get("/{tail:.*}", fake.handle)
    server = await aiohttp_server(app)
    monkeypatch.setattr(GitHubClient, "BASE", str(server.make_url("")))
    return fake


async def _setup(hass, options=None):
    entry = MockConfigEntry(domain=DOMAIN, unique_id="me", title="GitHub — Me", data={"token": TOKEN},
                            options={"scan_interval": 15, "traffic": True, **(options or {})})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def test_data_and_sensors(hass, gh):
    entry = await _setup(hass)
    data = entry.runtime_data.data
    names = [r["name"] for r in data["repos"]]
    assert names == ["alpha", "beta", "delta"]             # fork d'un projet actif ignoré, fork d'un projet archivé gardé
    assert data["repos"][2]["parent"] == {"full_name": "the8tre/delta", "url": "https://github.com/the8tre/delta", "archived": True, "owner": "the8tre"}
    assert data["repos"][0]["parent"] is None
    a = data["repos"][0]
    assert a["open_issues"] == 1 and a["open_prs"] == 1
    assert a["release"]["tag"] == "v1.1.0" and a["releases"] == 2 and a["downloads"] == 10
    assert a["ci"]["conclusion"] == "failure" and a["commit"]["message"] == "Fix" and a["commit"]["sha"] == "abcdef1"
    assert a["traffic"]["views"] == 40 and a["traffic"]["clones"] == 5 and [d["d"] for d in a["traffic"]["days"]] == ["2026-10-18", "2026-10-19"]
    assert data["repos"][1]["traffic"] is None
    assert data["repos"][1]["ci"] is None                  # aucun workflow : pas d'erreur              # pas de droit sur le trafic : pas d'erreur
    st = hass.states
    assert st.get("sensor.github_me_issues_ouvertes").state == "1"
    assert st.get("sensor.github_me_pull_requests_ouvertes").state == "1"
    assert st.get("sensor.github_me_etoiles").state == "5"                # 3 + 2 du fork repris
    assert st.get("sensor.github_me_vues_14_jours").state == "80"
    assert st.get("sensor.github_me_telechargements").state == "10"
    assert st.get("sensor.github_me_depots").attributes["prives"] == 1


async def test_websocket_and_options(hass, gh, hass_ws_client):
    entry = await _setup(hass, {"include_forks": True, "exclude": "beta"})
    ws = await hass_ws_client(hass)
    await ws.send_json({"id": 1, "type": "github_holm/data"})
    msg = await ws.receive_json()
    assert msg["success"]
    repos = msg["result"]["accounts"][0]["repos"]
    assert [r["name"] for r in repos] == ["alpha", "gamma", "delta"]
    assert repos[1]["parent"]["full_name"] == "up/gamma"
    assert msg["result"]["accounts"][0]["owner"] == "Me"


async def test_new_issue_event_and_etag(hass, gh):
    entry = await _setup(hass)
    events = []
    hass.bus.async_listen(EVENT_NEW_ITEM, lambda e: events.append(e.data))
    c = entry.runtime_data
    await c.async_refresh()
    assert events == []                                     # rien de nouveau
    gh.issues["alpha"].append({"number": 3, "title": "Nouvelle demande", "html_url": "u3", "user": {"login": "z"}})
    await c.async_refresh()
    await hass.async_block_till_done()
    assert events == [{"repo": "alpha", "type": "issue", "number": 3, "title": "Nouvelle demande", "url": "u3", "user": "z"}]
    assert c.data["repos"][0]["open_issues"] == 1           # open_issues_count simulé inchangé (2) − 2 PR? non : 1 PR
    # le trafic n'est relu qu'une fois par heure, l'original des forks une fois par jour
    assert sum(1 for p in gh.calls if p.endswith("/traffic/views")) == 3
    assert gh.calls.count("/repos/me/delta") == 1 and gh.calls.count("/repos/me/gamma") == 1


async def test_fork_options(hass, gh):
    # option désactivée : aucun fork, aucun appel pour lire les originaux
    entry = await _setup(hass, {"forks_of_archived": False})
    assert [r["name"] for r in entry.runtime_data.data["repos"]] == ["alpha", "beta"]
    assert not any(p in gh.calls for p in ("/repos/me/gamma", "/repos/me/delta"))


async def test_include_list(hass, gh):
    # « toujours inclus » : par nom ou propriétaire/nom, l'emporte sur forks et archivés ; « ignorer » l'emporte sur tout
    entry = await _setup(hass, {"forks_of_archived": False, "include": " Gamma, me/old ,delta", "exclude": "delta"})
    repos = entry.runtime_data.data["repos"]
    assert [r["name"] for r in repos] == ["alpha", "beta", "gamma", "old"]
    assert repos[2]["parent"]["full_name"] == "up/gamma"


async def test_bad_token_starts_reauth(hass, gh):
    entry = MockConfigEntry(domain=DOMAIN, unique_id="me", data={"token": "wrong"}, options={})
    entry.add_to_hass(hass)
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    flows = hass.config_entries.flow.async_progress()
    assert any(f["context"]["source"] == "reauth" for f in flows)


async def test_config_flow(hass, gh):
    r = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    r = await hass.config_entries.flow.async_configure(r["flow_id"], {"token": "nope"})
    assert r["errors"] == {"base": "invalid_auth"}
    r = await hass.config_entries.flow.async_configure(r["flow_id"], {"token": f" {TOKEN} "})
    assert r["type"] == "create_entry" and r["title"] == "GitHub — Me" and r["data"]["token"] == TOKEN
    await hass.async_block_till_done()

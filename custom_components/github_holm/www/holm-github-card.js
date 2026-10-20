/* holm-github-card — HOLM GitHub — licence MIT — v1.0.0 */
/* Tous vos dépôts GitHub d'un coup d'œil : issues et PR, releases, intégration continue, audience.
 * Données fournies par l'intégration HOLM GitHub (commande websocket github_holm/data).
 */
(() => {
  const VERSION = "1.0.0";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nf = (n) => Number(n || 0).toLocaleString("fr-FR");
  const short = (n) => { n = Number(n || 0); return n >= 10000 ? `${(n / 1000).toFixed(0)} k` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(".", ",")} k` : String(n); };
  const ago = (iso) => {
    if (!iso) return "";
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return "à l'instant";
    if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
    if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
    const d = Math.floor(s / 86400);
    if (d === 1) return "hier";
    if (d < 31) return `il y a ${d} j`;
    const m = Math.floor(d / 30.4);
    return m < 12 ? `il y a ${m} mois` : `il y a ${Math.floor(m / 12)} an${m >= 24 ? "s" : ""}`;
  };
  const isNew = (iso, days = 7) => iso && Date.now() - new Date(iso).getTime() < days * 86400000;
  const FILTERS = [["all", "Tous"], ["todo", "À traiter"], ["public", "Publics"], ["private", "Privés"]];
  const SORTS = [["activity", "Activité"], ["issues", "Issues"], ["stars", "Étoiles"], ["views", "Vues"], ["name", "Nom"]];
  const CI = {
    success: ["ok", "Validation réussie"], failure: ["ko", "Validation en échec"], cancelled: ["off", "Validation annulée"],
    timed_out: ["ko", "Validation expirée"], action_required: ["run", "Action requise"], skipped: ["off", "Validation ignorée"],
  };
  // HACS ne sait pas valider un dépôt privé : cet échec-là est normal tant que le dépôt n'est pas public
  const hacsPrivate = (r) => r.private && r.ci && /valid|hacs/i.test(r.ci.name || "") && r.ci.conclusion === "failure";
  const ciOf = (ci, r) => !ci ? ["none", "Pas de validation"]
    : r && hacsPrivate(r) ? ["off", "Validation HACS impossible sur un dépôt privé (normal)"]
    : ci.status !== "completed" ? ["run", "Validation en cours"] : (CI[ci.conclusion] || ["off", ci.conclusion || ""]);

  class HolmGitHubCard extends HTMLElement {
    static getConfigElement() { return document.createElement("holm-github-card-editor"); }
    static getStubConfig() { return { title: "Mes dépôts GitHub" }; }
    setConfig(c) {
      this._c = { title: "Mes dépôts GitHub", filter: "all", sort: "activity", show_private: true, max_rows: 0, ...c };
      this._filter = this._filter || this._c.filter;
      this._sort = this._sort || this._c.sort;
      if (this.shadowRoot) this._render();
    }
    set hass(h) {
      const first = !this._hass;
      this._hass = h;
      if (!this.shadowRoot) { this.attachShadow({ mode: "open" }); this._build(); }
      // la synthèse « Dépôts » porte l'heure de la dernière lecture : on relit le détail quand elle change
      if (!this._sid) this._sid = Object.keys(h.states).find((id) => id.startsWith("sensor.") && h.states[id].attributes?.publics !== undefined && h.states[id].attributes?.owner);
      const stamp = this._sid ? h.states[this._sid]?.attributes?.updated : null;
      if (first || stamp !== this._stamp) { this._stamp = stamp; this._load(); }
    }
    connectedCallback() { clearInterval(this._t); this._t = setInterval(() => this._data && this._render(), 60000); }
    disconnectedCallback() { clearInterval(this._t); }
    async _load() {
      try {
        const r = await this._hass.callWS({ type: "github_holm/data", ...(this._c.entry_id ? { entry_id: this._c.entry_id } : {}) });
        this._data = r.accounts || [];
        this._err = this._data.length ? null : "Aucun compte : ajoutez l'intégration HOLM GitHub.";
      } catch (e) {
        this._err = /unknown_command|Unknown command/i.test(e?.message || e?.code || "") ? "L'intégration HOLM GitHub n'est pas installée." : (e?.message || String(e));
      }
      this._render();
    }
    async _refresh() {
      if (this._busy) return;
      this._busy = true; this._render();
      try { await this._hass.callWS({ type: "github_holm/refresh" }); await this._load(); } catch (e) { /* le prochain cycle réessaiera */ }
      this._busy = false; this._render();
    }
    _repos() {
      const all = (this._data || []).flatMap((a) => a.repos.map((r) => ({ ...r, owner: a.owner })));
      return all.filter((r) => this._c.show_private !== false || !r.private);
    }
    _visible() {
      const f = this._filter, q = (this._q || "").toLowerCase();
      let list = this._repos().filter((r) => f === "all" || (f === "todo" && (r.open_issues || r.open_prs)) || (f === "public" && !r.private) || (f === "private" && r.private));
      if (q) list = list.filter((r) => r.name.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q));
      const views = (r) => r.traffic?.views || 0;
      const by = {
        activity: (a, b) => new Date(b.pushed || 0) - new Date(a.pushed || 0),
        issues: (a, b) => (b.open_issues + b.open_prs) - (a.open_issues + a.open_prs) || new Date(b.pushed || 0) - new Date(a.pushed || 0),
        stars: (a, b) => b.stars - a.stars || a.name.localeCompare(b.name),
        views: (a, b) => views(b) - views(a) || a.name.localeCompare(b.name),
        name: (a, b) => a.name.localeCompare(b.name),
      }[this._sort] || (() => 0);
      return list.sort(by);
    }

    _build() {
      this.shadowRoot.innerHTML = `<style>${CSS}</style><ha-card><div id="root"></div></ha-card>`;
      const root = this.shadowRoot.getElementById("root");
      root.addEventListener("click", (ev) => {
        const t = ev.target.closest("[data-f],[data-s],[data-open],[data-refresh],a,[data-all]");
        if (!t) return;
        if (t.tagName === "A") { ev.stopPropagation(); return; }
        if (t.dataset.f) { this._filter = t.dataset.f; this._render(); }
        else if (t.dataset.s) { this._sort = t.dataset.s; this._render(); }
        else if (t.dataset.open) { this._open = this._open === t.dataset.open ? null : t.dataset.open; this._render(); }
        else if (t.dataset.refresh !== undefined) this._refresh();
        else if (t.dataset.all !== undefined) { this._showAll = !this._showAll; this._render(); }
      });
      root.addEventListener("input", (ev) => {
        if (ev.target.id !== "q") return;
        this._q = ev.target.value; clearTimeout(this._qt);
        this._qt = setTimeout(() => { const pos = ev.target.selectionStart; this._render(); const i = this.shadowRoot.getElementById("q"); if (i) { i.focus(); i.setSelectionRange(pos, pos); } }, 200);
      });
    }

    _spark(days, key = "v", w = 70, h = 22) {
      if (!days || !days.length) return "";
      const vals = days.slice(-14).map((d) => d[key] || 0);
      const max = Math.max(1, ...vals), bw = w / 14;
      return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">${vals.map((v, i) =>
        `<rect x="${(i + 14 - vals.length) * bw + 1}" y="${h - Math.max(1.5, (v / max) * h)}" width="${bw - 2}" height="${Math.max(1.5, (v / max) * h)}" rx="1.2"/>`).join("")}</svg>`;
    }
    _totalDays(repos) {
      const m = {};
      repos.forEach((r) => (r.traffic?.days || []).forEach((d) => { m[d.d] = m[d.d] || { v: 0, c: 0 }; m[d.d].v += d.v; m[d.d].c += d.c; }));
      return Object.keys(m).sort().map((d) => ({ d, ...m[d] }));
    }

    _render() {
      const root = this.shadowRoot?.getElementById("root");
      if (!root || !this._c) return;
      if (this._err && !this._data?.length) { root.innerHTML = `${this._head(null)}<div class="msg">${esc(this._err)}</div>`; return; }
      if (!this._data) { root.innerHTML = `${this._head(null)}<div class="msg">Chargement…</div>`; return; }
      const repos = this._repos();
      const sum = (k) => repos.reduce((a, r) => a + (r[k] || 0), 0);
      const views = repos.reduce((a, r) => a + (r.traffic?.views || 0), 0);
      const hasTraffic = repos.some((r) => r.traffic);
      const pub = repos.filter((r) => !r.private).length;
      const kpi = (icon, val, label, cls = "", extra = "") => `<div class="kpi ${cls}"><ha-icon icon="${icon}"></ha-icon><b>${val}</b><small>${label}</small>${extra}</div>`;
      const list = this._visible();
      const max = Number(this._c.max_rows) || 0;
      const shown = max && !this._showAll ? list.slice(0, max) : list;
      const counts = { all: repos.length, todo: repos.filter((r) => r.open_issues || r.open_prs).length, public: pub, private: repos.length - pub };
      const fails = repos.filter((r) => ciOf(r.ci, r)[0] === "ko");
      root.innerHTML = `
        ${this._head(repos)}
        <div class="kpis">
          ${kpi("mdi:source-repository-multiple", repos.length, `${pub} publics · ${repos.length - pub} privés`)}
          ${kpi("mdi:alert-circle-outline", sum("open_issues"), "issues ouvertes", sum("open_issues") ? "warn" : "")}
          ${kpi("mdi:source-pull", sum("open_prs"), "pull requests", sum("open_prs") ? "pr" : "")}
          ${kpi("mdi:star-outline", nf(sum("stars")), `étoiles · ${nf(sum("forks"))} forks`)}
          ${hasTraffic ? kpi("mdi:eye-outline", short(views), "vues sur 14 j", "", this._spark(this._totalDays(repos), "v", 64, 18)) : ""}
          ${kpi("mdi:download-outline", short(sum("downloads")), "téléchargements")}
        </div>
        ${fails.length ? `<div class="alert"><ha-icon icon="mdi:close-octagon-outline"></ha-icon><span>${fails.length > 1 ? `${fails.length} validations en échec` : "Validation en échec"}</span>
          <span class="fl">${fails.map((r) => `<a href="${esc(r.ci.url)}" target="_blank" rel="noopener" title="${esc(r.ci.name || "")} · ${ago(r.ci.date)}">${esc(r.name)}</a>`).join("")}</span></div>` : ""}
        <div class="bar">
          <div class="chips">${FILTERS.map(([k, l]) => `<button class="chip${this._filter === k ? " on" : ""}" data-f="${k}">${l}<span>${counts[k]}</span></button>`).join("")}</div>
          <div class="tools">
            <label class="search"><ha-icon icon="mdi:magnify"></ha-icon><input id="q" placeholder="Rechercher" value="${esc(this._q || "")}"></label>
            <div class="sorts">${SORTS.filter(([k]) => k !== "views" || hasTraffic).map(([k, l]) => `<button class="sort${this._sort === k ? " on" : ""}" data-s="${k}">${l}</button>`).join("")}</div>
          </div>
        </div>
        <div class="list">${shown.length ? shown.map((r) => this._row(r)).join("") : `<div class="msg">Aucun dépôt ne correspond.</div>`}</div>
        ${max && list.length > max ? `<button class="more" data-all>${this._showAll ? "Réduire" : `Voir les ${list.length} dépôts`}</button>` : ""}`;
    }
    _head(repos) {
      const a = this._data?.[0];
      const rate = a?.rate?.remaining;
      return `<div class="head">
        <div class="logo"><ha-icon icon="mdi:github"></ha-icon></div>
        <div class="ht"><b>${esc(this._c.title)}</b><small>${a ? `${esc(a.owner)} · mis à jour ${ago(a.updated)}` : "HOLM GitHub"}${rate !== undefined && rate < 500 ? ` · quota API : ${rate}` : ""}</small></div>
        ${a?.owner ? `<a class="ib" href="https://github.com/${esc(a.owner)}?tab=repositories" target="_blank" rel="noopener" title="Ouvrir GitHub"><ha-icon icon="mdi:open-in-new"></ha-icon></a>` : ""}
        <button class="ib${this._busy ? " spin" : ""}" data-refresh title="Actualiser"><ha-icon icon="mdi:refresh"></ha-icon></button>
      </div>`;
    }
    _row(r) {
      const [ci, ciL] = ciOf(r.ci, r);
      const open = this._open === r.full_name;
      const fresh = r.issues.some((i) => isNew(i.created));
      const rel = r.release;
      return `<div class="repo${open ? " open" : ""}${r.archived ? " arch" : ""}">
        <button class="rh" data-open="${esc(r.full_name)}">
          <span class="ci ${ci}" title="${esc(ciL)}"></span>
          <span class="rn"><b>${esc(r.name)}</b>${r.private ? `<ha-icon class="lock" icon="mdi:lock-outline" title="Privé"></ha-icon>` : ""}${fresh ? `<i class="new">nouveau</i>` : ""}
            <small>${rel ? `<span class="tag">${esc(rel.tag)}</span>${ago(rel.date)}` : `<span class="tag none">pas de release</span>`}${r.pushed ? ` · actif ${ago(r.pushed)}` : ""}</small></span>
          <span class="badges">
            ${r.open_issues ? `<span class="bd warn" title="Issues ouvertes"><ha-icon icon="mdi:alert-circle-outline"></ha-icon>${r.open_issues}</span>` : ""}
            ${r.open_prs ? `<span class="bd pr" title="Pull requests ouvertes"><ha-icon icon="mdi:source-pull"></ha-icon>${r.open_prs}</span>` : ""}
            <span class="bd dim" title="Étoiles"><ha-icon icon="mdi:star-outline"></ha-icon>${r.stars}</span>
            ${r.traffic ? `<span class="tr" title="Vues sur 14 jours">${this._spark(r.traffic.days)}<b>${short(r.traffic.views)}</b></span>` : ""}
          </span>
          <ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>
        </button>
        ${open ? this._detail(r, ci, ciL) : ""}
      </div>`;
    }
    _detail(r, ci, ciL) {
      const t = r.traffic;
      const gh = r.url;
      const stat = (icon, v, l) => `<div class="st"><ha-icon icon="${icon}"></ha-icon><b>${v}</b><small>${l}</small></div>`;
      const items = r.issues.slice(0, 12);
      return `<div class="rd">
        ${r.description ? `<p class="desc">${esc(r.description)}</p>` : ""}
        ${r.topics.length ? `<div class="topics">${r.topics.slice(0, 8).map((x) => `<span>${esc(x)}</span>`).join("")}</div>` : ""}
        <div class="stats">
          ${stat("mdi:star-outline", nf(r.stars), "étoiles")}
          ${stat("mdi:source-fork", nf(r.forks), "forks")}
          ${t ? stat("mdi:eye-outline", nf(t.views), `vues · ${nf(t.views_uniques)} visiteurs`) : ""}
          ${t ? stat("mdi:content-copy", nf(t.clones), `clones · ${nf(t.clones_uniques)} uniques`) : ""}
          ${stat("mdi:tag-outline", r.releases, r.releases > 1 ? "releases" : "release")}
          ${stat("mdi:download-outline", nf(r.downloads), "téléchargements")}
        </div>
        <div class="lines">
          ${r.release ? `<a class="ln" href="${esc(r.release.url)}" target="_blank" rel="noopener"><ha-icon icon="mdi:tag-outline"></ha-icon><span>Dernière release <b>${esc(r.release.tag)}</b>${r.release.name && r.release.name !== r.release.tag ? ` — ${esc(r.release.name)}` : ""}</span><small>${ago(r.release.date)}</small></a>` : ""}
          ${r.commit ? `<a class="ln" href="${esc(r.commit.url)}" target="_blank" rel="noopener"><ha-icon icon="mdi:source-commit"></ha-icon><span>${esc(r.commit.message)} <code>${esc(r.commit.sha)}</code></span><small>${ago(r.commit.date)}</small></a>` : ""}
          ${r.ci ? `<a class="ln" href="${esc(r.ci.url)}" target="_blank" rel="noopener"><i class="ci ${ci}"></i><span>${esc(ciL)} · ${esc(r.ci.name || "")}</span><small>${ago(r.ci.date)}</small></a>` : ""}
        </div>
        ${items.length ? `<div class="sub">Issues et pull requests ouvertes</div><div class="items">${items.map((i) => `
          <a class="it" href="${esc(i.url)}" target="_blank" rel="noopener">
            <ha-icon class="${i.pr ? "pr" : "warn"}" icon="${i.pr ? "mdi:source-pull" : "mdi:alert-circle-outline"}"></ha-icon>
            <span class="itt">${esc(i.title)}${isNew(i.created) ? ` <i class="new">nouveau</i>` : ""}
              ${i.labels.length ? `<span class="labels">${i.labels.slice(0, 3).map((l) => `<em style="--lc:#${esc(l.color || "888")}">${esc(l.name)}</em>`).join("")}</span>` : ""}
              <small>#${i.number} · ${esc(i.user || "")} · ${ago(i.created)}${i.comments ? ` · ${i.comments} commentaire${i.comments > 1 ? "s" : ""}` : ""}</small></span>
          </a>`).join("")}</div>${r.issues.length > items.length ? `<small class="mute">… et ${r.issues.length - items.length} autres</small>` : ""}` : `<div class="sub ok"><ha-icon icon="mdi:check-circle-outline"></ha-icon>Aucune issue ouverte</div>`}
        <div class="acts">
          <a href="${esc(gh)}" target="_blank" rel="noopener"><ha-icon icon="mdi:github"></ha-icon>Dépôt</a>
          <a href="${esc(gh)}/issues" target="_blank" rel="noopener"><ha-icon icon="mdi:alert-circle-outline"></ha-icon>Issues</a>
          <a href="${esc(gh)}/pulls" target="_blank" rel="noopener"><ha-icon icon="mdi:source-pull"></ha-icon>PR</a>
          <a href="${esc(gh)}/releases" target="_blank" rel="noopener"><ha-icon icon="mdi:tag-outline"></ha-icon>Releases</a>
          ${r.traffic ? `<a href="${esc(gh)}/graphs/traffic" target="_blank" rel="noopener"><ha-icon icon="mdi:chart-line"></ha-icon>Trafic</a>` : ""}
        </div>
      </div>`;
    }
    getCardSize() { return 8; }
    getGridOptions() { return { columns: 12, rows: "auto", min_columns: 6 }; }
  }

  const CSS = `
    :host { --g: 62,207,207; --warn: 245,166,35; --pr: 167,119,255; --ok: 62,201,122; --ko: 239,83,80; }
    ha-card { display: block; overflow: hidden; container-type: inline-size; }
    #root { padding: 14px 14px 12px; }
    a { color: inherit; text-decoration: none; }
    button { font: inherit; color: inherit; border: 0; background: none; cursor: pointer; padding: 0; text-align: left; -webkit-tap-highlight-color: transparent; }
    .msg { padding: 18px 4px; color: var(--secondary-text-color); }
    .mute { color: var(--secondary-text-color); font-size: 12px; padding-left: 34px; }
    .head { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .logo { width: 42px; height: 42px; border-radius: 13px; display: grid; place-items: center; flex: none;
            background: linear-gradient(140deg, rgba(var(--g), .28), rgba(var(--g), .08)); box-shadow: inset 0 0 0 1px rgba(var(--g), .35); }
    .logo ha-icon { --mdc-icon-size: 24px; color: rgb(var(--g)); }
    .ht { flex: 1; min-width: 0; } .ht b { display: block; font-size: 16px; } .ht small { color: var(--secondary-text-color); font-size: 12px; }
    .ib { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; color: var(--secondary-text-color); flex: none; }
    .ib:hover { background: rgba(127,127,127,.12); color: var(--primary-text-color); }
    .ib.spin ha-icon { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
    .kpis { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 10px; }
    @container (max-width: 700px) { .kpis { grid-template-columns: repeat(3, 1fr); } }
    .kpi { position: relative; padding: 10px 12px; border-radius: 14px; background: rgba(127,127,127,.08); box-shadow: inset 0 0 0 1px rgba(127,127,127,.12); overflow: hidden; }
    .kpi ha-icon { --mdc-icon-size: 17px; color: var(--secondary-text-color); }
    .kpi b { display: block; font-size: 22px; font-weight: 700; line-height: 1.15; margin-top: 2px; font-variant-numeric: tabular-nums; }
    .kpi small { color: var(--secondary-text-color); font-size: 11.5px; }
    .kpi.warn ha-icon, .kpi.warn b { color: rgb(var(--warn)); } .kpi.pr ha-icon, .kpi.pr b { color: rgb(var(--pr)); }
    .kpi .spark { position: absolute; right: 10px; top: 12px; }
    .spark rect { fill: rgba(var(--g), .75); }
    .alert { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 12px; margin-bottom: 10px; font-size: 13px;
             background: rgba(var(--ko), .12); color: rgb(var(--ko)); box-shadow: inset 0 0 0 1px rgba(var(--ko), .3); }
    .alert { flex-wrap: wrap; } .alert ha-icon { --mdc-icon-size: 18px; } .alert > span:first-of-type { font-weight: 600; }
    .alert .fl { display: flex; flex-wrap: wrap; gap: 5px; }
    .alert .fl a { padding: 2px 9px; border-radius: 10px; font-size: 12px; font-weight: 600; background: rgba(var(--ko), .16); white-space: nowrap; }
    .alert .fl a:hover { background: rgba(var(--ko), .28); }
    .bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin: 4px 0 8px; }
    .chips, .sorts { display: flex; gap: 6px; flex-wrap: wrap; }
    .chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 16px; font-size: 13px; font-weight: 600;
            background: rgba(127,127,127,.1); color: var(--secondary-text-color); transition: background .2s, color .2s; }
    .chip span { font-size: 11px; padding: 1px 6px; border-radius: 9px; background: rgba(127,127,127,.18); }
    .chip.on { background: rgba(var(--g), .2); color: rgb(var(--g)); box-shadow: inset 0 0 0 1px rgba(var(--g), .45); }
    .tools { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .search { display: flex; align-items: center; gap: 4px; padding: 0 10px; height: 32px; border-radius: 16px; background: rgba(127,127,127,.1); }
    .search ha-icon { --mdc-icon-size: 16px; color: var(--secondary-text-color); }
    .search input { border: 0; outline: 0; background: none; color: var(--primary-text-color); font: inherit; font-size: 13px; width: 110px; }
    .sort { padding: 5px 9px; border-radius: 12px; font-size: 12px; color: var(--secondary-text-color); }
    .sort.on { color: var(--primary-text-color); background: rgba(127,127,127,.14); font-weight: 600; }
    .list { display: flex; flex-direction: column; gap: 6px; }
    .repo { border-radius: 14px; background: rgba(127,127,127,.06); box-shadow: inset 0 0 0 1px rgba(127,127,127,.1); transition: background .2s; }
    .repo:hover { background: rgba(127,127,127,.1); } .repo.open { background: rgba(var(--g), .06); box-shadow: inset 0 0 0 1px rgba(var(--g), .25); }
    .repo.arch { opacity: .6; }
    .rh { width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px 12px; }
    .ci { width: 10px; height: 10px; border-radius: 50%; flex: none; background: rgba(127,127,127,.4); }
    .ci.ok { background: rgb(var(--ok)); box-shadow: 0 0 6px rgba(var(--ok), .6); }
    .ci.ko { background: rgb(var(--ko)); box-shadow: 0 0 6px rgba(var(--ko), .7); }
    .ci.run { background: rgb(var(--warn)); animation: pulse 1.2s ease-in-out infinite; } @keyframes pulse { 50% { opacity: .35; } }
    .rn { flex: 1; min-width: 0; } .rn b { font-size: 14.5px; }
    .rn small { display: block; color: var(--secondary-text-color); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
    .lock { --mdc-icon-size: 14px; color: var(--secondary-text-color); margin-left: 5px; vertical-align: -1px; }
    .tag { display: inline-block; padding: 0 6px; margin-right: 6px; border-radius: 6px; font-size: 11px; font-weight: 700; background: rgba(var(--g), .16); color: rgb(var(--g)); }
    .tag.none { background: rgba(127,127,127,.14); color: var(--secondary-text-color); font-weight: 500; }
    .new { font-style: normal; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; margin-left: 6px; padding: 1px 6px; border-radius: 6px;
           background: rgba(var(--warn), .18); color: rgb(var(--warn)); vertical-align: 1px; }
    .badges { display: flex; align-items: center; gap: 6px; flex: none; }
    .bd { display: inline-flex; align-items: center; gap: 3px; padding: 3px 8px; border-radius: 10px; font-size: 12.5px; font-weight: 700; font-variant-numeric: tabular-nums; }
    .bd ha-icon { --mdc-icon-size: 14px; }
    .bd.warn { background: rgba(var(--warn), .15); color: rgb(var(--warn)); } .bd.pr { background: rgba(var(--pr), .16); color: rgb(var(--pr)); }
    .bd.dim { color: var(--secondary-text-color); font-weight: 600; }
    .tr { display: inline-flex; align-items: center; gap: 6px; min-width: 104px; justify-content: flex-end; }
    .tr b { font-size: 12.5px; min-width: 28px; text-align: right; font-variant-numeric: tabular-nums; }
    .chev { --mdc-icon-size: 20px; color: var(--secondary-text-color); transition: transform .25s; flex: none; } .open .chev { transform: rotate(180deg); }
    .rd { padding: 0 14px 14px 34px; animation: rise .25s ease-out; } @keyframes rise { from { opacity: 0; transform: translateY(-4px); } }
    .desc { margin: 0 0 8px; color: var(--secondary-text-color); font-size: 13.5px; line-height: 1.4; }
    .topics { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
    .topics span { font-size: 11px; padding: 2px 8px; border-radius: 10px; background: rgba(var(--g), .1); color: rgb(var(--g)); }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(92px, 1fr)); gap: 6px; margin-bottom: 10px; }
    .st { padding: 8px 10px; border-radius: 11px; background: rgba(127,127,127,.08); }
    .st ha-icon { --mdc-icon-size: 15px; color: var(--secondary-text-color); } .st b { display: block; font-size: 16px; font-variant-numeric: tabular-nums; }
    .st small { color: var(--secondary-text-color); font-size: 11px; }
    .lines { display: flex; flex-direction: column; gap: 2px; margin-bottom: 8px; }
    .ln, .it { display: flex; align-items: center; gap: 10px; padding: 7px 8px; border-radius: 10px; font-size: 13px; }
    .ln:hover, .it:hover { background: rgba(127,127,127,.1); }
    .ln ha-icon, .it ha-icon { --mdc-icon-size: 17px; color: var(--secondary-text-color); flex: none; }
    .ln span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .ln small { color: var(--secondary-text-color); font-size: 11.5px; flex: none; }
    .ln .ci { margin: 0 3px; }
    code { font-size: 11px; padding: 1px 5px; border-radius: 5px; background: rgba(127,127,127,.15); }
    .sub { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--secondary-text-color); margin: 6px 0 2px 8px; display: flex; align-items: center; gap: 6px; }
    .sub.ok { color: rgb(var(--ok)); text-transform: none; letter-spacing: 0; font-size: 13px; font-weight: 600; } .sub.ok ha-icon { --mdc-icon-size: 17px; }
    .items { display: flex; flex-direction: column; }
    .it { align-items: flex-start; } .it ha-icon { margin-top: 1px; } .it ha-icon.warn { color: rgb(var(--warn)); } .it ha-icon.pr { color: rgb(var(--pr)); }
    .itt { flex: 1; min-width: 0; line-height: 1.35; } .itt small { display: block; color: var(--secondary-text-color); font-size: 11.5px; margin-top: 2px; }
    .labels { display: inline-flex; flex-wrap: wrap; gap: 4px; margin-left: 4px; vertical-align: 1px; }
    .labels em { font-style: normal; font-size: 10.5px; padding: 0 6px; border-radius: 8px; color: var(--lc); background: color-mix(in srgb, var(--lc) 18%, transparent);
                 box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--lc) 45%, transparent); }
    .acts { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
    .acts a { display: inline-flex; align-items: center; gap: 5px; padding: 6px 11px; border-radius: 14px; font-size: 12.5px; font-weight: 600; background: rgba(127,127,127,.1); }
    .acts a:hover { background: rgba(var(--g), .18); color: rgb(var(--g)); } .acts ha-icon { --mdc-icon-size: 15px; }
    .more { display: block; margin: 10px auto 0; padding: 7px 16px; border-radius: 16px; font-size: 13px; font-weight: 600; color: rgb(var(--g)); background: rgba(var(--g), .1); }
    @container (max-width: 520px) {
      .tr { display: none; } .bd.dim { display: none; } .rd { padding-left: 14px; }
      .kpi { padding: 8px 10px; } .kpi b { font-size: 18px; } .kpi .spark { display: none; }
      .search input { width: 80px; }
    }
    @media (prefers-reduced-motion: reduce) { .ci.run, .ib.spin ha-icon, .rd { animation: none; } }
  `;

  // ───────── éditeur visuel ─────────
  class HolmGitHubCardEditor extends HTMLElement {
    setConfig(c) { this._c = { ...c }; this._render(); }
    set hass(h) { this._hass = h; if (this._f) this._f.hass = h; }
    _render() {
      if (!this._f) {
        this.attachShadow({ mode: "open" });
        this._f = document.createElement("ha-form");
        this.shadowRoot.appendChild(this._f);
        this._f.computeLabel = (s) => ({ title: "Titre", filter: "Filtre par défaut", sort: "Tri par défaut", show_private: "Afficher les dépôts privés", max_rows: "Nombre de dépôts affichés (0 = tous)" }[s.name] || s.name);
        this._f.addEventListener("value-changed", (e) => {
          const cfg = { ...this._c, ...e.detail.value };
          this._c = cfg;
          this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: cfg }, bubbles: true, composed: true }));
        });
      }
      this._f.hass = this._hass;
      this._f.schema = [
        { name: "title", selector: { text: {} } },
        { type: "grid", name: "", schema: [
          { name: "filter", selector: { select: { mode: "dropdown", options: FILTERS.map(([value, label]) => ({ value, label })) } } },
          { name: "sort", selector: { select: { mode: "dropdown", options: SORTS.map(([value, label]) => ({ value, label })) } } },
        ] },
        { type: "grid", name: "", schema: [
          { name: "show_private", selector: { boolean: {} } },
          { name: "max_rows", selector: { number: { mode: "box", min: 0, max: 100 } } },
        ] },
      ];
      this._f.data = { title: "Mes dépôts GitHub", filter: "all", sort: "activity", show_private: true, max_rows: 0, ...this._c };
    }
  }

  if (!customElements.get("holm-github-card")) customElements.define("holm-github-card", HolmGitHubCard);
  if (!customElements.get("holm-github-card-editor")) customElements.define("holm-github-card-editor", HolmGitHubCardEditor);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === "holm-github-card")) {
    window.customCards.push({ type: "holm-github-card", name: "HOLM GitHub", description: "Tous vos dépôts GitHub : issues, PR, releases, validation, audience.", preview: false });
  }
  console.info(`%c HOLM-GITHUB %c ${VERSION} `, "background:#3ecfcf;color:#062;border-radius:3px 0 0 3px", "background:#123;color:#fff;border-radius:0 3px 3px 0");
})();

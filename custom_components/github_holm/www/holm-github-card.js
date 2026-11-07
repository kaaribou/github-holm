/* holm-github-card — HOLM GitHub — licence MIT — v1.1.0 */
/* Tous vos dépôts GitHub d'un coup d'œil : issues et PR, releases, intégration continue, audience.
 * Données fournies par l'intégration HOLM GitHub (commande websocket github_holm/data).
 */
(() => {
  // ---- HOLM i18n : textes écrits en français, traduits à l'affichage (en, de, es, it, nl, pt, pl) ----
  // Langue : option `language` de la carte, sinon celle du profil Home Assistant ; anglais si la langue n'est pas traduite.
  const HOLM_LANGS = ["en", "de", "es", "it", "nl", "pt", "pl"];
  const LANG_NAMES = { fr: "Français", en: "English", de: "Deutsch", es: "Español", it: "Italiano", nl: "Nederlands", pt: "Português", pl: "Polski" };
  const LOCALES = { fr: "fr-FR", en: "en-GB", de: "de-DE", es: "es-ES", it: "it-IT", nl: "nl-NL", pt: "pt-PT", pl: "pl-PL" };
  const I18N = {
    "Automatique (profil)": ["Automatic (profile)", "Automatisch (Profil)", "Automático (perfil)", "Automatica (profilo)", "Automatisch (profiel)", "Automático (perfil)", "Automatycznie (profil)"],
    "Fork de {p}": ["Fork of {p}", "Fork von {p}", "Fork de {p}", "Fork di {p}", "Fork van {p}", "Fork de {p}", "Fork z {p}"],
    "Fork": ["Fork", "Fork", "Fork", "Fork", "Fork", "Fork", "Fork"],
    "original archivé": ["original archived", "Original archiviert", "original archivado", "originale archiviato", "origineel gearchiveerd", "original arquivado", "oryginał zarchiwizowany"],
    "Langue": ["Language", "Sprache", "Idioma", "Lingua", "Taal", "Idioma", "Język"],
    "Titre": ["Title", "Titel", "Título", "Titolo", "Titel", "Título", "Tytuł"],
    "Titre (optionnel)": ["Title (optional)", "Titel (optional)", "Título (opcional)", "Titolo (facoltativo)", "Titel (optioneel)", "Título (opcional)", "Tytuł (opcjonalnie)"],
    "Nom": ["Name", "Name", "Nombre", "Nome", "Naam", "Nome", "Nazwa"],
    "Nom affiché": ["Display name", "Anzeigename", "Nombre mostrado", "Nome visualizzato", "Weergavenaam", "Nome apresentado", "Wyświetlana nazwa"],
    "Icône": ["Icon", "Symbol", "Icono", "Icona", "Pictogram", "Ícone", "Ikona"],
    "Couleur": ["Colour", "Farbe", "Color", "Colore", "Kleur", "Cor", "Kolor"],
    "Couleurs": ["Colours", "Farben", "Colores", "Colori", "Kleuren", "Cores", "Kolory"],
    "Entité": ["Entity", "Entität", "Entidad", "Entità", "Entiteit", "Entidade", "Encja"],
    "Entités": ["Entities", "Entitäten", "Entidades", "Entità", "Entiteiten", "Entidades", "Encje"],
    "Chargement…": ["Loading…", "Wird geladen…", "Cargando…", "Caricamento…", "Laden…", "A carregar…", "Ładowanie…"],
    "Erreur": ["Error", "Fehler", "Error", "Errore", "Fout", "Erro", "Błąd"],
    "Fermer": ["Close", "Schließen", "Cerrar", "Chiudi", "Sluiten", "Fechar", "Zamknij"],
    "Annuler": ["Cancel", "Abbrechen", "Cancelar", "Annulla", "Annuleren", "Cancelar", "Anuluj"],
    "Enregistrer": ["Save", "Speichern", "Guardar", "Salva", "Opslaan", "Guardar", "Zapisz"],
    "Supprimer": ["Delete", "Löschen", "Eliminar", "Elimina", "Verwijderen", "Eliminar", "Usuń"],
    "Ajouter": ["Add", "Hinzufügen", "Añadir", "Aggiungi", "Toevoegen", "Adicionar", "Dodaj"],
    "Monter": ["Move up", "Nach oben", "Subir", "Sposta su", "Omhoog", "Mover para cima", "W górę"],
    "Descendre": ["Move down", "Nach unten", "Bajar", "Sposta giù", "Omlaag", "Mover para baixo", "W dół"],
    "Afficher le cadre de la carte": ["Show the card frame", "Kartenrahmen anzeigen", "Mostrar el marco de la tarjeta", "Mostra la cornice della scheda", "Kaartkader tonen", "Mostrar a moldura do cartão", "Pokaż ramkę karty"],
    "Indisponible": ["Unavailable", "Nicht verfügbar", "No disponible", "Non disponibile", "Niet beschikbaar", "Indisponível", "Niedostępne"],
    "Aujourd'hui": ["Today", "Heute", "Hoy", "Oggi", "Vandaag", "Hoje", "Dziś"],
    "Hier": ["Yesterday", "Gestern", "Ayer", "Ieri", "Gisteren", "Ontem", "Wczoraj"],
    "Demain": ["Tomorrow", "Morgen", "Mañana", "Domani", "Morgen", "Amanhã", "Jutro"],
    "Batterie": ["Battery", "Batterie", "Batería", "Batteria", "Batterij", "Bateria", "Bateria"],
    "Aucune donnée sur cette période.": ["No data for this period.", "Keine Daten für diesen Zeitraum.", "No hay datos en este periodo.", "Nessun dato per questo periodo.", "Geen gegevens voor deze periode.", "Sem dados neste período.", "Brak danych w tym okresie."],
    "à l'instant": ["just now", "gerade eben", "ahora mismo", "proprio ora", "zojuist", "agora mesmo", "przed chwilą"],
    "il y a {n} min": ["{n} min ago", "vor {n} Min.", "hace {n} min", "{n} min fa", "{n} min geleden", "há {n} min", "{n} min temu"],
    "il y a {n} h": ["{n} h ago", "vor {n} Std.", "hace {n} h", "{n} h fa", "{n} u geleden", "há {n} h", "{n} godz. temu"],
    "il y a {n} j": ["{n} d ago", "vor {n} T.", "hace {n} d", "{n} g fa", "{n} d geleden", "há {n} d", "{n} dni temu"],
    "hier": ["yesterday", "gestern", "ayer", "ieri", "gisteren", "ontem", "wczoraj"],
    "il y a {n} mois": ["{n} months ago", "vor {n} Monaten", "hace {n} meses", "{n} mesi fa", "{n} maanden geleden", "há {n} meses", "{n} mies. temu"],
    "il y a {n} an": ["{n} year ago", "vor {n} Jahr", "hace {n} año", "{n} anno fa", "{n} jaar geleden", "há {n} ano", "{n} rok temu"],
    "il y a {n} ans": ["{n} years ago", "vor {n} Jahren", "hace {n} años", "{n} anni fa", "{n} jaar geleden", "há {n} anos", "{n} lata temu"],
    "Tous": ["All", "Alle", "Todos", "Tutti", "Alle", "Todos", "Wszystkie"],
    "À traiter": ["To do", "Zu erledigen", "Pendientes", "Da gestire", "Te doen", "A tratar", "Do zrobienia"],
    "Publics": ["Public", "Öffentlich", "Públicos", "Pubblici", "Openbaar", "Públicos", "Publiczne"],
    "Privés": ["Private", "Privat", "Privados", "Privati", "Privé", "Privados", "Prywatne"],
    "Activité": ["Activity", "Aktivität", "Actividad", "Attività", "Activiteit", "Atividade", "Aktywność"],
    "Issues": ["Issues", "Issues", "Issues", "Issue", "Issues", "Issues", "Zgłoszenia"],
    "Étoiles": ["Stars", "Sterne", "Estrellas", "Stelle", "Sterren", "Estrelas", "Gwiazdki"],
    "Vues": ["Views", "Aufrufe", "Visitas", "Visite", "Weergaven", "Visitas", "Wyświetlenia"],
    "Validation réussie": ["Checks passed", "Prüfung erfolgreich", "Validación correcta", "Verifica riuscita", "Controle geslaagd", "Validação bem-sucedida", "Walidacja udana"],
    "Validation en échec": ["Checks failed", "Prüfung fehlgeschlagen", "Validación fallida", "Verifica non riuscita", "Controle mislukt", "Validação falhada", "Walidacja nieudana"],
    "Validation annulée": ["Checks cancelled", "Prüfung abgebrochen", "Validación cancelada", "Verifica annullata", "Controle geannuleerd", "Validação cancelada", "Walidacja anulowana"],
    "Validation expirée": ["Checks timed out", "Prüfung abgelaufen", "Validación caducada", "Verifica scaduta", "Controle verlopen", "Validação expirada", "Walidacja przekroczyła czas"],
    "Action requise": ["Action required", "Aktion erforderlich", "Acción requerida", "Azione richiesta", "Actie vereist", "Ação necessária", "Wymagane działanie"],
    "Validation ignorée": ["Checks skipped", "Prüfung übersprungen", "Validación omitida", "Verifica saltata", "Controle overgeslagen", "Validação ignorada", "Walidacja pominięta"],
    "Pas de validation": ["No checks", "Keine Prüfung", "Sin validación", "Nessuna verifica", "Geen controle", "Sem validação", "Brak walidacji"],
    "Validation HACS impossible sur un dépôt privé (normal)": ["HACS can't validate a private repo (normal)", "HACS kann private Repos nicht prüfen (normal)", "HACS no puede validar un repositorio privado (normal)", "HACS non può verificare un repository privato (normale)", "HACS kan een privé-repo niet controleren (normaal)", "O HACS não pode validar um repositório privado (normal)", "HACS nie może walidować prywatnego repozytorium (normalne)"],
    "Validation en cours": ["Checks running", "Prüfung läuft", "Validación en curso", "Verifica in corso", "Controle bezig", "Validação em curso", "Walidacja w toku"],
    "Mes dépôts GitHub": ["My GitHub repos", "Meine GitHub-Repos", "Mis repositorios de GitHub", "I miei repository GitHub", "Mijn GitHub-repo's", "Os meus repositórios GitHub", "Moje repozytoria GitHub"],
    "Aucun compte : ajoutez l'intégration HOLM GitHub.": ["No account: add the HOLM GitHub integration.", "Kein Konto: Fügen Sie die Integration HOLM GitHub hinzu.", "Ninguna cuenta: añade la integración HOLM GitHub.", "Nessun account: aggiungi l'integrazione HOLM GitHub.", "Geen account: voeg de integratie HOLM GitHub toe.", "Nenhuma conta: adicione a integração HOLM GitHub.", "Brak konta: dodaj integrację HOLM GitHub."],
    "L'intégration HOLM GitHub n'est pas installée.": ["The HOLM GitHub integration is not installed.", "Die Integration HOLM GitHub ist nicht installiert.", "La integración HOLM GitHub no está instalada.", "L'integrazione HOLM GitHub non è installata.", "De integratie HOLM GitHub is niet geïnstalleerd.", "A integração HOLM GitHub não está instalada.", "Integracja HOLM GitHub nie jest zainstalowana."],
    "{a} publics · {b} privés": ["{a} public · {b} private", "{a} öffentlich · {b} privat", "{a} públicos · {b} privados", "{a} pubblici · {b} privati", "{a} openbaar · {b} privé", "{a} públicos · {b} privados", "{a} publiczne · {b} prywatne"],
    "issues ouvertes": ["open issues", "offene Issues", "issues abiertas", "issue aperte", "open issues", "issues abertas", "otwarte zgłoszenia"],
    "pull requests": ["pull requests", "Pull-Requests", "pull requests", "pull request", "pull requests", "pull requests", "pull requesty"],
    "étoiles · {n} forks": ["stars · {n} forks", "Sterne · {n} Forks", "estrellas · {n} forks", "stelle · {n} fork", "sterren · {n} forks", "estrelas · {n} forks", "gwiazdki · {n} forków"],
    "vues sur 14 j": ["views in 14 d", "Aufrufe in 14 T", "visitas en 14 d", "visite in 14 g", "weergaven in 14 d", "visitas em 14 d", "wyświetleń w 14 d"],
    "téléchargements": ["downloads", "Downloads", "descargas", "download", "downloads", "transferências", "pobrań"],
    "{n} validations en échec": ["{n} failed checks", "{n} fehlgeschlagene Prüfungen", "{n} validaciones fallidas", "{n} verifiche non riuscite", "{n} mislukte controles", "{n} validações falhadas", "{n} nieudanych walidacji"],
    "Rechercher": ["Search", "Suchen", "Buscar", "Cerca", "Zoeken", "Pesquisar", "Szukaj"],
    "Aucun dépôt ne correspond.": ["No repo matches.", "Kein Repo passt.", "Ningún repositorio coincide.", "Nessun repository corrisponde.", "Geen repo komt overeen.", "Nenhum repositório corresponde.", "Brak pasujących repozytoriów."],
    "Réduire": ["Show less", "Weniger anzeigen", "Mostrar menos", "Mostra meno", "Minder tonen", "Mostrar menos", "Pokaż mniej"],
    "Voir les {n} dépôts": ["Show the {n} repos", "Alle {n} Repos anzeigen", "Ver los {n} repositorios", "Mostra i {n} repository", "Alle {n} repo's tonen", "Ver os {n} repositórios", "Pokaż {n} repozytoriów"],
    "mis à jour {t}": ["updated {t}", "aktualisiert {t}", "actualizado {t}", "aggiornato {t}", "bijgewerkt {t}", "atualizado {t}", "zaktualizowano {t}"],
    "quota API : {n}": ["API quota: {n}", "API-Kontingent: {n}", "cuota de API: {n}", "quota API: {n}", "API-quotum: {n}", "quota de API: {n}", "limit API: {n}"],
    "Ouvrir GitHub": ["Open GitHub", "GitHub öffnen", "Abrir GitHub", "Apri GitHub", "GitHub openen", "Abrir o GitHub", "Otwórz GitHub"],
    "Actualiser": ["Refresh", "Aktualisieren", "Actualizar", "Aggiorna", "Vernieuwen", "Atualizar", "Odśwież"],
    "Privé": ["Private", "Privat", "Privado", "Privato", "Privé", "Privado", "Prywatne"],
    "nouveau": ["new", "neu", "nuevo", "nuovo", "nieuw", "novo", "nowe"],
    "pas de release": ["no release", "kein Release", "sin release", "nessuna release", "geen release", "sem release", "brak wydania"],
    "actif {t}": ["active {t}", "aktiv {t}", "activo {t}", "attivo {t}", "actief {t}", "ativo {t}", "aktywne {t}"],
    "Issues ouvertes": ["Open issues", "Offene Issues", "Issues abiertas", "Issue aperte", "Open issues", "Issues abertas", "Otwarte zgłoszenia"],
    "Pull requests ouvertes": ["Open pull requests", "Offene Pull-Requests", "Pull requests abiertas", "Pull request aperte", "Open pull requests", "Pull requests abertos", "Otwarte pull requesty"],
    "Vues sur 14 jours": ["Views over 14 days", "Aufrufe in 14 Tagen", "Visitas en 14 días", "Visite in 14 giorni", "Weergaven over 14 dagen", "Visitas em 14 dias", "Wyświetlenia w 14 dni"],
    "étoiles": ["stars", "Sterne", "estrellas", "stelle", "sterren", "estrelas", "gwiazdki"],
    "forks": ["forks", "Forks", "forks", "fork", "forks", "forks", "forki"],
    "vues · {n} visiteurs": ["views · {n} visitors", "Aufrufe · {n} Besucher", "visitas · {n} visitantes", "visite · {n} visitatori", "weergaven · {n} bezoekers", "visitas · {n} visitantes", "wyświetleń · {n} odwiedzających"],
    "clones · {n} uniques": ["clones · {n} unique", "Klone · {n} eindeutig", "clones · {n} únicos", "clonazioni · {n} uniche", "klonen · {n} uniek", "clones · {n} únicos", "klonów · {n} unikalnych"],
    "releases": ["releases", "Releases", "releases", "release", "releases", "releases", "wydania"],
    "release": ["release", "Release", "release", "release", "release", "release", "wydanie"],
    "Dernière release": ["Latest release", "Letztes Release", "Última release", "Ultima release", "Laatste release", "Última release", "Ostatnie wydanie"],
    "Issues et pull requests ouvertes": ["Open issues and pull requests", "Offene Issues und Pull-Requests", "Issues y pull requests abiertas", "Issue e pull request aperte", "Open issues en pull requests", "Issues e pull requests abertos", "Otwarte zgłoszenia i pull requesty"],
    "commentaire": ["comment", "Kommentar", "comentario", "commento", "reactie", "comentário", "komentarz"],
    "commentaires": ["comments", "Kommentare", "comentarios", "commenti", "reacties", "comentários", "komentarzy"],
    "… et {n} autres": ["… and {n} more", "… und {n} weitere", "… y {n} más", "… e altre {n}", "… en {n} meer", "… e mais {n}", "… i {n} więcej"],
    "Aucune issue ouverte": ["No open issues", "Keine offenen Issues", "Ninguna issue abierta", "Nessuna issue aperta", "Geen open issues", "Nenhuma issue aberta", "Brak otwartych zgłoszeń"],
    "Dépôt": ["Repo", "Repo", "Repositorio", "Repository", "Repo", "Repositório", "Repozytorium"],
    "Trafic": ["Traffic", "Traffic", "Tráfico", "Traffico", "Verkeer", "Tráfego", "Ruch"],
    "Filtre par défaut": ["Default filter", "Standardfilter", "Filtro predeterminado", "Filtro predefinito", "Standaardfilter", "Filtro padrão", "Domyślny filtr"],
    "Tri par défaut": ["Default sort", "Standardsortierung", "Orden predeterminado", "Ordinamento predefinito", "Standaardsortering", "Ordenação padrão", "Domyślne sortowanie"],
    "Afficher les dépôts privés": ["Show private repos", "Private Repos anzeigen", "Mostrar los repositorios privados", "Mostra i repository privati", "Privé-repo's tonen", "Mostrar os repositórios privados", "Pokaż prywatne repozytoria"],
    "Nombre de dépôts affichés (0 = tous)": ["Number of repos shown (0 = all)", "Anzahl angezeigter Repos (0 = alle)", "Número de repositorios mostrados (0 = todos)", "Numero di repository mostrati (0 = tutti)", "Aantal getoonde repo's (0 = alle)", "Número de repositórios mostrados (0 = todos)", "Liczba wyświetlanych repozytoriów (0 = wszystkie)"],
    "Tous vos dépôts GitHub : issues, PR, releases, validation, audience.": ["All your GitHub repos: issues, PRs, releases, checks, audience.", "Alle Ihre GitHub-Repos: Issues, PRs, Releases, Prüfungen, Reichweite.", "Todos tus repositorios de GitHub: issues, PR, releases, validación, audiencia.", "Tutti i tuoi repository GitHub: issue, PR, release, verifiche, pubblico.", "Al je GitHub-repo's: issues, PR's, releases, controles, bereik.", "Todos os seus repositórios GitHub: issues, PR, releases, validação, audiência.", "Wszystkie Twoje repozytoria GitHub: zgłoszenia, PR, wydania, walidacja, odbiorcy."]
  };
  let LANG = "fr", NUMLOC = "fr-FR";
  const langOf = (hass, c) => { const l = String((c && c.language) || (hass && ((hass.locale && hass.locale.language) || hass.language)) || navigator.language || "en").toLowerCase().split(/[-_]/)[0]; return l === "fr" || HOLM_LANGS.includes(l) ? l : "en"; };
  const setLang = (hass, c) => { LANG = langOf(hass, c); const p = hass && hass.locale && hass.locale.language; NUMLOC = !(c && c.language) && p && p.toLowerCase().startsWith(LANG) ? p : LOCALES[LANG]; return LANG; };
  const _ = (s, v) => { let o = LANG === "fr" ? s : ((I18N[s] && I18N[s][HOLM_LANGS.indexOf(LANG)]) || s); if (v) for (const k in v) o = o.split("{" + k + "}").join(v[k]); return o; };
  // champ « Langue » pour les éditeurs visuels (ha-form)
  const langField = () => ({ name: "language", selector: { select: { mode: "dropdown", options: [{ value: "", label: _("Automatique (profil)") }, ...Object.entries(LANG_NAMES).map(([value, label]) => ({ value, label }))] } } });
  // traduit les titres de sections et les libellés d'options d'un schéma ha-form (écrits en français)
  const locSchema = (sc) => (sc || []).map((x) => { const o = { ...x }; if (o.title) o.title = _(o.title); if (o.schema) o.schema = locSchema(o.schema);
    if (o.selector && o.selector.select && o.name !== "language") o.selector = { ...o.selector, select: { ...o.selector.select, options: (o.selector.select.options || []).map((op) => (typeof op === "string" ? op : { ...op, label: _(op.label) })) } };
    if (o.name === "language" && o.selector && o.selector.select) o.selector = { ...o.selector, select: { ...o.selector.select, options: o.selector.select.options.map((op) => (op.value ? op : { ...op, label: _("Automatique (profil)") })) } };
    return o; });
  const VERSION = "1.2.0";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nf = (n) => Number(n || 0).toLocaleString(NUMLOC);
  const short = (n) => { n = Number(n || 0); return n >= 10000 ? `${(n / 1000).toFixed(0)} k` : n >= 1000 ? `${(n / 1000).toLocaleString(NUMLOC, { maximumFractionDigits: 1, minimumFractionDigits: 1 })} k` : String(n); };
  const ago = (iso) => {
    if (!iso) return "";
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return _("à l'instant");
    if (s < 3600) return _("il y a {n} min", { n: Math.floor(s / 60) });
    if (s < 86400) return _("il y a {n} h", { n: Math.floor(s / 3600) });
    const d = Math.floor(s / 86400);
    if (d === 1) return _("hier");
    if (d < 31) return _("il y a {n} j", { n: d });
    const m = Math.floor(d / 30.4);
    return m < 12 ? _("il y a {n} mois", { n: m }) : _(m >= 24 ? _("il y a {n} ans") : _("il y a {n} an"), { n: Math.floor(m / 12) });
  };
  const isNew = (iso, days = 7) => iso && Date.now() - new Date(iso).getTime() < days * 86400000;
  const FILTERS = [["all", _("Tous")], ["todo", _("À traiter")], ["public", _("Publics")], ["private", _("Privés")]];
  const SORTS = [["activity", _("Activité")], ["issues", _("Issues")], ["stars", _("Étoiles")], ["views", _("Vues")], ["name", _("Nom")]];
  const CI = {
    success: ["ok", _("Validation réussie")], failure: ["ko", _("Validation en échec")], cancelled: ["off", _("Validation annulée")],
    timed_out: ["ko", _("Validation expirée")], action_required: ["run", _("Action requise")], skipped: ["off", _("Validation ignorée")],
  };
  // HACS ne sait pas valider un dépôt privé : cet échec-là est normal tant que le dépôt n'est pas public
  const hacsPrivate = (r) => r.private && r.ci && /valid|hacs/i.test(r.ci.name || "") && r.ci.conclusion === "failure";
  const ciOf = (ci, r) => !ci ? ["none", _("Pas de validation")]
    : r && hacsPrivate(r) ? ["off", _("Validation HACS impossible sur un dépôt privé (normal)")]
    : ci.status !== "completed" ? ["run", _("Validation en cours")] : (CI[ci.conclusion] || ["off", ci.conclusion || ""]);

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
      { const _l = setLang(h, this._c); if (this._lang && _l !== this._lang && this._data) setTimeout(() => this._render()); this._lang = _l; }
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
        this._err = this._data.length ? null : _("Aucun compte : ajoutez l'intégration HOLM GitHub.");
      } catch (e) {
        this._err = /unknown_command|Unknown command/i.test(e?.message || e?.code || "") ? _("L'intégration HOLM GitHub n'est pas installée.") : (e?.message || String(e));
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
      setLang(this._hass, this._c);
      const root = this.shadowRoot?.getElementById("root");
      if (!root || !this._c) return;
      if (this._err && !this._data?.length) { root.innerHTML = `${this._head(null)}<div class="msg">${esc(this._err)}</div>`; return; }
      if (!this._data) { root.innerHTML = `${this._head(null)}<div class="msg">${_("Chargement…")}</div>`; return; }
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
          ${kpi("mdi:source-repository-multiple", repos.length, _("{a} publics · {b} privés", { a: pub, b: repos.length - pub }))}
          ${kpi("mdi:alert-circle-outline", sum("open_issues"), _("issues ouvertes"), sum("open_issues") ? "warn" : "")}
          ${kpi("mdi:source-pull", sum("open_prs"), _("pull requests"), sum("open_prs") ? "pr" : "")}
          ${kpi("mdi:star-outline", nf(sum("stars")), _("étoiles · {n} forks", { n: nf(sum("forks")) }))}
          ${hasTraffic ? kpi("mdi:eye-outline", short(views), _("vues sur 14 j"), "", this._spark(this._totalDays(repos), "v", 64, 18)) : ""}
          ${kpi("mdi:download-outline", short(sum("downloads")), _("téléchargements"))}
        </div>
        ${fails.length ? `<div class="alert"><ha-icon icon="mdi:close-octagon-outline"></ha-icon><span>${fails.length > 1 ? _("{n} validations en échec", { n: fails.length }) : _("Validation en échec")}</span>
          <span class="fl">${fails.map((r) => `<a href="${esc(r.ci.url)}" target="_blank" rel="noopener" title="${esc(r.ci.name || "")} · ${ago(r.ci.date)}">${esc(r.name)}</a>`).join("")}</span></div>` : ""}
        <div class="bar">
          <div class="chips">${FILTERS.map(([k, l]) => `<button class="chip${this._filter === k ? " on" : ""}" data-f="${k}">${_(l)}<span>${counts[k]}</span></button>`).join("")}</div>
          <div class="tools">
            <label class="search"><ha-icon icon="mdi:magnify"></ha-icon><input id="q" placeholder="${_("Rechercher")}" value="${esc(this._q || "")}"></label>
            <div class="sorts">${SORTS.filter(([k]) => k !== "views" || hasTraffic).map(([k, l]) => `<button class="sort${this._sort === k ? " on" : ""}" data-s="${k}">${_(l)}</button>`).join("")}</div>
          </div>
        </div>
        <div class="list">${shown.length ? shown.map((r) => this._row(r)).join("") : `<div class="msg">${_("Aucun dépôt ne correspond.")}</div>`}</div>
        ${max && list.length > max ? `<button class="more" data-all>${this._showAll ? _("Réduire") : _("Voir les {n} dépôts", { n: list.length })}</button>` : ""}`;
    }
    _head(repos) {
      const a = this._data?.[0];
      const rate = a?.rate?.remaining;
      return `<div class="head">
        <div class="logo"><ha-icon icon="mdi:github"></ha-icon></div>
        <div class="ht"><b>${esc(_(this._c.title))}</b><small>${a ? `${esc(a.owner)} · ${_("mis à jour {t}", { t: ago(a.updated) })}` : "HOLM GitHub"}${rate !== undefined && rate < 500 ? ` · ${_("quota API : {n}", { n: rate })}` : ""}</small></div>
        ${a?.owner ? `<a class="ib" href="https://github.com/${esc(a.owner)}?tab=repositories" target="_blank" rel="noopener" title="${_("Ouvrir GitHub")}"><ha-icon icon="mdi:open-in-new"></ha-icon></a>` : ""}
        <button class="ib${this._busy ? " spin" : ""}" data-refresh title="${_("Actualiser")}"><ha-icon icon="mdi:refresh"></ha-icon></button>
      </div>`;
    }
    _row(r) {
      const [ci, ciL] = ciOf(r.ci, r);
      const open = this._open === r.full_name;
      const fresh = r.issues.some((i) => isNew(i.created));
      const rel = r.release;
      return `<div class="repo${open ? " open" : ""}${r.archived ? " arch" : ""}">
        <button class="rh" data-open="${esc(r.full_name)}">
          <span class="ci ${ci}" title="${esc(_(ciL))}"></span>
          <span class="rn"><b>${esc(r.name)}</b>${r.private ? `<ha-icon class="lock" icon="mdi:lock-outline" title="${_("Privé")}"></ha-icon>` : ""}${r.fork ? `<ha-icon class="lock" icon="mdi:source-fork" title="${esc(r.parent ? _("Fork de {p}", { p: r.parent.full_name }) : _("Fork"))}"></ha-icon>` : ""}${fresh ? `<i class="new">${_("nouveau")}</i>` : ""}
            <small>${rel ? `<span class="tag">${esc(rel.tag)}</span>${ago(rel.date)}` : `<span class="tag none">${_("pas de release")}</span>`}${r.pushed ? ` · ${_("actif {t}", { t: ago(r.pushed) })}` : ""}</small></span>
          <span class="badges">
            ${r.open_issues ? `<span class="bd warn" title="${_("Issues ouvertes")}"><ha-icon icon="mdi:alert-circle-outline"></ha-icon>${r.open_issues}</span>` : ""}
            ${r.open_prs ? `<span class="bd pr" title="${_("Pull requests ouvertes")}"><ha-icon icon="mdi:source-pull"></ha-icon>${r.open_prs}</span>` : ""}
            <span class="bd dim" title="${_("Étoiles")}"><ha-icon icon="mdi:star-outline"></ha-icon>${r.stars}</span>
            ${r.traffic ? `<span class="tr" title="${_("Vues sur 14 jours")}">${this._spark(r.traffic.days)}<b>${short(r.traffic.views)}</b></span>` : ""}
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
          ${stat("mdi:star-outline", nf(r.stars), _("étoiles"))}
          ${stat("mdi:source-fork", nf(r.forks), _("forks"))}
          ${t ? stat("mdi:eye-outline", nf(t.views), _("vues · {n} visiteurs", { n: nf(t.views_uniques) })) : ""}
          ${t ? stat("mdi:content-copy", nf(t.clones), _("clones · {n} uniques", { n: nf(t.clones_uniques) })) : ""}
          ${stat("mdi:tag-outline", r.releases, r.releases > 1 ? _("releases") : _("release"))}
          ${stat("mdi:download-outline", nf(r.downloads), _("téléchargements"))}
        </div>
        <div class="lines">
          ${r.fork ? (r.parent ? `<a class="ln" href="${esc(r.parent.url)}" target="_blank" rel="noopener"><ha-icon icon="mdi:source-fork"></ha-icon><span>${_("Fork de {p}", { p: `<b>${esc(r.parent.full_name)}</b>` })}</span>${r.parent.archived ? `<small>${_("original archivé")}</small>` : ""}</a>` : `<div class="ln"><ha-icon icon="mdi:source-fork"></ha-icon><span>${_("Fork")}</span></div>`) : ""}
          ${r.release ? `<a class="ln" href="${esc(r.release.url)}" target="_blank" rel="noopener"><ha-icon icon="mdi:tag-outline"></ha-icon><span>${_("Dernière release")} <b>${esc(r.release.tag)}</b>${r.release.name && r.release.name !== r.release.tag ? ` — ${esc(r.release.name)}` : ""}</span><small>${ago(r.release.date)}</small></a>` : ""}
          ${r.commit ? `<a class="ln" href="${esc(r.commit.url)}" target="_blank" rel="noopener"><ha-icon icon="mdi:source-commit"></ha-icon><span>${esc(r.commit.message)} <code>${esc(r.commit.sha)}</code></span><small>${ago(r.commit.date)}</small></a>` : ""}
          ${r.ci ? `<a class="ln" href="${esc(r.ci.url)}" target="_blank" rel="noopener"><i class="ci ${ci}"></i><span>${esc(_(ciL))} · ${esc(r.ci.name || "")}</span><small>${ago(r.ci.date)}</small></a>` : ""}
        </div>
        ${items.length ? `<div class="sub">${_("Issues et pull requests ouvertes")}</div><div class="items">${items.map((i) => `
          <a class="it" href="${esc(i.url)}" target="_blank" rel="noopener">
            <ha-icon class="${i.pr ? "pr" : "warn"}" icon="${i.pr ? "mdi:source-pull" : "mdi:alert-circle-outline"}"></ha-icon>
            <span class="itt">${esc(i.title)}${isNew(i.created) ? ` <i class="new">${_("nouveau")}</i>` : ""}
              ${i.labels.length ? `<span class="labels">${i.labels.slice(0, 3).map((l) => `<em style="--lc:#${esc(l.color || "888")}">${esc(l.name)}</em>`).join("")}</span>` : ""}
              <small>#${i.number} · ${esc(i.user || "")} · ${ago(i.created)}${i.comments ? ` · ${i.comments} ${i.comments > 1 ? _("commentaires") : _("commentaire")}` : ""}</small></span>
          </a>`).join("")}</div>${r.issues.length > items.length ? `<small class="mute">${_("… et {n} autres", { n: r.issues.length - items.length })}</small>` : ""}` : `<div class="sub ok"><ha-icon icon="mdi:check-circle-outline"></ha-icon>${_("Aucune issue ouverte")}</div>`}
        <div class="acts">
          <a href="${esc(gh)}" target="_blank" rel="noopener"><ha-icon icon="mdi:github"></ha-icon>${_("Dépôt")}</a>
          <a href="${esc(gh)}/issues" target="_blank" rel="noopener"><ha-icon icon="mdi:alert-circle-outline"></ha-icon>${_("Issues")}</a>
          <a href="${esc(gh)}/pulls" target="_blank" rel="noopener"><ha-icon icon="mdi:source-pull"></ha-icon>PR</a>
          <a href="${esc(gh)}/releases" target="_blank" rel="noopener"><ha-icon icon="mdi:tag-outline"></ha-icon>Releases</a>
          ${r.traffic ? `<a href="${esc(gh)}/graphs/traffic" target="_blank" rel="noopener"><ha-icon icon="mdi:chart-line"></ha-icon>${_("Trafic")}</a>` : ""}
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
    set hass(h) { this._hass = h; const _l = setLang(h, this._c); if (this._f && _l !== this._lang) { this._lang = _l; this._render(); } this._lang = _l; if (this._f) this._f.hass = h; }
    _render() {
      if (!this._f) {
        this.attachShadow({ mode: "open" });
        this._f = document.createElement("ha-form");
        this.shadowRoot.appendChild(this._f);
        this._f.computeLabel = (s) => ({ language: _("Langue"), title: _("Titre"), filter: _("Filtre par défaut"), sort: _("Tri par défaut"), show_private: _("Afficher les dépôts privés"), max_rows: _("Nombre de dépôts affichés (0 = tous)") }[s.name] ? _({ language: _("Langue"), title: _("Titre"), filter: _("Filtre par défaut"), sort: _("Tri par défaut"), show_private: _("Afficher les dépôts privés"), max_rows: _("Nombre de dépôts affichés (0 = tous)") }[s.name]) : s.name);
        this._f.addEventListener("value-changed", (e) => {
          const cfg = { ...this._c, ...e.detail.value };
          if (!cfg.language) delete cfg.language;
          this._c = cfg;
          this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: cfg }, bubbles: true, composed: true }));
        });
      }
      this._f.hass = this._hass;
      setLang(this._hass, this._c);
      this._f.schema = locSchema([
        langField(),
        { name: "title", selector: { text: {} } },
        { type: "grid", name: "", schema: [
          { name: "filter", selector: { select: { mode: "dropdown", options: FILTERS.map(([value, label]) => ({ value, label })) } } },
          { name: "sort", selector: { select: { mode: "dropdown", options: SORTS.map(([value, label]) => ({ value, label })) } } },
        ] },
        { type: "grid", name: "", schema: [
          { name: "show_private", selector: { boolean: {} } },
          { name: "max_rows", selector: { number: { mode: "box", min: 0, max: 100 } } },
        ] },
      ]);
      this._f.data = { title: "Mes dépôts GitHub", filter: "all", sort: "activity", show_private: true, max_rows: 0, ...this._c };
    }
  }

  if (!customElements.get("holm-github-card")) customElements.define("holm-github-card", HolmGitHubCard);
  if (!customElements.get("holm-github-card-editor")) customElements.define("holm-github-card-editor", HolmGitHubCardEditor);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === "holm-github-card")) {
    setLang(document.querySelector("home-assistant")?.hass);
    window.customCards.push({ type: "holm-github-card", name: "HOLM GitHub", description: _("Tous vos dépôts GitHub : issues, PR, releases, validation, audience."), preview: false });
  }
  console.info(`%c HOLM-GITHUB %c ${VERSION} `, "background:#3ecfcf;color:#062;border-radius:3px 0 0 3px", "background:#123;color:#fff;border-radius:0 3px 3px 0");
})();

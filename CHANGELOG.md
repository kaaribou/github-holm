# Changelog

## 1.2.0
- **Forks repris** : un fork dont le dépôt d'origine est archivé est affiché comme vos propres dépôts (option « Inclure les forks dont l'original est archivé », activée par défaut). L'original est relu une fois par jour (une requête par fork). Merci à AuroreVgn (#1).
- **Dépôts toujours affichés** : nouvelle option, liste de noms affichés même s'ils sont forks ou archivés. « Dépôts à ignorer » reste prioritaire.
- Les deux listes acceptent `nom` ou `propriétaire/nom`.
- Carte : icône fork à côté du nom ; dans le détail, ligne « Fork de propriétaire/dépôt » vers l'original, avec « original archivé ». Nouvelle donnée `parent` pour chaque dépôt.
- Aides sous chaque option dans la fenêtre des options (8 langues).

## 1.1.0
- **8 langues** : traductions allemand, espagnol, italien, néerlandais, portugais et polonais ajoutées (configuration, options, entités, actions), en plus du français et de l'anglais. Carte HOLM GitHub traduite elle aussi (éditeur compris), avec une nouvelle option `language` ; elle suit sinon la langue du profil Home Assistant (anglais si la langue n'est pas traduite).
- README en anglais (`README.en.md`).

## 1.0.0

- Première version : tous les dépôts d'un compte GitHub (publics et privés) dans Home Assistant, avec un simple jeton d'accès personnel.
- Pour chaque dépôt : issues et pull requests ouvertes (titres, étiquettes, auteurs), dernière release, nombre de releases et téléchargements, dernier commit, état de la validation (GitHub Actions), étoiles, forks, vues et clones sur 14 jours.
- Capteurs de synthèse : dépôts, issues, pull requests, étoiles, forks, vues, clones, téléchargements et quota API restant.
- Évènement `github_holm_new_item` à chaque nouvelle issue ou pull request, pour vos notifications.
- Action `github_holm.refresh` pour tout relire immédiatement.
- Requêtes conditionnelles (ETag) : les données inchangées ne consomment pas le quota GitHub ; trafic relu une fois par heure.
- Carte **HOLM GitHub** incluse et déclarée automatiquement : chiffres clés, filtres, recherche, tri, détail dépliable de chaque dépôt, éditeur visuel.

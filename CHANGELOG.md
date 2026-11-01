# Changelog

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

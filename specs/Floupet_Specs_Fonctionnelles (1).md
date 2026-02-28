# 🐾 Floupet — Spécifications Fonctionnelles

> **Le compagnon de vos compagnons**

| | |
|---|---|
| **Version** | MVP + v1 |
| **Date** | Février 2026 |
| **Statut** | Brouillon |

---

## Table des matières

1. [Contexte & Objectifs](#1-contexte--objectifs)
2. [Utilisateurs & Rôles](#2-utilisateurs--rôles)
3. [Entités & Modèle de données](#3-entités--modèle-de-données)
4. [Parcours utilisateur & User Stories](#4-parcours-utilisateur--user-stories)
5. [Écrans & Navigation](#5-écrans--navigation)
6. [Backoffice Admin](#6-backoffice-admin)
7. [Règles métier](#7-règles-métier)
8. [Exigences non fonctionnelles](#8-exigences-non-fonctionnelles)
9. [Plan de livraison](#9-plan-de-livraison)
10. [Stack technique recommandée](#10-stack-technique-recommandée)

---

## 1. Contexte & Objectifs

### 1.1 Présentation du produit

Floupet est une application web progressive (PWA) permettant à un foyer de suivre la santé et l'alimentation de ses animaux domestiques. Pensée pour tous types d'animaux (chats, chiens, lapins, etc.), elle est extensible sans limite d'espèce.

Le produit est centré sur le **foyer** : plusieurs membres d'une même famille peuvent accéder aux données et y contribuer, selon leur rôle.

### 1.2 Objectifs stratégiques

- Fournir un journal d'alimentation précis (grammes, produits scannés) pour éviter la sur/sous-alimentation
- Centraliser le suivi santé : poids, vaccins, médicaments, rendez-vous vétérinaires
- Permettre une gestion multi-utilisateurs par foyer avec système de rôles
- Proposer un backoffice de validation des produits alimentaires contribués par la communauté

### 1.3 Périmètre

| ✅ Inclus dans le périmètre | ❌ Hors périmètre (phase 2+) |
|---|---|
| Auth + foyers + invitations | Paiement / abonnement |
| Gestion des animaux | Application mobile native (PWA suffisant) |
| Journal alimentation + scan code-barres | Partage temps réel avec vétérinaire |
| Catalogue produits + propositions | Intégration tracker GPS |
| Suivi poids + courbe de tendance | IA / diagnostic automatique |
| Médicaments + rappels | RGPD export/suppression compte |
| Rendez-vous vétérinaires + vaccins (v1) | Push notifications natives mobile |
| Exports PDF/CSV (v1) | Marketplace / boutique |
| Backoffice admin plateforme | |

---

## 2. Utilisateurs & Rôles

### 2.1 Personas

Floupet cible principalement des propriétaires d'animaux vivant en foyer partagé (famille, colocation), soucieux du bien-être de leur animal et de la coordination avec les autres membres du foyer.

### 2.2 Rôles au niveau du foyer

| Rôle | Niveau d'accès | Permissions |
|---|---|---|
| **Owner** | Maximum | Crée le foyer, invite des membres, modifie les rôles, supprime le foyer, accès à tout |
| **Admin** | Élevé | Gère les animaux, la santé, les produits du foyer, peut inviter des membres |
| **Member** | Standard | Saisit les repas, les pesées, les événements santé. Peut corriger ses propres entrées |
| **Viewer** | Lecture seule | Consulte toutes les données du foyer sans pouvoir en modifier |

### 2.3 Rôle plateforme

| Rôle | Description |
|---|---|
| **Platform Admin** | Accès au backoffice global : CRUD produits, validation propositions, gestion utilisateurs et foyers, logs et statistiques |

---

## 3. Entités & Modèle de données

### 3.1 Vue d'ensemble des entités

| Entité | Description |
|---|---|
| `User` | Compte utilisateur de la plateforme |
| `Household` | Foyer regroupant plusieurs utilisateurs et leurs animaux |
| `Membership` | Lien entre un utilisateur et un foyer, avec rôle associé |
| `Pet` | Animal appartenant à un foyer (chat, chien, etc.) |
| `Product` | Produit alimentaire global (validé ou non) |
| `ProductProposal` | Proposition de produit soumise par un membre, en attente de validation |
| `FeedLog` | Entrée du journal alimentaire pour un animal |
| `WeightLog` | Mesure de poids d'un animal à une date donnée |
| `VetAppointment` | Rendez-vous vétérinaire planifié ou passé |
| `VaccinationRecord` | Vaccin administré avec date de rappel |
| `Medication` | Traitement en cours pour un animal |
| `MedicationEvent` | Prise individuelle liée à un traitement (prise / sautée / en attente) |
| `Reminder` | Rappel associé à un événement (RDV, vaccin, médicament, pesée) |

### 3.2 Détail des entités clés

#### Pet (Animal)

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | Identifiant unique |
| `household_id` | UUID FK | Foyer propriétaire |
| `name` | string | Prénom de l'animal |
| `species` | enum | `chat`, `chien`, `lapin`, `autre` |
| `breed` | string? | Race (optionnel) |
| `birth_date` | date? | Date de naissance approximative |
| `sex` | enum | `male`, `female`, `unknown` |
| `neutered` | boolean | Stérilisé/castré |
| `target_weight_kg` | decimal? | Poids cible (optionnel) |
| `photo_url` | string? | URL de la photo de profil |
| `notes` | text? | Notes libres |
| `archived_at` | timestamp? | Suppression logique |

#### Product (Produit alimentaire)

| Champ | Type | Description |
|---|---|---|
| `id` | UUID | Identifiant unique |
| `barcode` | string? | EAN-13 ou autre code-barres |
| `name` | string | Nom du produit |
| `brand` | string? | Marque |
| `product_type` | enum | `croquettes`, `pâtée`, `sachet`, `friandise`, `autre` |
| `net_weight_g` | decimal? | Poids net du contenant |
| `grams_per_unit` | decimal? | Grammes par unité (sachet/boîte) |
| `kcal_per_100g` | decimal? | Valeur calorique (optionnel) |
| `photo_url` | string? | Photo du produit |
| `verified` | boolean | Validé par un admin |
| `created_by` | UUID FK? | Utilisateur créateur (si proposé) |
| `deleted_at` | timestamp? | Suppression logique |

---

## 4. Parcours utilisateur & User Stories

### 4.1 Authentification & Onboarding

> **Objectif :** Permettre à un utilisateur de créer son compte, rejoindre ou créer un foyer, et inviter d'autres membres.

- En tant qu'utilisateur, je peux créer un compte avec mon email (magic link) ou via OAuth (Google)
- En tant qu'utilisateur, je peux créer un nouveau foyer et en devenir automatiquement Owner
- En tant qu'Owner, je peux inviter un membre par email — l'invité reçoit un lien d'invitation
- En tant qu'invité, je peux accepter l'invitation et rejoindre le foyer avec le rôle assigné
- En tant qu'Owner, je peux modifier le rôle d'un membre (Admin / Member / Viewer)
- En tant qu'Owner, je peux retirer un membre du foyer
- En tant qu'utilisateur, je peux faire partie de plusieurs foyers et basculer entre eux

### 4.2 Gestion des animaux

> **Objectif :** Créer et maintenir les fiches de chaque animal du foyer.

- En tant qu'Admin/Owner, je peux créer un animal avec : nom, espèce, race, date de naissance approximative, sexe, statut stérilisé, notes
- En tant qu'Admin/Owner, je peux ajouter ou changer la photo de profil d'un animal
- En tant qu'Admin/Owner, je peux définir un poids cible pour surveiller l'évolution
- En tant que Member, je peux consulter la fiche complète d'un animal
- En tant qu'Admin/Owner, je peux archiver un animal (suppression logique sans perte d'historique)

### 4.3 Journal alimentaire

> **Objectif :** Enregistrer chaque repas avec précision pour suivre les apports quotidiens par animal.

- En tant que Member, je peux enregistrer un repas pour un animal avec :
  - date/heure (défaut = maintenant)
  - produit sélectionné depuis le catalogue (optionnel)
  - quantité en grammes **OU** en unités (sachet/boîte) si la conversion est disponible
  - notes libres
  - "donné par" = utilisateur courant (automatique)
- En tant que Member, je peux voir un récapitulatif journalier : total grammes, nombre de repas, heure du dernier repas
- En tant que Member, je peux filtrer le journal par animal et par plage de dates
- En tant que Member, je peux corriger ou supprimer mes propres entrées (Admin/Owner peut corriger toutes les entrées)

### 4.4 Scan & catalogue produits

> **Objectif :** Identifier rapidement un produit via son code-barres et alimenter la base de données communautaire.

- En tant que Member, je peux scanner un code-barres via la caméra de mon téléphone ou le saisir manuellement
- Si le produit **existe** dans la base : je le sélectionne et j'enregistre ma quantité directement
- Si le produit **n'existe pas** : je crée une fiche rapide (nom, marque, type, poids, photo optionnelle) — cela génère une `ProductProposal` en attente de validation
- Je peux utiliser immédiatement un produit non vérifié dans mon journal (affiché avec badge *"non vérifié"*)
- En tant que Member, je peux parcourir le catalogue et rechercher un produit par nom ou marque

### 4.5 Suivi du poids

> **Objectif :** Surveiller l'évolution du poids de chaque animal avec des indicateurs de tendance.

- En tant que Member, je peux enregistrer le poids (kg) d'un animal avec la date de la pesée
- Je peux ajouter une note (type de balance, conditions particulières)
- En tant que Member, je peux consulter la liste des pesées et un graphe d'évolution
- Le graphe affiche : la courbe de poids, la moyenne sur 7 jours, le delta sur 30 jours, et le poids cible si défini
- En tant qu'Admin/Owner, je peux supprimer une pesée erronée

### 4.6 Rendez-vous vétérinaires *(v1)*

> **Objectif :** Planifier et historiser les consultations vétérinaires.

- En tant que Member, je peux créer un rendez-vous : date/heure, clinique, motif, notes
- Je reçois un rappel configurable avant le RDV (ex. 24h avant, 1 heure avant)
- En tant que Member, je peux marquer un RDV comme "effectué" et y ajouter un compte-rendu
- En tant que Member, je peux consulter l'historique de tous les RDV d'un animal

### 4.7 Carnet de vaccination *(v1)*

> **Objectif :** Centraliser les vaccins et ne plus rater les rappels.

- En tant que Member, je peux enregistrer un vaccin : nom, date d'administration, date du prochain rappel, nom du vétérinaire
- Je peux joindre un document ou une photo (ex. carnet papier scanné)
- Je reçois un rappel configurable avant l'échéance (ex. 30 jours avant, 7 jours avant)
- En tant que Member, je consulte le carnet de vaccination complet de chaque animal

### 4.8 Médicaments & traitements

> **Objectif :** Suivre les traitements en cours et ne jamais oublier une prise.

- En tant que Member, je peux créer un traitement : nom du médicament, posologie (texte libre), période (date début / date fin), fréquence (ex. 2x/jour), instructions
- L'app génère automatiquement les prises programmées selon la fréquence définie
- En tant que Member, je peux marquer chaque prise comme : `donnée`, `sautée` (avec raison optionnelle), `en attente`
- Je reçois un rappel à l'heure programmée, avec une relance configurable si la prise n'est pas confirmée sous 30 min
- En tant que Member, je consulte l'historique de compliance pour chaque traitement

### 4.9 Notifications & rappels

**Canaux disponibles en MVP :**
- Email (transactionnel via SMTP)
- In-app (centre de notifications dans l'interface)

**Canaux prévus en v2 :**
- Push notifications PWA / mobile natif

**L'utilisateur peut configurer individuellement :**
- Activation/désactivation par type de rappel (médicaments, vaccins, RDV, pesée)
- Délais de rappel (ex. 30 min avant, 1h avant, 24h avant)
- Fuseau horaire (détecté automatiquement, modifiable)

### 4.10 Exports *(v1)*

> **Objectif :** Permettre l'export des données de santé pour consultation hors-ligne ou partage avec le vétérinaire.

En tant que Member, je peux exporter les données suivantes en **PDF** ou **CSV** :
- Évolution du poids sur une période
- Journal alimentaire sur une période
- Carnet de vaccination complet
- Historique de prises médicamenteuses
- Liste des rendez-vous vétérinaires

---

## 5. Écrans & Navigation

### 5.1 Structure de navigation

| # | Écran | Description |
|---|---|---|
| 1 | **Auth** | Login / Signup — magic link ou OAuth Google |
| 2 | **Sélecteur de foyer** | Liste des foyers de l'utilisateur + bouton créer un foyer |
| 3 | **Dashboard foyer** | Vue "aujourd'hui" : dernier repas par animal, rappels à venir, actions rapides |
| 4 | **Liste animaux** | Vignettes des animaux du foyer + accès rapide à leur fiche |
| 5 | **Fiche animal** | Données complètes : profil, alimentation du jour, courbe de poids, santé |
| 6 | **Journal alimentation** | Historique des repas + formulaire d'ajout rapide |
| 7 | **Scan produit** | Caméra + résultat lookup + formulaire création si inconnu |
| 8 | **Santé** | Onglets : Poids \| RDV \| Vaccins \| Médicaments |
| 9 | **Paramètres foyer** | Gestion des membres, rôles, invitations, préférences notifs |
| 10 | **Backoffice admin** | Accessible uniquement aux Platform Admin |

### 5.2 Dashboard (écran 3)

L'écran d'accueil doit permettre une prise d'information immédiate et des actions rapides. Il contient :

- Un bandeau de rappels urgents (médicaments en retard, RDV dans les 24h)
- Une carte par animal avec : photo, dernier repas (il y a X heures), total grammes du jour
- Des boutons d'action rapide : `+ Repas`, `+ Poids`
- Un fil d'activité récent du foyer (qui a fait quoi)

### 5.3 Écran santé (écran 8)

L'écran santé est structuré en 4 onglets :

- **Poids** : liste chronologique des pesées + graphe interactif
- **RDV Véto** : liste des prochains RDV + historique
- **Vaccins** : carnet avec statut (à jour / bientôt dû / en retard)
- **Médicaments** : traitements actifs avec compteur de prises du jour

---

## 6. Backoffice Admin

### 6.1 Gestion du catalogue produits

- Liste paginée et filtrée des produits (par statut : tous / vérifiés / non vérifiés)
- CRUD complet : création, édition, suppression logique
- Champs éditables : code-barres, nom, marque, type, g/unité, kcal/100g, photo, statut vérifié
- Historique des modifications : qui a modifié quoi et quand (audit trail minimal)

### 6.2 Validation des propositions

- File d'attente des `ProductProposals` soumises par les membres
- Vue de comparaison : proposition vs produit existant (si code-barres déjà connu)
- Actions disponibles :
  - **Approuver** : crée ou met à jour le produit, passe `verified = true`
  - **Rejeter** : archive la proposition avec motif optionnel
  - **Demander info** : notifie le créateur avec une question

### 6.3 Gestion des utilisateurs & foyers

- Liste de tous les foyers : nom, nombre de membres, nombre d'animaux, date de création
- Liste de tous les utilisateurs : email, foyers, rôle plateforme, statut
- Actions : désactiver un compte (soft ban), voir les foyers d'un utilisateur
- Statistiques d'activité : nombre d'entrées par jour, produits soumis, foyers actifs
- Vue des logs d'erreurs (si infrastructure le permet)

---

## 7. Règles métier

### 7.1 Isolation des données

- Un utilisateur ne peut accéder qu'aux données des foyers dont il est membre
- Les données des animaux, repas, santé sont strictement isolées par foyer
- Le catalogue produits est **global** (partagé entre tous les foyers)
- Un Platform Admin voit l'ensemble des données de la plateforme

### 7.2 Matrice de permissions

| Action | Owner | Admin | Member | Viewer | PlatAdmin |
|---|:---:|:---:|:---:|:---:|:---:|
| Créer/modifier un animal | ✅ | ✅ | ❌ | ❌ | ✅ |
| Enregistrer un repas | ✅ | ✅ | ✅ | ❌ | ✅ |
| Corriger un repas (le sien) | ✅ | ✅ | ✅ | ❌ | ✅ |
| Corriger un repas (autre membre) | ✅ | ✅ | ❌ | ❌ | ✅ |
| Gérer les membres du foyer | ✅ | ❌ | ❌ | ❌ | ✅ |
| Proposer un produit | ✅ | ✅ | ✅ | ❌ | ✅ |
| Valider un produit | ❌ | ❌ | ❌ | ❌ | ✅ |
| Exporter les données | ✅ | ✅ | ✅ | ✅ | ✅ |
| Supprimer un foyer | ✅ | ❌ | ❌ | ❌ | ✅ |

### 7.3 Conversions d'unités

- Si un produit a un `grams_per_unit` défini, l'utilisateur peut saisir en "unités" (sachets, boîtes)
- La conversion est automatique et stockée en grammes en base
- L'affichage dans le journal montre l'unité saisie + la conversion en grammes

### 7.4 Produits non vérifiés

- Un produit proposé par un membre est immédiatement utilisable dans les journaux
- Il est affiché avec un badge *"non vérifié"* visible par tous les membres du foyer
- Si un admin rejette la proposition, les entrées existantes liées au produit restent valides
- Si deux propositions concernent le même code-barres, le backoffice propose une fusion

---

## 8. Exigences non fonctionnelles

### 8.1 Performance

- Temps de chargement des pages principales < **2 secondes** (réseau 4G standard)
- Le scan de code-barres doit retourner un résultat en < **1 seconde** (lookup base de données)
- Les graphes de poids doivent se générer côté client sans latence perceptible

### 8.2 Sécurité & conformité

- Row Level Security (RLS) via Supabase — aucune donnée inter-foyers accessible
- Authentification via magic link + OAuth — pas de stockage de mot de passe en clair
- Journalisation de toutes les actions admin (audit trail)
- HTTPS obligatoire en production
- Préparation RGPD : suppression de compte + export personnel prévu en phase 2

### 8.3 Disponibilité & infrastructure

- Hébergement sur Supabase (PostgreSQL avec backup automatique)
- Application déployée en mode PWA — installable sur iOS et Android via navigateur
- Sauvegardes automatiques quotidiennes via Supabase
- Monitoring d'erreurs : Sentry ou équivalent

### 8.4 Accessibilité & UX

- Application mobile-first, responsive pour desktop
- Interface en français (langue principale), architecture i18n prête pour extension
- Thème clair par défaut, thème sombre prévu en v1
- Contrastes conformes WCAG AA

---

## 9. Plan de livraison

### MVP — Phase 1

> Livrer un produit utilisable couvrant le flux principal : foyer, animaux, alimentation, poids et médicaments.

1. Authentification + création de foyer + invitations
2. Gestion des animaux (CRUD + photo)
3. Journal alimentaire (ajout repas + totaux du jour)
4. Catalogue produits + scan code-barres + propositions
5. Suivi du poids (saisie + graphe)
6. Médicaments (traitement + prises + rappels email)
7. Backoffice : gestion produits + validation propositions

### v1 — Phase 2

> Compléter le dossier santé et améliorer l'expérience utilisateur.

1. Rendez-vous vétérinaires (CRUD + rappels)
2. Carnet de vaccination (CRUD + rappels + documents)
3. Exports PDF et CSV
4. Notifications in-app (centre de notifications)
5. Dashboard insights (tendance poids, régularité repas)
6. Thème sombre

### Phase 3 — Backlog

- Push notifications PWA / mobile natif
- RGPD : suppression de compte + export données personnelles
- Partage du carnet de santé avec le vétérinaire
- Abonnement / monétisation
- Support multilingue

---

## 10. Stack technique recommandée

| Couche | Technologie | Justification |
|---|---|---|
| Frontend | Next.js (React) | SSR/SSG, PWA, excellent écosystème |
| UI | Tailwind CSS + shadcn/ui | Développement rapide, cohérence visuelle |
| Backend / BDD | Supabase (PostgreSQL) | Auth, RLS, storage, realtime, backup inclus |
| Auth | Supabase Auth | Magic link + OAuth Google natif |
| Stockage fichiers | Supabase Storage | Photos animaux et produits |
| Emails transactionnels | Resend ou Postmark | Rappels, invitations, magic links |
| Scan code-barres | html5-qrcode ou ZXing | Scan caméra côté client |
| Graphes | Recharts ou Chart.js | Courbes de poids légères et responsives |
| Déploiement | Vercel | Intégration Next.js native, déploiement CI/CD |
| Monitoring | Sentry | Tracking d'erreurs frontend et backend |

---

*Floupet — Spécifications Fonctionnelles v1.0 — Confidentiel*
*Février 2026*

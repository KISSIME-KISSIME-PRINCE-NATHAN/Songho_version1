/* ═══════════════════════════════════════════════════════════
   SONGHO — Logique de jeu
   ═══════════════════════════════════════════════════════════

   Modèle du plateau (14 cases) :
     NORD : indices 0..6  (case logique 1..7, affichées gauche→droite)
     SUD  : indices 7..13 (case logique 1..7, affichées droite→gauche visuellement)

   Sens de semaille :
     NORD : son camp 6→5→4→3→2→1→0, puis camp SUD 7→8→9→10→11→12→13
     SUD  : son camp 13→12→11→10→9→8→7, puis camp NORD 6→5→4→3→2→1→0
   ═══════════════════════════════════════════════════════════ */

'use strict';

// ════════════════════════════════════════════════
//  CONSTANTES
// ════════════════════════════════════════════════
const N              = 7;   // cases par rangée
const TOTAL_SEEDS    = 70;
const SEEDS_PER_HOLE = 5;
const WIN_THRESHOLD  = 40;
const END_THRESHOLD  = 10;

// ════════════════════════════════════════════════
//  ÉTAT DU JEU
// ════════════════════════════════════════════════
let board         = [];          // board[0..13]
let scores        = { nord: 0, sud: 0 };
let currentPlayer = 'sud';       // 'nord' | 'sud'
let selectedCell  = null;        // index de la case sélectionnée
let gameOver      = false;
let playerNames   = { nord: 'JOUEUR 1', sud: 'JOUEUR 2' };

// ════════════════════════════════════════════════
//  INITIALISATION
// ════════════════════════════════════════════════

/**
 * Remet le plateau à l'état initial.
 */
function initBoard() {
  board         = Array(N * 2).fill(SEEDS_PER_HOLE);
  scores        = { nord: 0, sud: 0 };
  currentPlayer = 'sud';
  selectedCell  = null;
  gameOver      = false;
}

// ════════════════════════════════════════════════
//  RENDU DOM
// ════════════════════════════════════════════════

/**
 * Point d'entrée du rendu : met à jour tout le DOM.
 */
function render() {
  renderRow('row-nord', 'col-idx-nord', 0,  'nord');
  renderRow('row-sud',  'col-idx-sud',  7,  'sud');
  renderScores();
  renderTerritoryLabels();
}

/**
 * Rend une rangée de cases + ses indices de colonnes.
 * @param {string} rowId      - id de la div rangée
 * @param {string} idxId      - id de la div des indices
 * @param {number} startIdx   - premier index dans `board`
 * @param {'nord'|'sud'} player
 */
function renderRow(rowId, idxId, startIdx, player) {
  const rowEl = document.getElementById(rowId);
  const idxEl = document.getElementById(idxId);
  rowEl.innerHTML = '';
  idxEl.innerHTML = '';

  // NORD : visuellement gauche(0) → droite(6)
  // SUD  : visuellement droite(13) → gauche(7)  (joueurs face à face)
  const boardIndices = player === 'nord'
    ? [0, 1, 2, 3, 4, 5, 6].map(i => startIdx + i)
    : [6, 5, 4, 3, 2, 1, 0].map(i => startIdx + i);

  boardIndices.forEach(bi => {
    const caseNum = (bi - startIdx) + 1;   // numéro logique 1..7
    const count   = board[bi];

    // --- Cellule ---
    const cell = document.createElement('div');
    cell.className  = 'cell';
    cell.dataset.idx = bi;

    // Classes d'état
    if (count === 0)                            cell.classList.add('cell--empty');
    if (player !== currentPlayer || gameOver)   cell.classList.add('cell--enemy');
    if (player === currentPlayer && !gameOver && count > 0) {
      cell.classList.add('cell--playable');
      cell.addEventListener('click', () => onCellClick(bi));
    }
    if (player === currentPlayer && count === 0) cell.classList.add('cell--disabled');
    if (selectedCell === bi)                    cell.classList.add('cell--selected');

    // --- Numéro de case ---
    const indexEl = document.createElement('span');
    indexEl.className   = 'cell-index';
    indexEl.textContent = caseNum;
    cell.appendChild(indexEl);

    // --- Compteur ---
    const countEl = document.createElement('span');
    countEl.className   = 'cell-count';
    countEl.textContent = count;
    cell.appendChild(countEl);

    // --- Points visuels (max 7 affichés) ---
    if (count > 0) {
      const seedsEl = document.createElement('div');
      seedsEl.className = 'cell-seeds';
      const shown = Math.min(count, 7);
      for (let i = 0; i < shown; i++) {
        const dot = document.createElement('span');
        dot.className = 'seed-dot' + (i >= 5 ? ' seed-dot--extra' : '');
        seedsEl.appendChild(dot);
      }
      cell.appendChild(seedsEl);
    }

    rowEl.appendChild(cell);

    // --- Indice de colonne ---
    const idxItem = document.createElement('span');
    idxItem.className   = 'col-idx-item';
    idxItem.textContent = caseNum;
    idxEl.appendChild(idxItem);
  });
}

/**
 * Met à jour les scores et l'indicateur de joueur actif.
 */
function renderScores() {
  document.getElementById('score-nord').textContent = scores.nord;
  document.getElementById('score-sud').textContent  = scores.sud;
  document.getElementById('name-nord').textContent  = playerNames.nord;
  document.getElementById('name-sud').textContent   = playerNames.sud;

  document.getElementById('card-nord').classList.toggle('active', currentPlayer === 'nord');
  document.getElementById('card-sud').classList.toggle('active',  currentPlayer === 'sud');
}

/**
 * Met à jour les étiquettes de territoire avec les noms des joueurs.
 */
function renderTerritoryLabels() {
  document.getElementById('tl-name-nord').textContent = playerNames.nord;
  document.getElementById('tl-name-sud').textContent  = playerNames.sud;
}

// ════════════════════════════════════════════════
//  NAVIGATION SUR LE PLATEAU
// ════════════════════════════════════════════════

/**
 * Retourne l'index de la case suivante dans le sens de semaille.
 * Sens NORD : 6→5→4→3→2→1→0 → 7→8→9→10→11→12→13 → 6→…
 * Sens SUD  : 13→12→…→7 → 6→5→…→0 → 13→…
 * @param {number} pos
 * @param {'nord'|'sud'} player
 * @returns {number}
 */
function nextPos(pos, player) {
  if (player === 'nord') {
    if (pos > 0 && pos <= 6)  return pos - 1;   // camp NORD, vers gauche
    if (pos === 0)             return 7;          // passage vers camp SUD
    if (pos >= 7 && pos < 13) return pos + 1;   // camp SUD, vers droite
    /* pos === 13 */           return 6;          // retour camp NORD, droite
  } else {
    if (pos > 7 && pos <= 13) return pos - 1;   // camp SUD, vers gauche (→ case 1)
    if (pos === 7)             return 0;          // passage vers camp NORD
    if (pos >= 0 && pos < 6)  return pos + 1;   // camp NORD, vers droite
    /* pos === 6 */            return 13;         // retour camp SUD, droite
  }
}

/**
 * Retourne la case "précédente" dans le camp adverse pour la chaîne de captures.
 * "Vers la droite dans le camp adverse" signifie :
 *   - Pour NORD ayant capturé dans SUD (7..13) : vers l'index décroissant (case 1 de SUD)
 *   - Pour SUD ayant capturé dans NORD (0..6)  : vers l'index croissant   (case 7 de NORD)
 * @param {number} pos
 * @param {'nord'|'sud'} player
 * @returns {number}
 */
function prevEnemyChain(pos, player) {
  return player === 'nord' ? pos - 1 : pos + 1;
}

/**
 * Simule la semaille et retourne des infos sur l'atterrissage.
 * @param {number} fromIdx
 * @param {number} seeds
 * @param {'nord'|'sud'} player
 * @returns {{ lastPos: number, grainsSownInEnemy: number }}
 */
function simulateSow(fromIdx, seeds, player) {
  const enemyStart = player === 'nord' ? 7 : 0;
  const enemyEnd   = enemyStart + N - 1;

  let pos        = fromIdx;
  let skipFirst  = seeds > 13;
  let remaining  = seeds;
  let inEnemy    = 0;

  while (remaining > 0) {
    pos = nextPos(pos, player);
    if (skipFirst && pos === fromIdx) { skipFirst = false; continue; }
    if (pos >= enemyStart && pos <= enemyEnd) inEnemy++;
    remaining--;
  }
  return { lastPos: pos, grainsSownInEnemy: inEnemy };
}

// ════════════════════════════════════════════════
//  LOGIQUE DE JEU
// ════════════════════════════════════════════════

/**
 * Gère le clic sur une case.
 * @param {number} idx
 */
function onCellClick(idx) {
  if (gameOver) return;

  const player    = currentPlayer;
  const ownStart  = player === 'nord' ? 0 : 7;
  const ownEnd    = ownStart + N - 1;

  // Vérification que la case appartient au joueur
  if (idx < ownStart || idx > ownEnd) return;
  if (board[idx] === 0) {
    showMessage('Cette case est vide !', 'error');
    return;
  }

  // Vérification interdit case 7 (index relatif 6 = ownStart+6)
  if (idx === ownStart + N - 1) {
    const sim = simulateSow(idx, board[idx], player);
    if (sim.grainsSownInEnemy === 1 || sim.grainsSownInEnemy === 2) {
      // Interdit sauf si le camp adverse est vide (solidarité)
      const enemyStart = player === 'nord' ? 7 : 0;
      const enemyTotal = board.slice(enemyStart, enemyStart + N).reduce((a, b) => a + b, 0);
      if (enemyTotal > 0) {
        showMessage('⛔ Interdit : la case 7 ne peut pas semer 1 ou 2 graines chez l\'adversaire !', 'error');
        return;
      }
    }
  }

  // Sélection visuelle puis exécution
  selectedCell = idx;
  render();
  setTimeout(() => executeMove(idx), 160);
}

/**
 * Exécute le coup complet : semaille + captures + changement de joueur.
 * @param {number} fromIdx
 */
function executeMove(fromIdx) {
  const player    = currentPlayer;
  const seeds     = board[fromIdx];
  board[fromIdx]  = 0;

  // ── Semaille ────────────────────────────────
  let pos       = fromIdx;
  let skipFirst = seeds > 13;
  let remaining = seeds;

  while (remaining > 0) {
    pos = nextPos(pos, player);
    if (skipFirst && pos === fromIdx) { skipFirst = false; continue; }
    board[pos]++;
    remaining--;
  }

  const lastPos    = pos;
  const enemyStart = player === 'nord' ? 7 : 0;
  const enemyEnd   = enemyStart + N - 1;
  const case1Enemy = enemyStart;   // case 1 adverse = index le plus bas de l'adversaire

  // ── Captures ────────────────────────────────
  let captured = 0;

  const isInEnemyCamp = lastPos >= enemyStart && lastPos <= enemyEnd;
  const isCase1       = lastPos === case1Enemy;

  // La capture est possible si on atterrit dans le camp adverse
  // sauf en case 1 adverse (à moins d'avoir fait ≥1 tour complet)
  if (isInEnemyCamp && (!isCase1 || seeds >= 14)) {
    if (!wouldEmptyEnemy(lastPos, player)) {
      let p = lastPos;
      while (
        p >= enemyStart &&
        p <= enemyEnd   &&
        board[p] >= 2   &&
        board[p] <= 4
      ) {
        captured += board[p];
        board[p]  = 0;
        p         = prevEnemyChain(p, player);
      }
    }
  }

  scores[player] += captured;

  // ── Message de résultat ─────────────────────
  const pName = playerNames[player];
  if (captured > 0) {
    showMessage(
      `🌾 <strong>${pName}</strong> capture <strong>${captured} graine${captured > 1 ? 's' : ''}</strong> !`,
      'capture'
    );
  } else {
    showMessage(`Coup joué par <strong>${pName}</strong>.`);
  }

  selectedCell = null;

  // ── Fin de partie ? ─────────────────────────
  if (checkEndGame()) return;

  // ── Changer de joueur ────────────────────────
  switchPlayer();
  render();
}

/**
 * Vérifie si capturer depuis `startPos` viderait entièrement le camp adverse.
 * @param {number} startPos
 * @param {'nord'|'sud'} player
 * @returns {boolean}
 */
function wouldEmptyEnemy(startPos, player) {
  const enemyStart = player === 'nord' ? 7 : 0;
  const enemyEnd   = enemyStart + N - 1;

  const totalEnemy = board.slice(enemyStart, enemyEnd + 1).reduce((a, b) => a + b, 0);

  let toRemove = 0;
  let p        = startPos;
  while (p >= enemyStart && p <= enemyEnd && board[p] >= 2 && board[p] <= 4) {
    toRemove += board[p];
    p         = prevEnemyChain(p, player);
  }
  return toRemove >= totalEnemy;
}

/**
 * Change de joueur et gère la règle de solidarité.
 */
function switchPlayer() {
  currentPlayer = currentPlayer === 'nord' ? 'sud' : 'nord';

  const enemyStart = currentPlayer === 'nord' ? 7 : 0;  // camp de l'ancien joueur
  const ownStart   = currentPlayer === 'nord' ? 0 : 7;
  const enemyTotal = board.slice(enemyStart, enemyStart + N).reduce((a, b) => a + b, 0);

  if (enemyTotal === 0) {
    // Camp adverse vide → solidarité
    if (!canFeedEnemy()) {
      // Impossible : collecter les graines restantes et terminer
      for (let i = ownStart; i < ownStart + N; i++) {
        scores[currentPlayer] += board[i];
        board[i] = 0;
      }
      render();
      checkEndGame(true);
      return;
    }
    showMessage(
      `🤝 Solidarité ! <strong>${playerNames[currentPlayer]}</strong> doit envoyer des graines chez l\'adversaire.`,
      'error'
    );
  } else {
    const side = currentPlayer.toUpperCase();
    showMessage(`Au tour de <strong>${playerNames[currentPlayer]} (${side})</strong> — choisissez une case`);
  }
}

/**
 * Vérifie si le joueur courant peut envoyer ≥7 graines chez l'adversaire (solidarité).
 * @returns {boolean}
 */
function canFeedEnemy() {
  const ownStart = currentPlayer === 'nord' ? 0 : 7;
  for (let i = ownStart; i < ownStart + N; i++) {
    if (board[i] === 0) continue;
    const sim = simulateSow(i, board[i], currentPlayer);
    if (sim.grainsSownInEnemy >= 7) return true;
  }
  return false;
}

/**
 * Vérifie les conditions de fin de partie.
 * @param {boolean} [forced=false] - fin forcée par impossibilité de solidarité
 * @returns {boolean} true si la partie est terminée
 */
function checkEndGame(forced = false) {
  const totalOnBoard = board.reduce((a, b) => a + b, 0);

  if (scores.nord >= WIN_THRESHOLD || scores.sud >= WIN_THRESHOLD || totalOnBoard < END_THRESHOLD || forced) {
    gameOver = true;
    render();

    const nName  = playerNames.nord;
    const sName  = playerNames.sud;
    const nScore = scores.nord;
    const sScore = scores.sud;

    let title, body;

    if (nScore > sScore) {
      title = `🏆 ${nName} gagne !`;
      body  = `${nName} : ${nScore} graines — ${sName} : ${sScore} graines.`;
    } else if (sScore > nScore) {
      title = `🏆 ${sName} gagne !`;
      body  = `${sName} : ${sScore} graines — ${nName} : ${nScore} graines.`;
    } else {
      title = '🤝 Partie nulle !';
      body  = `Chaque joueur a capturé ${nScore} graines.`;
    }

    showMessage(`${title} ${body}`, 'win');
    setTimeout(() => openEndModal(title, body), 700);
    return true;
  }
  return false;
}

// ════════════════════════════════════════════════
//  INTERFACE UTILISATEUR
// ════════════════════════════════════════════════

/**
 * Affiche un message dans la barre de statut.
 * @param {string} html
 * @param {string} [type=''] - '', 'error', 'capture', 'win'
 */
function showMessage(html, type = '') {
  const bar = document.getElementById('message-bar');
  bar.innerHTML   = html;
  bar.className   = 'message-bar' + (type ? ` ${type}` : '');
}

/**
 * Bascule l'affichage du panneau des règles.
 */
function toggleRules() {
  const panel = document.getElementById('rules-panel');
  panel.classList.toggle('rules-panel--visible');
}

/**
 * Réinitialise et relance une partie.
 */
function resetGame() {
  closeModal();
  initBoard();
  render();
  showMessage(`Au tour de <strong>${playerNames.sud} (SUD)</strong> — choisissez une case`);
}

// ── Modal générique ──────────────────────────────

/**
 * Ouvre la modal de fin de partie.
 */
function openEndModal(title, body) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').textContent  = body;

  const btn    = document.getElementById('modal-btn');
  btn.textContent = '🔄 Nouvelle partie';
  btn.onclick  = () => resetGame();

  document.getElementById('modal-overlay').classList.add('modal-overlay--visible');
}

/**
 * Ferme la modal.
 */
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('modal-overlay--visible');
}

// ── Modal noms des joueurs ───────────────────────

/**
 * Ouvre la modal de saisie des noms.
 */
function openNameModal() {
  const box = document.getElementById('modal-box');
  box.innerHTML = `
    <h2 class="modal-title">✏️ Noms des joueurs</h2>
    <div class="modal-form">
      <input
        class="modal-input"
        id="inp-nord"
        maxlength="20"
        placeholder="Joueur Nord"
        value="${playerNames.nord}"
      />
      <input
        class="modal-input modal-input--sud"
        id="inp-sud"
        maxlength="20"
        placeholder="Joueur Sud"
        value="${playerNames.sud}"
      />
    </div>
    <div class="modal-actions">
      <button class="btn btn--primary" onclick="saveNames()">Confirmer</button>
      <button class="btn btn--ghost"   onclick="cancelNameModal()">Annuler</button>
    </div>
  `;
  document.getElementById('modal-overlay').classList.add('modal-overlay--visible');
}

/**
 * Sauvegarde les noms saisis et ferme la modal.
 */
function saveNames() {
  const n = (document.getElementById('inp-nord').value.trim() || 'JOUEUR 1').toUpperCase();
  const s = (document.getElementById('inp-sud').value.trim()  || 'JOUEUR 2').toUpperCase();
  playerNames.nord = n;
  playerNames.sud  = s;
  restoreDefaultModal();
  closeModal();
  render();
  showMessage(`Au tour de <strong>${playerNames[currentPlayer]} (${currentPlayer.toUpperCase()})</strong> — choisissez une case`);
}

/**
 * Annule la saisie des noms et restaure la modal par défaut.
 */
function cancelNameModal() {
  restoreDefaultModal();
  closeModal();
}

/**
 * Restaure le contenu HTML par défaut de la modal.
 */
function restoreDefaultModal() {
  document.getElementById('modal-box').innerHTML = `
    <h2 class="modal-title" id="modal-title">Partie terminée</h2>
    <p  class="modal-body"  id="modal-body">…</p>
    <div class="modal-actions">
      <button class="btn btn--primary" id="modal-btn" onclick="closeModal()">Fermer</button>
    </div>
  `;
}

// ════════════════════════════════════════════════
//  DÉMARRAGE
// ════════════════════════════════════════════════
initBoard();
render();
showMessage(`Au tour de <strong>${playerNames.sud} (SUD)</strong> — choisissez une case`);

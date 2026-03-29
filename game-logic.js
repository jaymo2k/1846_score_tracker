// 1846 Board Game Score Tracker — Game Logic Module
// Pure functions, no side effects. Shared between server tests and browser client.

const COMPANIES = [
  'Pennsylvania Railroad', 'New York Central', 'Erie',
  'Baltimore & Ohio', 'Chesapeake & Ohio', 'Illinois Central',
  'Grand Trunk'
];

const SHARE_PRICE_CHART = [
  0, 10, 20, 30, 40, 50, 60, 67, 71, 76, 82, 90, 100,
  112, 124, 137, 150, 165, 180, 195, 212, 230, 250, 270,
  295, 320, 345, 375, 405, 440, 475, 510, 550
];

const IPO_PRICES = [40, 50, 60, 70, 80, 90, 100, 112, 124, 137, 150];

const PHASES = ['Stock Round', 'Operating Round 1', 'Operating Round 2'];

const MAX_SHARES_PER_COMPANY = 10;

/**
 * Validate inputs for session creation.
 * Returns an array of error messages, or null if valid.
 */
function validateSessionCreation(playerNames, bankPool, startingCash) {
  const errors = [];

  if (!Array.isArray(playerNames) || playerNames.length < 2) {
    errors.push('At least 2 players are required');
  }

  if (Array.isArray(playerNames)) {
    for (const name of playerNames) {
      if (typeof name !== 'string' || name.trim() === '') {
        errors.push('Player name cannot be empty');
      }
    }
  }

  if (typeof bankPool !== 'number' || bankPool <= 0) {
    errors.push('Bank pool must be a positive number');
  }

  if (startingCash !== undefined) {
    if (typeof startingCash !== 'number' || startingCash < 0) {
      errors.push('Starting cash must be a non-negative number');
    }
  }

  return errors.length > 0 ? errors : null;
}

/**
 * Create a new GameSession.
 * Returns the session object or throws if inputs are invalid.
 */
function createSession(playerNames, bankPool, startingCash) {
  const cash = startingCash !== undefined ? startingCash : 0;
  const validationErrors = validateSessionCreation(playerNames, bankPool, cash);
  if (validationErrors) {
    throw new Error(validationErrors.join('; '));
  }

  const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
  const now = new Date().toISOString();

  return {
    id,
    createdAt: now,
    updatedAt: now,
    bankPool,
    round: 1,
    phase: 'Stock Round',
    players: playerNames.map(name => ({ name: name.trim(), cash })),
    companies: [],
    shareholdings: {},
    marketShares: {}
  };
}

// --- Company Management ---

function getAvailableCompanies(session) {
  const incorporated = new Set(session.companies.map(c => c.name));
  return COMPANIES.filter(c => !incorporated.has(c));
}

function incorporateCompany(session, name, ipoPrice, chairman) {
  if (!COMPANIES.includes(name)) {
    throw new Error('Invalid company name');
  }
  if (session.companies.some(c => c.name === name)) {
    throw new Error('Company already incorporated');
  }
  if (!IPO_PRICES.includes(ipoPrice)) {
    throw new Error('Invalid share price — must be a value from the share price chart');
  }
  if (!session.players.some(p => p.name === chairman)) {
    throw new Error('Chairman must be an existing player');
  }
  const cost = 2 * ipoPrice;
  const player = session.players.find(p => p.name === chairman);
  if (player.cash < cost) {
    throw new Error('Chairman does not have enough cash to incorporate');
  }

  player.cash -= cost;
  session.companies.push({
    name,
    sharePrice: ipoPrice,
    chairman,
    treasury: cost,
    lastRevenuePerShare: null
  });
  session.shareholdings[`${chairman}:${name}`] = 2;
  session.updatedAt = new Date().toISOString();
  return session;
}

function updateSharePrice(session, companyName, newPrice) {
  if (!SHARE_PRICE_CHART.includes(newPrice)) {
    throw new Error('Invalid share price — must be a value from the share price chart');
  }
  const company = session.companies.find(c => c.name === companyName);
  if (!company) {
    throw new Error('Company not found');
  }
  company.sharePrice = newPrice;
  session.updatedAt = new Date().toISOString();
  return session;
}

function updateChairman(session, companyName, playerName) {
  const company = session.companies.find(c => c.name === companyName);
  if (!company) {
    throw new Error('Company not found');
  }
  if (!session.players.some(p => p.name === playerName)) {
    throw new Error('Player not found');
  }
  company.chairman = playerName;
  session.updatedAt = new Date().toISOString();
  return session;
}

function updateTreasury(session, companyName, amount) {
  const company = session.companies.find(c => c.name === companyName);
  if (!company) {
    throw new Error('Company not found');
  }
  company.treasury = amount;
  session.updatedAt = new Date().toISOString();
  return session;
}

// --- Shareholding Management ---

function updateShareholding(session, playerName, companyName, shares) {
  if (typeof shares !== 'number' || shares < 0) {
    throw new Error('Shares must be a non-negative number');
  }
  if (!session.players.some(p => p.name === playerName)) {
    throw new Error('Player not found');
  }
  if (!session.companies.some(c => c.name === companyName)) {
    throw new Error('Company not found');
  }
  const key = `${playerName}:${companyName}`;
  session.shareholdings[key] = shares;
  session.updatedAt = new Date().toISOString();
  return session;
}

function getShareholding(session, playerName, companyName) {
  const key = `${playerName}:${companyName}`;
  return session.shareholdings[key] || 0;
}

/**
 * Sell one share of a company. The player receives the current share price
 * from the bank pool and their shareholding decreases by 1.
 */
function sellShare(session, playerName, companyName) {
  const company = session.companies.find(c => c.name === companyName);
  if (!company) {
    throw new Error('Company not found');
  }
  const player = session.players.find(p => p.name === playerName);
  if (!player) {
    throw new Error('Player not found');
  }
  const key = `${playerName}:${companyName}`;
  const currentShares = session.shareholdings[key] || 0;
  if (currentShares <= 0) {
    throw new Error('Player has no shares to sell');
  }
  session.shareholdings[key] = currentShares - 1;
  if (!session.marketShares) session.marketShares = {};
  session.marketShares[companyName] = (session.marketShares[companyName] || 0) + 1;
  player.cash += company.sharePrice;
  session.bankPool -= company.sharePrice;
  session.updatedAt = new Date().toISOString();
  return session;
}

/**
 * Get total shares held by all players for a company.
 */
function getTotalPlayerShares(session, companyName) {
  let total = 0;
  for (const key of Object.keys(session.shareholdings)) {
    if (key.endsWith(`:${companyName}`)) {
      total += session.shareholdings[key];
    }
  }
  return total;
}

/**
 * Buy one share of a company. The player pays the current share price
 * from personal cash into the company treasury and gains 1 share.
 */
function buyShare(session, playerName, companyName) {
  const company = session.companies.find(c => c.name === companyName);
  if (!company) {
    throw new Error('Company not found');
  }
  const player = session.players.find(p => p.name === playerName);
  if (!player) {
    throw new Error('Player not found');
  }
  if (getTotalPlayerShares(session, companyName) >= MAX_SHARES_PER_COMPANY) {
    throw new Error('All shares have been issued — none left to buy');
  }
  if (player.cash < company.sharePrice) {
    throw new Error('Player does not have enough cash to buy a share');
  }
  const key = `${playerName}:${companyName}`;
  session.shareholdings[key] = (session.shareholdings[key] || 0) + 1;
  player.cash -= company.sharePrice;
  company.treasury += company.sharePrice;
  session.updatedAt = new Date().toISOString();
  return session;
}

// --- Revenue Distribution ---

function distributeRevenue(session, companyName, totalRevenue) {
  if (typeof totalRevenue !== 'number' || totalRevenue < 0) {
    throw new Error('Revenue must be a non-negative number');
  }
  const company = session.companies.find(c => c.name === companyName);
  if (!company) {
    throw new Error('Company not found');
  }

  const revenuePerShare = Math.floor(totalRevenue / MAX_SHARES_PER_COMPANY);

  // Player shares → player cash
  const playerShares = getTotalPlayerShares(session, companyName);
  for (const key of Object.keys(session.shareholdings)) {
    if (key.endsWith(`:${companyName}`)) {
      const playerName = key.split(':')[0];
      const shares = session.shareholdings[key];
      const player = session.players.find(p => p.name === playerName);
      if (player) {
        player.cash += shares * revenuePerShare;
      }
    }
  }

  // Market shares → bank pool (money stays in bank, so no deduction needed for these)
  const marketShares = (session.marketShares && session.marketShares[companyName]) || 0;

  // IPO/company shares → company treasury
  const ipoShares = MAX_SHARES_PER_COMPANY - playerShares - marketShares;
  company.treasury += ipoShares * revenuePerShare;

  // Bank pool pays out player shares and company shares; market shares stay in bank
  session.bankPool -= (playerShares + ipoShares) * revenuePerShare;

  company.lastRevenuePerShare = revenuePerShare;
  session.updatedAt = new Date().toISOString();
  return session;
}


// --- Game State Utilities ---

function isGameEnd(session) {
  return session.bankPool <= 0;
}

function calculateWealth(session, playerName) {
  const player = session.players.find(p => p.name === playerName);
  if (!player) {
    throw new Error('Player not found');
  }
  let wealth = player.cash;
  for (const company of session.companies) {
    const shares = getShareholding(session, playerName, company.name);
    wealth += shares * company.sharePrice;
  }
  return wealth;
}

function getStandings(session) {
  return session.players
    .map(p => ({ name: p.name, wealth: calculateWealth(session, p.name) }))
    .sort((a, b) => b.wealth - a.wealth);
}

function advancePhase(session) {
  const idx = PHASES.indexOf(session.phase);
  if (idx === -1) {
    throw new Error('Invalid current phase');
  }
  if (idx < PHASES.length - 1) {
    session.phase = PHASES[idx + 1];
  } else {
    session.phase = PHASES[0];
    session.round += 1;
  }
  session.updatedAt = new Date().toISOString();
  return session;
}

// --- Serialization ---

function serializeSession(session) {
  return JSON.stringify(session);
}

function deserializeSession(json) {
  return JSON.parse(json);
}

// Exports (CommonJS for Node.js, also works with <script> tag via global)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    COMPANIES, SHARE_PRICE_CHART, IPO_PRICES, PHASES, MAX_SHARES_PER_COMPANY,
    validateSessionCreation, createSession,
    getAvailableCompanies, incorporateCompany,
    updateSharePrice, updateChairman, updateTreasury,
    updateShareholding, getShareholding, getTotalPlayerShares, sellShare, buyShare,
    distributeRevenue,
    isGameEnd, calculateWealth, getStandings, advancePhase,
    serializeSession, deserializeSession
  };
}

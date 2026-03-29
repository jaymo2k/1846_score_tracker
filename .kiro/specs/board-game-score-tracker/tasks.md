# Implementation Plan: 1846 Board Game Score Tracker

## Overview

Build a minimal local-first web app for tracking 1846 board game state. The server is a thin Node.js file server (~100 lines). The client is a single HTML file with all game logic, validation, and UI. Property-based tests validate core game logic using fast-check.

## Tasks

- [x] 1. Create the Node.js server (`server.js`)
  - Implement HTTP server using only built-in modules (`http`, `fs`, `path`, `child_process`)
  - Serve `index.html` on `GET /`
  - Implement `GET /list` — return JSON array of session file names from `data/` directory
  - Implement `GET /load/:id` — read and return `data/{id}.json`
  - Implement `POST /save/:id` — write request body to `data/{id}.json`
  - Implement `DELETE /delete/:id` — remove `data/{id}.json`
  - Create `data/` directory on startup if it doesn't exist
  - Open default browser on startup using `child_process`
  - Handle graceful shutdown on SIGINT/SIGTERM
  - Support `PORT` env var (default 3000)
  - _Requirements: 1.1, 1.2, 1.3, 8.1, 8.2, 9.3, 10.1, 10.3_

- [-] 2. Create game logic module (`game-logic.js`)
  - [x] 2.1 Define game constants and core data structures
    - Define `COMPANIES`, `SHARE_PRICE_CHART`, `IPO_PRICES`, `PHASES` constants
    - Implement `createSession(playerNames, bankPool)` — returns a new GameSession object with players at zero cash, no companies, no shareholdings, round 1, Stock Round phase
    - Implement `validateSessionCreation(playerNames, bankPool)` — returns error messages or null
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2_

  - [x] 2.2 Write property tests for session creation (Properties 1, 2)
    - **Property 1: Session creation initializes all players to zero**
    - **Property 2: Session creation rejects invalid inputs**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

  - [x] 2.3 Implement company management functions
    - Implement `getAvailableCompanies(session)` — returns predefined list minus incorporated
    - Implement `incorporateCompany(session, name, ipoPrice, chairman, treasury)` — adds company to session
    - Implement `updateSharePrice(session, companyName, newPrice)` — validates against chart, updates price
    - Implement `updateChairman(session, companyName, playerName)` — updates chairman
    - Implement `updateTreasury(session, companyName, amount)` — updates treasury
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 2.4 Write property tests for company management (Properties 3, 4, 5, 6)
    - **Property 3: Available companies equals predefined list minus incorporated**
    - **Property 4: Company incorporation records correct values**
    - **Property 5: Share price validation rejects non-chart values**
    - **Property 6: Company field updates are applied correctly**
    - **Validates: Requirements 3.1, 3.3, 3.4, 3.5, 3.6, 3.8**

  - [x] 2.5 Implement shareholding management
    - Implement `updateShareholding(session, playerName, companyName, shares)` — validates non-negative, updates shareholding map
    - Implement `getShareholding(session, playerName, companyName)` — returns share count (0 if not set)
    - _Requirements: 4.1, 4.2_

  - [ ]* 2.6 Write property test for shareholdings (Property 7)
    - **Property 7: Shareholding updates are applied correctly**
    - **Validates: Requirements 4.1, 4.2**

  - [x] 2.7 Implement revenue distribution
    - Implement `distributeRevenue(session, companyName, totalRevenue)` — calculates revenue per share, distributes to players, deducts from bank pool, records lastRevenuePerShare
    - Validate non-negative revenue and non-zero total shares
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 2.8 Write property test for revenue distribution (Property 8)
    - **Property 8: Revenue distribution correctness**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

  - [x] 2.9 Implement game state utilities
    - Implement `isGameEnd(session)` — returns true if bankPool <= 0
    - Implement `calculateWealth(session, playerName)` — returns cash + sum(shares × price)
    - Implement `getStandings(session)` — returns players sorted by wealth descending
    - Implement `advancePhase(session)` — transitions phase per state machine
    - _Requirements: 6.3, 7.1, 7.2, 11.3_

  - [ ]* 2.10 Write property tests for game state utilities (Properties 9, 10, 12)
    - **Property 9: Game end detection**
    - **Property 10: Player standings calculation and ordering**
    - **Property 12: Phase transition state machine**
    - **Validates: Requirements 6.3, 7.1, 7.2, 11.3**

- [x] 3. Checkpoint — Ensure all game logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement serialization and persistence helpers
  - [x] 4.1 Implement session serialization/deserialization
    - Implement `serializeSession(session)` — converts to JSON string
    - Implement `deserializeSession(json)` — parses JSON back to session object
    - Ensure all fields are preserved: players, companies, shareholdings, share prices, revenue history, bankPool, round, phase
    - _Requirements: 8.3, 8.4_

  - [ ]* 4.2 Write property test for serialization round-trip (Property 11)
    - **Property 11: Session serialization round-trip**
    - **Validates: Requirements 8.4**

- [x] 5. Build the single-page HTML client (`index.html`)
  - [x] 5.1 Create the HTML structure and CSS styles
    - Build the Home View: list of saved sessions, "New Game" button
    - Build the New Game View: form for player names and initial bank amount
    - Build the Game View layout: round/phase indicator, bank pool display, player standings, company cards, shareholding matrix
    - Style with embedded CSS for a clean, readable game-night interface
    - _Requirements: 6.1, 6.2, 7.3, 10.2, 11.2_

  - [x] 5.2 Wire up client-side game logic and server communication
    - Import game logic functions (inline in the HTML or via a script tag loading `game-logic.js`)
    - Implement view switching (Home → New Game → Game View)
    - Wire "New Game" form to `createSession()` and `POST /save/:id`
    - Wire session list to `GET /list` and `GET /load/:id`
    - Wire delete button to `DELETE /delete/:id`
    - _Requirements: 2.5, 9.1, 9.2, 9.3_

  - [x] 5.3 Implement the Game View interactions
    - Wire company incorporation form: dropdown of available companies, IPO price selector, chairman selector, treasury input
    - Wire share price update: dropdown of chart values per company
    - Wire chairman change: dropdown of players per company
    - Wire treasury adjustment: input per company
    - Wire shareholding matrix: editable inputs for each player × company cell
    - Wire revenue distribution: revenue input per company with "Distribute" button
    - Wire phase advance button
    - Wire bank pool display with game-end indicator
    - Wire player standings table with auto-sort
    - Auto-save to server on every state change
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.7, 3.8, 4.1, 4.3, 5.1, 5.2, 5.3, 5.5, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 11.1, 11.2, 11.3_

- [ ] 6. Final checkpoint — Ensure everything works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The server is intentionally dumb — all game logic lives in `game-logic.js` which is shared with the client
- `game-logic.js` is a pure module with no side effects, making it easy to test with fast-check
- Property tests validate universal correctness properties; unit tests cover specific edge cases
- The single HTML file loads `game-logic.js` via a `<script>` tag served by the same server
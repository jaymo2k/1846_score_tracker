# Requirements Document

## Introduction

A lightweight, local-first web application for tracking game state during sessions of 1846: The Race for the Midwest. The application tracks players, incorporated companies, share prices, player shareholdings, company revenue distribution, and the bank pool. It runs as a single-page web app served by a minimal local Node.js server with JSON file persistence — no database, no cloud. Start it up for game night, shut it down when you're done.

## Glossary

- **Tracker**: The 1846 score tracking web application
- **Game_Session**: A single play-through of 1846, containing all player, company, and bank state
- **Player**: A named participant in a Game_Session who holds shares and accumulates personal cash
- **Company**: A corporation in 1846 that can be incorporated from the Predefined_Company_List, has a share price, a Chairman, a Treasury, and operates for revenue
- **Chairman**: The Player who holds the presidency of a Company; each incorporated Company has exactly one Chairman
- **Treasury**: The amount of money a Company currently has available to spend
- **Predefined_Company_List**: The fixed set of companies available in 1846 from which players may incorporate
- **Share_Price_Chart**: The predefined grid of valid share price values in 1846
- **IPO_Price_List**: The subset of Share_Price_Chart values at which a Company may be incorporated
- **Share_Price**: The current market price of one share of a Company
- **Shareholding**: The number of shares a Player owns in a specific Company
- **Revenue**: The total operating revenue a Company earns in a single operating round
- **Revenue_Per_Share**: The portion of Revenue distributed to each share of a Company (Revenue divided by total issued shares)
- **Bank_Pool**: The total amount of money remaining in the bank for the game
- **Server**: The lightweight local HTTP server that serves the Tracker and handles data persistence
- **Session_File**: A JSON file on disk that stores Game_Session data
- **Game_Round**: A full round of play consisting of one Stock_Round followed by two Operating_Rounds
- **Stock_Round**: The phase within a Game_Round where Players buy and sell shares
- **Operating_Round**: The phase within a Game_Round where Companies operate and generate Revenue


## Requirements

### Requirement 1: Start and Stop the Server

**User Story:** As a user, I want to start the app with a single command and stop it when I'm done, so that I only run it during game night.

#### Acceptance Criteria

1. WHEN the user runs the start command, THE Server SHALL start listening on a configurable local port and open the Tracker in the default browser
2. WHEN the Server starts successfully, THE Server SHALL display the local URL in the terminal
3. WHEN the user sends a termination signal, THE Server SHALL shut down gracefully and release the port

### Requirement 2: Create a Game Session

**User Story:** As a user, I want to create a new game session with player names and an initial bank amount, so that I can begin tracking a game of 1846.

#### Acceptance Criteria

1. WHEN a user submits a list of player names and an initial Bank_Pool amount, THE Tracker SHALL create a new Game_Session with all players initialized to zero personal cash and no shareholdings
2. WHEN a user attempts to create a Game_Session with fewer than two Player entries, THE Tracker SHALL reject the creation and display a validation message
3. WHEN a user attempts to add a Player with an empty or whitespace-only name, THE Tracker SHALL reject that Player entry and display a validation message
4. WHEN a user submits a non-positive Bank_Pool amount, THE Tracker SHALL reject the creation and display a validation message
5. WHEN a Game_Session is created, THE Server SHALL persist the Game_Session to a Session_File immediately

### Requirement 3: Manage Companies

**User Story:** As a user, I want to incorporate companies during the game and track their share prices and chairman, so that I can see the current state of the market.

#### Acceptance Criteria

1. WHEN a user incorporates a Company, THE Tracker SHALL present only companies from the Predefined_Company_List that have not already been incorporated in the current Game_Session
2. WHEN a user selects a Company to incorporate, THE Tracker SHALL present only values from the IPO_Price_List as valid initial Share_Price options
3. WHEN a user incorporates a Company with a selected name, IPO price, Chairman, and initial Treasury amount, THE Tracker SHALL add the Company to the Game_Session with the specified values
4. WHEN a user attempts to set a Share_Price to a value not on the Share_Price_Chart, THE Tracker SHALL reject the action and display a validation message
5. WHEN a user updates a Company's Share_Price, THE Tracker SHALL only allow values from the Share_Price_Chart
6. WHEN a user changes a Company's Chairman, THE Tracker SHALL update the Chairman to the specified Player
7. THE Tracker SHALL display the current Chairman, Treasury, and Share_Price for each incorporated Company
8. WHEN a user adjusts a Company's Treasury, THE Tracker SHALL update the Treasury amount for that Company
9. WHEN a Company's state changes, THE Server SHALL persist the updated Game_Session to the Session_File immediately


### Requirement 4: Manage Shareholdings

**User Story:** As a user, I want to track how many shares each player owns in each company, so that revenue can be distributed correctly.

#### Acceptance Criteria

1. WHEN a user assigns shares of a Company to a Player, THE Tracker SHALL update that Player's Shareholding for that Company
2. WHEN a user attempts to assign a negative number of shares, THE Tracker SHALL reject the action and display a validation message
3. THE Tracker SHALL display each Player's Shareholdings across all incorporated Companies
4. WHEN a Shareholding changes, THE Server SHALL persist the updated Game_Session to the Session_File immediately

### Requirement 5: Distribute Company Revenue

**User Story:** As a user, I want to record a company's operating revenue and have the app calculate and distribute earnings to shareholders, so that I don't have to do the math manually.

#### Acceptance Criteria

1. WHEN a user submits a Revenue amount for a Company, THE Tracker SHALL calculate the Revenue_Per_Share by dividing Revenue by the total number of issued shares for that Company
2. WHEN Revenue is distributed, THE Tracker SHALL add the appropriate earnings to each Player's personal cash based on their Shareholding multiplied by Revenue_Per_Share
3. WHEN Revenue is distributed, THE Tracker SHALL deduct the total distributed amount from the Bank_Pool
4. WHEN a user submits a negative Revenue amount, THE Tracker SHALL reject the action and display a validation message
5. WHEN Revenue distribution is complete, THE Tracker SHALL record the latest Revenue_Per_Share for that Company
6. WHEN Revenue distribution is complete, THE Server SHALL persist the updated Game_Session to the Session_File immediately

### Requirement 6: Track the Bank Pool

**User Story:** As a user, I want to see the current bank total at all times, so that I know how close the game is to ending.

#### Acceptance Criteria

1. THE Tracker SHALL display the current Bank_Pool amount prominently at all times
2. WHEN any transaction deducts from or adds to the Bank_Pool, THE Tracker SHALL update the displayed Bank_Pool amount without requiring a page refresh
3. WHEN the Bank_Pool reaches zero or below, THE Tracker SHALL display a visual indicator that the game end condition has been triggered


### Requirement 7: View Player Standings

**User Story:** As a user, I want to see each player's total wealth (cash plus share values) at a glance, so that everyone knows the standings.

#### Acceptance Criteria

1. THE Tracker SHALL calculate each Player's total wealth as personal cash plus the sum of (Shareholding multiplied by Share_Price) for each Company
2. THE Tracker SHALL display all Players sorted by total wealth in descending order
3. WHEN any score-affecting change occurs (cash, shareholding, or share price), THE Tracker SHALL recalculate and re-sort the Player standings without requiring a page refresh

### Requirement 8: Data Persistence

**User Story:** As a user, I want my game data to survive server restarts, so that I don't lose progress if I accidentally close the terminal.

#### Acceptance Criteria

1. THE Server SHALL store each Game_Session as a separate JSON-formatted Session_File in a local data directory
2. WHEN the Server starts, THE Server SHALL load all existing Session_Files from the data directory
3. WHEN a Game_Session is serialized to JSON, THE Server SHALL include all player data, company data, shareholdings, share prices, revenue history, and Bank_Pool state
4. FOR ALL valid Game_Session objects, serializing to JSON and then deserializing SHALL produce an equivalent Game_Session object (round-trip property)

### Requirement 9: Game History

**User Story:** As a user, I want to see past game sessions, so that I can review previous results or resume a game.

#### Acceptance Criteria

1. WHEN the user navigates to the history view, THE Tracker SHALL display a list of all saved Game_Sessions with their dates
2. WHEN the user selects a past Game_Session, THE Tracker SHALL load and display the full game state for that session
3. WHEN the user chooses to delete a Game_Session, THE Server SHALL remove the corresponding Session_File from disk

### Requirement 10: Minimal Setup

**User Story:** As a user, I want zero configuration beyond having Node.js installed, so that I can get started immediately.

#### Acceptance Criteria

1. THE Server SHALL run using only Node.js built-in modules with no external dependencies
2. THE Tracker SHALL be served as a single HTML file containing all markup, styles, and client-side scripts
3. THE Server SHALL provide endpoints for listing, loading, saving, and deleting Game_Session files

### Requirement 11: Track Game Rounds

**User Story:** As a user, I want the app to track the current round and phase of the game, so that I know whether we're in a stock round or an operating round.

#### Acceptance Criteria

1. THE Tracker SHALL track the current Game_Round number and the current phase (Stock_Round, Operating_Round 1, or Operating_Round 2)
2. THE Tracker SHALL display the current Game_Round number and phase prominently
3. WHEN a user advances to the next phase, THE Tracker SHALL transition from Stock_Round to Operating_Round 1, from Operating_Round 1 to Operating_Round 2, and from Operating_Round 2 to the Stock_Round of the next Game_Round
4. WHEN the phase changes, THE Server SHALL persist the updated Game_Session to the Session_File immediately
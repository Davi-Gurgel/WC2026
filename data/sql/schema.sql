PRAGMA foreign_keys = ON;

-- country_code follows the code expected by components/Flag.tsx / flag-icons.
-- It is the app identifier for flags and routes, not necessarily a FIFA code.
CREATE TABLE teams (
  country_code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  confederation TEXT NOT NULL,
  group_letter TEXT NOT NULL,
  strength INTEGER NOT NULL,
  attack_strength INTEGER NOT NULL,
  defense_strength INTEGER NOT NULL,
  midfield_strength INTEGER NOT NULL,
  fifa_ranking INTEGER NOT NULL,

  CHECK (country_code = upper(country_code)),
  CHECK (length(country_code) BETWEEN 2 AND 3),
  CHECK (length(name) > 0),
  CHECK (group_letter IN ('A','B','C','D','E','F','G','H','I','J','K','L')),
  CHECK (strength BETWEEN 1 AND 100),
  CHECK (attack_strength BETWEEN 1 AND 100),
  CHECK (defense_strength BETWEEN 1 AND 100),
  CHECK (midfield_strength BETWEEN 1 AND 100),
  CHECK (fifa_ranking BETWEEN 1 AND 250)
) STRICT;

CREATE TABLE players (
  id INTEGER PRIMARY KEY,
  team_country_code TEXT NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  strength INTEGER NOT NULL,
  sort_order INTEGER NOT NULL,

  FOREIGN KEY (team_country_code)
    REFERENCES teams(country_code)
    ON DELETE CASCADE,

  CHECK (length(name) > 0),
  CHECK (position IN ('GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD')),
  CHECK (strength BETWEEN 1 AND 100),
  CHECK (sort_order >= 0),
  UNIQUE (team_country_code, sort_order)
) STRICT;

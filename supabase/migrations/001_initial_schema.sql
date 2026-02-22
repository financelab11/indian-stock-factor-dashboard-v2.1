-- ============================================================
-- Migration: 001_initial_schema.sql
-- Indian Stock Factor Dashboard — Full Schema
-- ============================================================
-- Run this on a fresh Supabase project to recreate the schema.
-- After running, seed factors/parameters by calling POST /api/migrate
-- Then upload your Excel file via the /upload page.
-- ============================================================

-- ── Companies ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker           TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  sector           TEXT,
  industry         TEXT,
  market_cap       BIGINT DEFAULT 0,
  market_cap_bucket TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ── Years ──────────────────────────────────────────────────
-- Stores calendar year (e.g. 2024 for FY24)
CREATE TABLE IF NOT EXISTS years (
  id   SERIAL PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE
);

-- ── Factors ────────────────────────────────────────────────
-- Growth (0.3), Quality (0.3), Valuation (0.3), Momentum (0.1)
CREATE TABLE IF NOT EXISTS factors (
  id            UUID PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,
  description   TEXT,
  weight        NUMERIC(4,2) DEFAULT 0,
  display_order INTEGER DEFAULT 0
);

-- ── Parameters (sub-metrics within each factor) ────────────
CREATE TABLE IF NOT EXISTS parameters (
  id                   UUID PRIMARY KEY,
  factor_id            UUID NOT NULL REFERENCES factors(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  description          TEXT,
  normalization_method TEXT DEFAULT 'min_max',   -- 'min_max' or 'min_max_inverse'
  display_order        INTEGER DEFAULT 0
);

-- ── Parameter Scores (raw + normalised metric values) ──────
CREATE TABLE IF NOT EXISTS parameter_scores (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  parameter_id     UUID NOT NULL REFERENCES parameters(id) ON DELETE CASCADE,
  year_id          INTEGER NOT NULL REFERENCES years(id) ON DELETE CASCADE,
  raw_value        DOUBLE PRECISION,
  normalized_value DOUBLE PRECISION,
  UNIQUE (company_id, parameter_id, year_id)
);

-- ── Factor Scores (computed 0–100 per factor per company-year) ─
CREATE TABLE IF NOT EXISTS factor_scores (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  factor_id  UUID NOT NULL REFERENCES factors(id) ON DELETE CASCADE,
  year_id    INTEGER NOT NULL REFERENCES years(id) ON DELETE CASCADE,
  score      DOUBLE PRECISION DEFAULT 0,
  UNIQUE (company_id, factor_id, year_id)
);

-- ── Final Scores (weighted composite of all factors) ───────
CREATE TABLE IF NOT EXISTS final_scores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  year_id     INTEGER NOT NULL REFERENCES years(id) ON DELETE CASCADE,
  final_score DOUBLE PRECISION DEFAULT 0,
  UNIQUE (company_id, year_id)
);

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_factor_scores_company_year  ON factor_scores(company_id, year_id);
CREATE INDEX IF NOT EXISTS idx_factor_scores_year          ON factor_scores(year_id);
CREATE INDEX IF NOT EXISTS idx_final_scores_year           ON final_scores(year_id);
CREATE INDEX IF NOT EXISTS idx_parameter_scores_company_year ON parameter_scores(company_id, year_id);
CREATE INDEX IF NOT EXISTS idx_companies_ticker            ON companies(ticker);
CREATE INDEX IF NOT EXISTS idx_companies_sector            ON companies(sector);
CREATE INDEX IF NOT EXISTS idx_companies_mkt_bucket        ON companies(market_cap_bucket);

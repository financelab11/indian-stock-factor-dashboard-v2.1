-- ============================================================
-- Migration: 003_backtest_schema.sql
-- Portfolio Backtest tables
-- ============================================================

CREATE TABLE IF NOT EXISTS stock_returns (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  year_id        INTEGER NOT NULL REFERENCES years(id) ON DELETE CASCADE,
  forward_return DOUBLE PRECISION,
  UNIQUE (company_id, year_id)
);

CREATE TABLE IF NOT EXISTS benchmark_returns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benchmark_name   VARCHAR(50) NOT NULL,
  year             INTEGER NOT NULL,
  annual_return    DOUBLE PRECISION,
  cumulative_return DOUBLE PRECISION,
  UNIQUE (benchmark_name, year)
);

CREATE TABLE IF NOT EXISTS portfolio_backtest (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  selection_year   INTEGER NOT NULL,
  return_year      INTEGER NOT NULL,
  num_stocks       INTEGER NOT NULL DEFAULT 20,
  portfolio_return DOUBLE PRECISION,
  UNIQUE (selection_year, return_year, num_stocks)
);

CREATE TABLE IF NOT EXISTS portfolio_selection (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  selection_year   INTEGER NOT NULL,
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  score            DOUBLE PRECISION,
  next_year_return DOUBLE PRECISION,
  UNIQUE (selection_year, company_id)
);

CREATE INDEX IF NOT EXISTS idx_stock_returns_company_year ON stock_returns(company_id, year_id);
CREATE INDEX IF NOT EXISTS idx_stock_returns_year ON stock_returns(year_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_returns_name_year ON benchmark_returns(benchmark_name, year);
CREATE INDEX IF NOT EXISTS idx_portfolio_backtest_years ON portfolio_backtest(selection_year, return_year);
CREATE INDEX IF NOT EXISTS idx_portfolio_selection_year ON portfolio_selection(selection_year);

-- Seed Nifty50 annual returns FY2012-FY2025
INSERT INTO benchmark_returns (benchmark_name, year, annual_return, cumulative_return) VALUES
  ('NIFTY50', 2012, -9.23,   90.77),
  ('NIFTY50', 2013,  7.31,   97.40),
  ('NIFTY50', 2014, 17.98,  114.91),
  ('NIFTY50', 2015, 26.65,  145.52),
  ('NIFTY50', 2016, -4.06,  139.62),
  ('NIFTY50', 2017, 18.55,  165.53),
  ('NIFTY50', 2018, 10.25,  182.50),
  ('NIFTY50', 2019,  14.93,  209.74),
  ('NIFTY50', 2020, -26.03,  155.17),
  ('NIFTY50', 2021, 70.87,  265.10),
  ('NIFTY50', 2022, 18.88,  315.17),
  ('NIFTY50', 2023,  4.33,  328.82),
  ('NIFTY50', 2024, 20.00,  394.58),
  ('NIFTY50', 2025,  8.70,  428.91)
ON CONFLICT (benchmark_name, year) DO NOTHING;

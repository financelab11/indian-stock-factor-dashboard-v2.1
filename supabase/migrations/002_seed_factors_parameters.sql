-- ============================================================
-- Migration: 002_seed_factors_parameters.sql
-- Seeds the 4 factors and 16 sub-metric parameters that match
-- the Factor-Model Excel format.
-- ============================================================
-- Factor weights: Growth=0.3, Quality=0.3, Valuation=0.3, Momentum=0.1
-- Sub-metric weights: Growth/Quality/Valuation = 0.06 each (5 params × 0.06 = 0.30)
--                     Momentum = 0.10 (1 param × 0.10 = 0.10)
-- ============================================================

-- ── Factors ────────────────────────────────────────────────
INSERT INTO factors (id, name, description, weight, display_order) VALUES
  ('f1000000-0000-0000-0000-000000000003', 'Growth',    'Revenue and earnings growth (Rev1yr%, Rev3yr%, ebitda3y%, eps1yr%, eps3yr%)', 0.30, 1),
  ('f1000000-0000-0000-0000-000000000001', 'Quality',   'Financial quality metrics (roce%, roe%, ebit%, de, ccc)',                     0.30, 2),
  ('f1000000-0000-0000-0000-000000000002', 'Valuation', 'Valuation multiples (pe, evebitda, pfcfs, pocfs, peg)',                       0.30, 3),
  ('f1000000-0000-0000-0000-000000000004', 'Momentum',  'Price momentum (Price%)',                                                     0.10, 4)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  weight = EXCLUDED.weight,
  display_order = EXCLUDED.display_order;

-- ── Parameters ─────────────────────────────────────────────
-- Growth sub-metrics (higher is better)
INSERT INTO parameters (id, factor_id, name, description, normalization_method, display_order) VALUES
  ('a1000001-0000-4000-a000-000000000001', 'f1000000-0000-0000-0000-000000000003', 'Revenue 1Y Growth %',  '1-year revenue growth (Rev1yr%)',  'min_max',         1),
  ('a1000001-0000-4000-a000-000000000002', 'f1000000-0000-0000-0000-000000000003', 'Revenue 3Y CAGR %',   '3-year revenue CAGR (Rev3yr%)',    'min_max',         2),
  ('a1000001-0000-4000-a000-000000000003', 'f1000000-0000-0000-0000-000000000003', 'EBITDA 3Y CAGR %',    '3-year EBITDA CAGR (ebitda3y%)',   'min_max',         3),
  ('a1000001-0000-4000-a000-000000000004', 'f1000000-0000-0000-0000-000000000003', 'EPS 1Y Growth %',     '1-year EPS growth (eps1yr%)',      'min_max',         4),
  ('a1000001-0000-4000-a000-000000000005', 'f1000000-0000-0000-0000-000000000003', 'EPS 3Y CAGR %',       '3-year EPS CAGR (eps3yr%)',        'min_max',         5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, normalization_method = EXCLUDED.normalization_method, display_order = EXCLUDED.display_order;

-- Quality sub-metrics
INSERT INTO parameters (id, factor_id, name, description, normalization_method, display_order) VALUES
  ('a2000001-0000-4000-a000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'ROCE %',                  'Return on capital employed (roce%)',  'min_max',         1),
  ('a2000001-0000-4000-a000-000000000002', 'f1000000-0000-0000-0000-000000000001', 'ROE %',                   'Return on equity (roe%)',             'min_max',         2),
  ('a2000001-0000-4000-a000-000000000003', 'f1000000-0000-0000-0000-000000000001', 'EBIT Margin %',           'EBIT as % of revenue (ebit%)',        'min_max',         3),
  ('a2000001-0000-4000-a000-000000000004', 'f1000000-0000-0000-0000-000000000001', 'Debt/Equity',             'Debt to equity ratio (de)',           'min_max_inverse', 4),
  ('a2000001-0000-4000-a000-000000000005', 'f1000000-0000-0000-0000-000000000001', 'Cash Conversion Cycle',   'Cash conversion cycle days (ccc)',    'min_max_inverse', 5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, normalization_method = EXCLUDED.normalization_method, display_order = EXCLUDED.display_order;

-- Valuation sub-metrics (lower is better — min_max_inverse)
INSERT INTO parameters (id, factor_id, name, description, normalization_method, display_order) VALUES
  ('a3000001-0000-4000-a000-000000000001', 'f1000000-0000-0000-0000-000000000002', 'P/E Ratio',   'Price to earnings (pe)',             'min_max_inverse', 1),
  ('a3000001-0000-4000-a000-000000000002', 'f1000000-0000-0000-0000-000000000002', 'EV/EBITDA',   'Enterprise value to EBITDA',         'min_max_inverse', 2),
  ('a3000001-0000-4000-a000-000000000003', 'f1000000-0000-0000-0000-000000000002', 'P/FCF',       'Price to free cash flow (pfcfs)',    'min_max_inverse', 3),
  ('a3000001-0000-4000-a000-000000000004', 'f1000000-0000-0000-0000-000000000002', 'P/OCF',       'Price to operating cash flow',       'min_max_inverse', 4),
  ('a3000001-0000-4000-a000-000000000005', 'f1000000-0000-0000-0000-000000000002', 'PEG Ratio',   'Price/earnings to growth (peg)',     'min_max_inverse', 5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, normalization_method = EXCLUDED.normalization_method, display_order = EXCLUDED.display_order;

-- Momentum sub-metric
INSERT INTO parameters (id, factor_id, name, description, normalization_method, display_order) VALUES
  ('a4000001-0000-4000-a000-000000000001', 'f1000000-0000-0000-0000-000000000004', 'Price Return %', 'Annual price return (Price%)', 'min_max', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, normalization_method = EXCLUDED.normalization_method, display_order = EXCLUDED.display_order;

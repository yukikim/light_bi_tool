-- Demo seed data for local dev (safe to re-run)

DO $seed$
DECLARE
  demo_email TEXT := 'demo@example.com';
  demo_password_hash TEXT := '$2b$10$FAs0u8BdLo32A6XtewWy.O/qIajM6C54/LXVBRXKqENvVEkwm1bFW';
  demo_dashboard_name TEXT := 'Demo Dashboard';
  demo_query_name TEXT := 'Demo Query: Sales Trend';
  demo_widget_name TEXT := 'Sales Trend';

  v_user_id BIGINT;
  v_dashboard_id BIGINT;
  v_query_id BIGINT;
  v_widget_id BIGINT;
BEGIN
  -- User (for /auth/login)
  SELECT u.id INTO v_user_id FROM users u WHERE u.email = demo_email;
  IF v_user_id IS NULL THEN
    INSERT INTO users (email, password_hash)
    VALUES (demo_email, demo_password_hash)
    RETURNING id INTO v_user_id;
  END IF;

  -- Query
  SELECT q.id INTO v_query_id
  FROM queries q
  WHERE q.name = demo_query_name
  ORDER BY q.id
  LIMIT 1;

  IF v_query_id IS NULL THEN
    INSERT INTO queries (name, sql, param_defs)
    VALUES (
      demo_query_name,
      $sql$
      SELECT
        gs::date AS date,
        (1000 + (EXTRACT(day FROM gs)::int * 12))::int AS sales,
        (200 + (EXTRACT(day FROM gs)::int * 3))::int AS profit
      FROM generate_series(current_date - interval '29 days', current_date, interval '1 day') AS gs
      ORDER BY date
      $sql$,
      '[]'::jsonb
    )
    RETURNING id INTO v_query_id;
  END IF;

  -- Dashboard
  SELECT d.id INTO v_dashboard_id
  FROM dashboards d
  WHERE d.name = demo_dashboard_name
  ORDER BY d.id
  LIMIT 1;

  IF v_dashboard_id IS NULL THEN
    INSERT INTO dashboards (name)
    VALUES (demo_dashboard_name)
    RETURNING id INTO v_dashboard_id;
  END IF;

  -- Widget (ensure the dashboard has at least one visible widget)
  SELECT w.id INTO v_widget_id
  FROM widgets w
  WHERE w.dashboard_id = v_dashboard_id
    AND w.name = demo_widget_name
  ORDER BY w.id
  LIMIT 1;

  IF v_widget_id IS NULL THEN
    INSERT INTO widgets (
      dashboard_id,
      query_id,
      name,
      type,
      config,
      position_x,
      position_y,
      width,
      height
    )
    VALUES (
      v_dashboard_id,
      v_query_id,
      demo_widget_name,
      'line',
      jsonb_build_object(
        'xKey', 'date',
        'yKeys', jsonb_build_array('sales', 'profit'),
        'options', jsonb_build_object('showLegend', true, 'showGrid', true)
      ),
      0,
      0,
      12,
      7
    )
    RETURNING id INTO v_widget_id;
  END IF;
END $seed$;

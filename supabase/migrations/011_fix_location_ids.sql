-- Migration: Remap wrong CBP location IDs to correct ones
-- All 49 IDs (except JFK 5140) were fabricated and don't match the CBP schedulerapi.
-- E.g., 5003 was labeled "Los Angeles" but actually points to Brownsville, TX.
-- This migration fixes monitors AND alert payloads to use the real CBP location IDs.

BEGIN;

-- Step 1: Remap location_ids in monitors.config
-- Uses a single-pass approach to avoid double-remapping (e.g., old 5006→5446, old 5446→6480)
WITH id_map(old_id, new_id) AS (VALUES
  (5446, 6480),    -- New York - Bowling Green (was mislabeled "26 Federal Plaza")
  (5447, 5444),    -- Newark Liberty International
  (5003, 5180),    -- Los Angeles International (was Brownsville, TX!)
  (5006, 5446),    -- San Francisco Enrollment Center (was Calexico, CA!)
  (5002, 5183),    -- Chicago O'Hare (was Otay Mesa, CA!)
  (5007, 5181),    -- Miami International (was Nogales, AZ!)
  (5023, 5420),    -- Seattle-Tacoma (was Detroit EC!)
  (5021, 5441),    -- Boston-Logan (was Champlain, NY!)
  (5004, 5182),    -- Atlanta Hartsfield-Jackson (was Laredo, TX!)
  (5030, 5300),    -- Dallas/Fort Worth
  (5011, 6940),    -- Denver International
  (5009, 5360),    -- Las Vegas
  (5013, 7160),    -- Phoenix Sky Harbor
  (5008, 5142),    -- Washington Dulles
  (5010, 5141),    -- Houston Bush Intercontinental
  (5012, 6840),    -- Minneapolis-St. Paul
  (5014, 7960),    -- Portland
  (5015, 16547),   -- San Diego
  (5016, 5400),    -- San Juan
  (5017, 5445),    -- Philadelphia
  (5018, 5320),    -- Detroit Metro
  (5019, 14321),   -- Charlotte Douglas
  (5020, 7600),    -- Salt Lake City
  (5022, 8020),    -- Tampa
  (5024, 5380),    -- Orlando
  (5025, 12781),   -- Kansas City
  (5028, 16970),   -- Indianapolis
  (5029, 9200),    -- Pittsburgh
  (5031, 9740),    -- New Orleans
  (5032, 13621),   -- Memphis
  (5033, 10260),   -- Nashville
  (5034, 7820),    -- Austin-Bergstrom
  (5035, 7520),    -- San Antonio
  (5036, 5005),    -- El Paso
  (5037, 5340),    -- Honolulu
  (5038, 7540),    -- Anchorage
  (5039, 7940),    -- Baltimore/Washington BWI
  (5040, 16802),   -- Columbus (temporary CBP event)
  (5041, 9180),    -- Cleveland
  (5042, 12021),   -- St. Louis
  (5043, 7680),    -- Cincinnati
  (5044, 7740),    -- Milwaukee
  (5045, 14981),   -- Richmond
  (5046, 16613),   -- Jacksonville (temporary CBP event)
  (5047, 9240),    -- Tucson
  (5048, 8040)     -- Albuquerque
),
-- IDs to remove entirely (no permanent CBP enrollment center exists)
removed_ids(id) AS (VALUES (5026), (5027), (5049)),  -- Sacramento, Raleigh, Oklahoma City
-- Expand each monitor's location_ids, remap, filter, reaggregate
remapped AS (
  SELECT
    m.id AS monitor_id,
    jsonb_agg(
      CASE
        WHEN map.new_id IS NOT NULL THEN to_jsonb(map.new_id)
        ELSE to_jsonb(loc.val::int)
      END
    ) AS new_location_ids
  FROM monitors m,
       jsonb_array_elements_text(m.config -> 'location_ids') AS loc(val)
  LEFT JOIN id_map map ON map.old_id = loc.val::int
  LEFT JOIN removed_ids rem ON rem.id = loc.val::int
  WHERE rem.id IS NULL  -- exclude removed locations
  GROUP BY m.id
)
UPDATE monitors m
SET config = jsonb_set(m.config, '{location_ids}', r.new_location_ids)
FROM remapped r
WHERE m.id = r.monitor_id
  AND m.config -> 'location_ids' IS NOT NULL;

-- Step 2: Deactivate monitors that lost ALL their locations (only had Sacramento/Raleigh/OKC)
UPDATE monitors
SET active = false
WHERE config -> 'location_ids' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(config -> 'location_ids') AS loc(val)
    WHERE loc.val::int NOT IN (5026, 5027, 5049)
  );

-- Step 3: Remap location_id in alert payloads
-- Alerts store location_id in payload JSONB — fix for historical accuracy
WITH id_map(old_id, new_id) AS (VALUES
  (5446, 6480), (5447, 5444), (5003, 5180), (5006, 5446), (5002, 5183),
  (5007, 5181), (5023, 5420), (5021, 5441), (5004, 5182), (5030, 5300),
  (5011, 6940), (5009, 5360), (5013, 7160), (5008, 5142), (5010, 5141),
  (5012, 6840), (5014, 7960), (5015, 16547), (5016, 5400), (5017, 5445),
  (5018, 5320), (5019, 14321), (5020, 7600), (5022, 8020), (5024, 5380),
  (5025, 12781), (5028, 16970), (5029, 9200), (5031, 9740), (5032, 13621),
  (5033, 10260), (5034, 7820), (5035, 7520), (5036, 5005), (5037, 5340),
  (5038, 7540), (5039, 7940), (5040, 16802), (5041, 9180), (5042, 12021),
  (5043, 7680), (5044, 7740), (5045, 14981), (5046, 16613), (5047, 9240),
  (5048, 8040)
)
UPDATE alerts a
SET payload = jsonb_set(a.payload, '{location_id}', to_jsonb(map.new_id))
FROM id_map map
WHERE (a.payload ->> 'location_id')::int = map.old_id;

-- Step 4: Remap location_id inside digest alert slot arrays
-- Digest alerts have payload.slots[].location_id
WITH id_map(old_id, new_id) AS (VALUES
  (5446, 6480), (5447, 5444), (5003, 5180), (5006, 5446), (5002, 5183),
  (5007, 5181), (5023, 5420), (5021, 5441), (5004, 5182), (5030, 5300),
  (5011, 6940), (5009, 5360), (5013, 7160), (5008, 5142), (5010, 5141),
  (5012, 6840), (5014, 7960), (5015, 16547), (5016, 5400), (5017, 5445),
  (5018, 5320), (5019, 14321), (5020, 7600), (5022, 8020), (5024, 5380),
  (5025, 12781), (5028, 16970), (5029, 9200), (5031, 9740), (5032, 13621),
  (5033, 10260), (5034, 7820), (5035, 7520), (5036, 5005), (5037, 5340),
  (5038, 7540), (5039, 7940), (5040, 16802), (5041, 9180), (5042, 12021),
  (5043, 7680), (5044, 7740), (5045, 14981), (5046, 16613), (5047, 9240),
  (5048, 8040)
),
alerts_with_slots AS (
  SELECT a.id, idx - 1 AS slot_idx, map.new_id
  FROM alerts a,
       jsonb_array_elements(a.payload -> 'slots') WITH ORDINALITY AS s(slot, idx)
  JOIN id_map map ON (s.slot ->> 'location_id')::int = map.old_id
)
UPDATE alerts a
SET payload = jsonb_set(
  a.payload,
  ARRAY['slots', s.slot_idx::text, 'location_id'],
  to_jsonb(s.new_id)
)
FROM alerts_with_slots s
WHERE a.id = s.id;

COMMIT;

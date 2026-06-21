-- cab1.fabworks.app — HighCraft Custom Cabinets assembly demo seed
-- Safe to re-run: clears demo job/users first. Config row auto-seeds (cabinet template) on first request.
-- PIN hash = SHA-256("fw_fabworks_2026" + pin)

-- Demo users (login with email + PIN)
DELETE FROM users WHERE email IN (
  'brad@highcraft.demo','mateo@highcraft.demo','jordan@highcraft.demo','sam@highcraft.demo'
);
INSERT INTO users (name, email, pin, role) VALUES
  ('Brad',   'brad@highcraft.demo',   '917d94ab39ba1be10554a5a90fda41846b9c53f7a7c6d9c80c7ab92ed60776cd', 'admin'),      -- PIN 1234
  ('Sam',    'sam@highcraft.demo',    'f2a2670fb35aee525981d13bc643ba91917d38ea57d26cdd82ae01459fc73d2d', 'supervisor'), -- PIN 3333
  ('Mateo',  'mateo@highcraft.demo',  '04334c8afa7933c068f677fcdd243840ee6312adb4ab3dd219716ec9b0207754', 'user'),       -- PIN 1111
  ('Jordan', 'jordan@highcraft.demo', '22636e3e8fea0e9c503f618cfeb70fb0b204845b4a915bc78eb2d851d5459184', 'user');       -- PIN 2222

-- Sample job 6789 Somewhere House: 3 buckets/nests x 4 cabinets = 12 cabinets
DELETE FROM cabinets WHERE job_id IN (SELECT id FROM jobs WHERE job_number = '6789');
DELETE FROM buckets  WHERE job_id IN (SELECT id FROM jobs WHERE job_number = '6789');
DELETE FROM jobs WHERE job_number = '6789';

INSERT INTO jobs (job_number, job_name, cabinet_count, status) VALUES
  ('6789', 'Somewhere House', 12, 'active');

INSERT INTO buckets (job_id, name, cabinet_count, status)
  SELECT id, 'Nest 1', 4, 'pending' FROM jobs WHERE job_number = '6789';
INSERT INTO buckets (job_id, name, cabinet_count, status)
  SELECT id, 'Nest 2', 4, 'pending' FROM jobs WHERE job_number = '6789';
INSERT INTO buckets (job_id, name, cabinet_count, status)
  SELECT id, 'Nest 3', 4, 'pending' FROM jobs WHERE job_number = '6789';

-- Cabinets 1-12, mapped to the three nests, with realistic labels.
-- Plain multi-row VALUES (avoids D1's compound-SELECT limit); bucket_id resolved per row.
INSERT INTO cabinets (job_id, bucket_id, cabinet_number, label, status) VALUES
  ((SELECT id FROM jobs WHERE job_number='6789'), (SELECT id FROM buckets WHERE name='Nest 1' AND job_id=(SELECT id FROM jobs WHERE job_number='6789')), 1,  'Base 36" Sink',       'pending'),
  ((SELECT id FROM jobs WHERE job_number='6789'), (SELECT id FROM buckets WHERE name='Nest 1' AND job_id=(SELECT id FROM jobs WHERE job_number='6789')), 2,  'Base 24" 3-Drawer',   'pending'),
  ((SELECT id FROM jobs WHERE job_number='6789'), (SELECT id FROM buckets WHERE name='Nest 1' AND job_id=(SELECT id FROM jobs WHERE job_number='6789')), 3,  'Base 18" Door',       'pending'),
  ((SELECT id FROM jobs WHERE job_number='6789'), (SELECT id FROM buckets WHERE name='Nest 1' AND job_id=(SELECT id FROM jobs WHERE job_number='6789')), 4,  'Base 30" Door',       'pending'),
  ((SELECT id FROM jobs WHERE job_number='6789'), (SELECT id FROM buckets WHERE name='Nest 2' AND job_id=(SELECT id FROM jobs WHERE job_number='6789')), 5,  'Wall 30x36 Double',   'pending'),
  ((SELECT id FROM jobs WHERE job_number='6789'), (SELECT id FROM buckets WHERE name='Nest 2' AND job_id=(SELECT id FROM jobs WHERE job_number='6789')), 6,  'Wall 24x36 Single',   'pending'),
  ((SELECT id FROM jobs WHERE job_number='6789'), (SELECT id FROM buckets WHERE name='Nest 2' AND job_id=(SELECT id FROM jobs WHERE job_number='6789')), 7,  'Wall 30x18 Over-Range','pending'),
  ((SELECT id FROM jobs WHERE job_number='6789'), (SELECT id FROM buckets WHERE name='Nest 2' AND job_id=(SELECT id FROM jobs WHERE job_number='6789')), 8,  'Wall 12x36 Single',   'pending'),
  ((SELECT id FROM jobs WHERE job_number='6789'), (SELECT id FROM buckets WHERE name='Nest 3' AND job_id=(SELECT id FROM jobs WHERE job_number='6789')), 9,  'Tall 24x84 Pantry',   'pending'),
  ((SELECT id FROM jobs WHERE job_number='6789'), (SELECT id FROM buckets WHERE name='Nest 3' AND job_id=(SELECT id FROM jobs WHERE job_number='6789')), 10, 'Tall 18x84 Broom',    'pending'),
  ((SELECT id FROM jobs WHERE job_number='6789'), (SELECT id FROM buckets WHERE name='Nest 3' AND job_id=(SELECT id FROM jobs WHERE job_number='6789')), 11, 'Vanity 48" Double',   'pending'),
  ((SELECT id FROM jobs WHERE job_number='6789'), (SELECT id FROM buckets WHERE name='Nest 3' AND job_id=(SELECT id FROM jobs WHERE job_number='6789')), 12, 'Vanity 30" Single',   'pending');

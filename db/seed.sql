-- PulseFit sample data. Safe to run repeatedly: exercises upsert by name,
-- classes upsert by title and are re-dated to the current week (Mon = day 0).

INSERT INTO exercises (name, muscle_group, sets, reps, difficulty, rest_seconds, description) VALUES
  -- Chest
  ('Barbell Bench Press',     'Chest',  4, '6-8',      'Intermediate', 90,  'Lower the bar to mid-chest with control, then press up while keeping your shoulder blades pinned.'),
  ('Incline Dumbbell Press',  'Chest',  3, '8-10',     'Intermediate', 75,  'On a 30° incline, press the dumbbells up and slightly together to hit the upper chest.'),
  ('Tempo Push-Ups',          'Chest',  3, '12-15',    'Beginner',     45,  'Three seconds down, one second up. Keep your body in a straight line from head to heels.'),
  ('Cable Crossover Fly',     'Chest',  3, '12',       'Beginner',     60,  'Hug a big tree: sweep the handles together with a soft bend in the elbows and squeeze.'),
  ('Weighted Dips',           'Chest',  3, '6-10',     'Advanced',     90,  'Lean forward slightly to bias the chest and lower until your shoulders are just below your elbows.'),
  -- Back
  ('Conventional Deadlift',   'Back',   4, '5',        'Advanced',     120, 'Brace hard, push the floor away and keep the bar close to your legs the whole way up.'),
  ('Weighted Pull-Ups',       'Back',   4, '6-8',      'Advanced',     90,  'Start from a dead hang and pull until your chin clears the bar, driving elbows to your ribs.'),
  ('Bent-Over Barbell Row',   'Back',   4, '8',        'Intermediate', 75,  'Hinge to about 45°, then row the bar to your lower ribs without jerking your torso.'),
  ('Lat Pulldown',            'Back',   3, '10-12',    'Beginner',     60,  'Pull the bar to your upper chest, leading with the elbows, and control it back up.'),
  ('Seated Cable Row',        'Back',   3, '10-12',    'Beginner',     60,  'Sit tall, row the handle to your belly button and squeeze your shoulder blades together.'),
  -- Legs
  ('Back Squat',              'Legs',   5, '5',        'Advanced',     120, 'Sit between your hips with a proud chest, knees tracking over toes, and drive up through mid-foot.'),
  ('Romanian Deadlift',       'Legs',   3, '8-10',     'Intermediate', 90,  'Push your hips back with soft knees until you feel a deep hamstring stretch, then stand tall.'),
  ('Walking Lunges',          'Legs',   3, '12 / leg', 'Beginner',     60,  'Take long, controlled steps and lightly kiss the back knee to the floor each rep.'),
  ('Leg Press',               'Legs',   4, '10',       'Beginner',     75,  'Lower the sled until your knees reach about 90°, then press without locking out hard.'),
  ('Bulgarian Split Squat',   'Legs',   3, '8 / leg',  'Intermediate', 75,  'Rear foot on a bench, drop straight down and drive through the front heel.'),
  -- Arms
  ('EZ-Bar Curl',             'Arms',   3, '10-12',    'Beginner',     60,  'Pin your elbows to your sides and curl without swinging. Lower slowly for extra gains.'),
  ('Hammer Curls',            'Arms',   3, '12',       'Beginner',     45,  'Neutral grip, thumbs up. Great for forearms and the brachialis.'),
  ('Skull Crushers',          'Arms',   3, '10',       'Intermediate', 60,  'Lower the bar toward your forehead by bending only at the elbows, then extend.'),
  ('Close-Grip Bench Press',  'Arms',   4, '6-8',      'Advanced',     90,  'Hands shoulder-width, elbows tucked. A heavy hitter for the triceps.'),
  ('Cable Triceps Pushdown',  'Arms',   3, '12-15',    'Beginner',     45,  'Keep elbows glued to your sides and spread the rope apart at the bottom.'),
  -- Core
  ('Weighted Plank',          'Core',   3, '45 s',     'Beginner',     45,  'Squeeze glutes and brace your abs like you are about to be punched. No sagging hips.'),
  ('Hanging Leg Raises',      'Core',   3, '10-12',    'Intermediate', 60,  'From a dead hang, lift your legs with control and avoid swinging.'),
  ('Ab Wheel Rollout',        'Core',   3, '8-10',     'Advanced',     60,  'Roll out only as far as you can keep a flat back, then pull back with your abs.'),
  ('Pallof Press',            'Core',   3, '12 / side','Beginner',     45,  'Press the cable straight out and resist the rotation. Anti-rotation core strength.'),
  ('Cable Woodchop',          'Core',   3, '12 / side','Intermediate', 45,  'Rotate through your torso, not your arms, moving the handle high to low.'),
  -- Cardio
  ('Rower Intervals',         'Cardio', 6, '250 m',    'Intermediate', 60,  'Legs, then body, then arms. Push hard for each 250 m piece.'),
  ('Sled Push',               'Cardio', 5, '20 m',     'Advanced',     90,  'Low body angle, arms locked, and drive with short powerful steps.'),
  ('Jump Rope Sprints',       'Cardio', 5, '60 s',     'Beginner',     30,  'Stay light on the balls of your feet and keep the rope turning from your wrists.'),
  ('Assault Bike Sprints',    'Cardio', 8, '20 s',     'Advanced',     40,  'All-out effort for 20 seconds. Push and pull the handles as hard as you pedal.'),
  ('Incline Treadmill Walk',  'Cardio', 1, '20 min',   'Beginner',     0,   'Set a 10-12% incline at a brisk walking pace. Do not hold the rails.')
ON CONFLICT (name) DO UPDATE SET
  muscle_group = EXCLUDED.muscle_group,
  sets         = EXCLUDED.sets,
  reps         = EXCLUDED.reps,
  difficulty   = EXCLUDED.difficulty,
  rest_seconds = EXCLUDED.rest_seconds,
  description  = EXCLUDED.description;

INSERT INTO classes (title, coach_name, start_time, duration_minutes, capacity, intensity)
SELECT c.title, c.coach_name,
       date_trunc('week', now()) + make_interval(days => c.day_offset) + c.at_time,
       c.duration_minutes, c.capacity, c.intensity
FROM (VALUES
  ('Sunrise HIIT',        'Maya Chen',    0, time '06:30', 45, 20, 3),
  ('Lunch Flow Yoga',     'Priya Nair',   0, time '12:15', 50, 18, 1),
  ('Rhythm Ride Spin',    'Leo Marques',  1, time '07:00', 45, 24, 2),
  ('Fight Club Boxing',   'Jordan Blake', 1, time '18:30', 60, 16, 3),
  ('Strength Foundations','Sam Okafor',   2, time '17:45', 50, 14, 2),
  ('Power Vinyasa Yoga',  'Priya Nair',   3, time '06:30', 60, 18, 2),
  ('Climb & Sprint Spin', 'Leo Marques',  3, time '18:00', 45, 24, 3),
  ('Kettlebell Strength', 'Sam Okafor',   4, time '07:00', 45, 16, 2),
  ('Weekend Warrior HIIT','Maya Chen',    5, time '09:00', 45, 24, 3),
  ('Pads & Power Boxing', 'Jordan Blake', 5, time '10:30', 50, 16, 2)
) AS c (title, coach_name, day_offset, at_time, duration_minutes, capacity, intensity)
ON CONFLICT (title) DO UPDATE SET
  coach_name       = EXCLUDED.coach_name,
  start_time       = EXCLUDED.start_time,
  duration_minutes = EXCLUDED.duration_minutes,
  capacity         = EXCLUDED.capacity,
  intensity        = EXCLUDED.intensity;

const express = require('express');
const cors = require('cors');
const { createDatabase, clone } = require('./data');

const PORT = process.env.PORT || 3001;
const AUTH_TOKEN = 'school-project-demo-token';
const SAMPLE_TITLE = 'Makrykostaiioi';

let db = createDatabase();

const app = express();
app.use(cors());
app.use(express.json());

function nextId(items, key) {
  return items.reduce((max, item) => Math.max(max, item[key]), 0) + 1;
}

function toInt(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : NaN;
}

function requireAuth(req, res, next) {
  if (req.path === '/api/health' || req.path === '/api/auth/login') {
    return next();
  }

  const header = req.get('authorization') || '';
  if (header !== `Bearer ${AUTH_TOKEN}`) {
    return res.status(401).json({ message: 'Login required.' });
  }

  return next();
}

app.use(requireAuth);

function personById(pid, source = db) {
  return source.personnel.find((person) => person.pid === pid) || null;
}

function movieById(mid, source = db) {
  return source.movies.find((movie) => movie.mid === mid) || null;
}

function enrichMovie(movie, source = db) {
  const directors = source.directs
    .filter((row) => row.mid === movie.mid)
    .map((row) => personById(row.pid, source))
    .filter(Boolean);

  const actors = source.acts
    .filter((row) => row.mid === movie.mid)
    .map((row) => ({
      ...personById(row.pid, source),
      role_name: row.role_name
    }))
    .filter((row) => row.pid);

  return { ...movie, directors, actors };
}

function deleteMovieWithCascade(mid, source = db) {
  const movie = movieById(mid, source);
  if (!movie) return null;

  const removedDirects = source.directs.filter((row) => row.mid === mid);
  const removedActs = source.acts.filter((row) => row.mid === mid);

  source.movies = source.movies.filter((row) => row.mid !== mid);
  source.directs = source.directs.filter((row) => row.mid !== mid);
  source.acts = source.acts.filter((row) => row.mid !== mid);

  return {
    movie,
    removedDirects,
    removedActs
  };
}

function validateMovieInput(body, partial = false) {
  const errors = [];
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const rating = toInt(body.rating);
  const year = toInt(body.year);

  if (!partial || body.title !== undefined) {
    if (!title) errors.push('Title is required.');
  }

  if (!partial || body.rating !== undefined) {
    if (!Number.isInteger(rating) || rating < 0 || rating > 10) {
      errors.push('Rating must be an integer between 0 and 10.');
    }
  }

  if (!partial || body.year !== undefined) {
    if (!Number.isInteger(year) || year < 1888) {
      errors.push('Year must be an integer from 1888 onwards.');
    }
  }

  return { errors, values: { title, rating, year } };
}

function uniqueIds(values) {
  if (!Array.isArray(values)) return [];

  return [...new Set(values.map(toInt).filter(Number.isInteger))];
}

function normalizeActorLinks(values) {
  if (!Array.isArray(values)) return [];

  const links = [];
  const seen = new Set();

  values.forEach((item) => {
    const pid = toInt(item?.pid);
    const roleName = typeof item?.role_name === 'string' ? item.role_name.trim() : '';

    if (!Number.isInteger(pid) || !roleName || seen.has(pid)) return;
    seen.add(pid);
    links.push({ pid, role_name: roleName });
  });

  return links;
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'movies-platform-backend' });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'examino' && password === 'prodef') {
    return res.json({ token: AUTH_TOKEN, user: { id: 1, username } });
  }

  return res.status(401).json({ message: 'Invalid username or password.' });
});

app.get('/api/overview', (req, res) => {
  res.json({
    counts: {
      movies: db.movies.length,
      personnel: db.personnel.length,
      directs: db.directs.length,
      acts: db.acts.length
    },
    erd: {
      personnel: 'personnel(pid, name, birth_year)',
      movie: 'movie(mid, title, rating, year)',
      directs: 'directs(pid, mid) joins personnel to movie as directors',
      acts: 'acts(pid, mid, role_name) joins personnel to movie as actors'
    },
    lockingLogic:
      'The old PHP file 130a-gen.php starts a session and checks whether logged_in_user_id equals 1. Locked pages include that file before any page content, so unauthenticated users are redirected to 130d-login.php. In this Node version, the mobile app logs in with the same credentials and sends a bearer token to every protected API route.'
  });
});

app.get('/api/movies', (req, res) => {
  const startsWith = String(req.query.startsWith || '').toLowerCase();
  const search = String(req.query.search || '').toLowerCase();

  let movies = [...db.movies].sort((a, b) => a.mid - b.mid);

  if (startsWith) {
    movies = movies.filter((movie) => movie.title.toLowerCase().startsWith(startsWith));
  }

  if (search) {
    movies = movies.filter((movie) => movie.title.toLowerCase().includes(search));
  }

  res.json(movies.map((movie) => enrichMovie(movie)));
});

app.get('/api/movies/:mid', (req, res) => {
  const movie = movieById(Number(req.params.mid));
  if (!movie) return res.status(404).json({ message: 'Movie not found.' });
  return res.json(enrichMovie(movie));
});

app.post('/api/movies', (req, res) => {
  const { errors, values } = validateMovieInput(req.body);
  const directorIds = uniqueIds(req.body.director_ids);
  const actorLinks = normalizeActorLinks(req.body.actors);

  directorIds.forEach((pid) => {
    if (!personById(pid)) errors.push('One selected director does not exist.');
  });

  actorLinks.forEach((actor) => {
    if (!personById(actor.pid)) errors.push('One selected actor does not exist.');
  });

  if (errors.length) return res.status(400).json({ message: errors.join(' ') });

  const movie = {
    mid: nextId(db.movies, 'mid'),
    title: values.title,
    rating: values.rating,
    year: values.year,
    poster_url: typeof req.body.poster_url === 'string' ? req.body.poster_url.trim() : '',
    backdrop_url: typeof req.body.backdrop_url === 'string' ? req.body.backdrop_url.trim() : ''
  };

  db.movies.push(movie);
  directorIds.forEach((pid) => {
    db.directs.push({ pid, mid: movie.mid });
  });
  actorLinks.forEach((actor) => {
    db.acts.push({ pid: actor.pid, mid: movie.mid, role_name: actor.role_name });
  });

  return res.status(201).json(enrichMovie(movie));
});

app.put('/api/movies/:mid', (req, res) => {
  const movie = movieById(Number(req.params.mid));
  if (!movie) return res.status(404).json({ message: 'Movie not found.' });

  const { errors, values } = validateMovieInput(req.body, true);
  if (errors.length) return res.status(400).json({ message: errors.join(' ') });

  if (req.body.title !== undefined) movie.title = values.title;
  if (req.body.rating !== undefined) movie.rating = values.rating;
  if (req.body.year !== undefined) movie.year = values.year;

  return res.json(enrichMovie(movie));
});

app.delete('/api/movies/:mid', (req, res) => {
  const result = deleteMovieWithCascade(Number(req.params.mid));
  if (!result) return res.status(404).json({ message: 'Movie not found.' });
  return res.json({
    message: 'Movie deleted. Related directs and acts rows were removed by cascade behavior.',
    ...result
  });
});

app.get('/api/personnel', (req, res) => {
  const bornFrom = toInt(req.query.bornFrom);
  let personnel = [...db.personnel].sort((a, b) => a.pid - b.pid);

  if (Number.isInteger(bornFrom)) {
    personnel = personnel.filter((person) => person.birth_year !== null && person.birth_year >= bornFrom);
  }

  res.json(personnel);
});

app.post('/api/personnel', (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const birthYear = toInt(req.body.birth_year);

  if (!name) return res.status(400).json({ message: 'Name is required.' });
  if (birthYear !== null && !Number.isInteger(birthYear)) {
    return res.status(400).json({ message: 'Birth year must be empty or an integer.' });
  }

  const person = { pid: nextId(db.personnel, 'pid'), name, birth_year: birthYear };
  db.personnel.push(person);
  return res.status(201).json(person);
});

app.get('/api/directs', (req, res) => {
  const relations = db.directs.map((row) => ({
    ...row,
    person: personById(row.pid),
    movie: movieById(row.mid)
  }));
  res.json(relations);
});

app.post('/api/directs', (req, res) => {
  const pid = toInt(req.body.pid);
  const mid = toInt(req.body.mid);

  if (!personById(pid)) return res.status(400).json({ message: 'Selected artist does not exist.' });
  if (!movieById(mid)) return res.status(400).json({ message: 'Selected movie does not exist.' });
  if (db.directs.some((row) => row.pid === pid && row.mid === mid)) {
    return res.status(409).json({ message: 'That director/movie link already exists.' });
  }

  const relation = { pid, mid };
  db.directs.push(relation);

  return res.status(201).json({
    ...relation,
    person: personById(pid),
    movie: movieById(mid)
  });
});

app.get('/api/options', (req, res) => {
  res.json({
    artists: [...db.personnel].sort((a, b) => a.name.localeCompare(b.name)),
    movies: [...db.movies].sort((a, b) => a.title.localeCompare(b.title))
  });
});

app.post('/api/demo/insert-sample', (req, res) => {
  const existing = db.movies.find((movie) => movie.title === SAMPLE_TITLE);
  if (existing) return res.json({ message: 'Sample movie already exists.', movie: enrichMovie(existing) });

  const movie = {
    mid: nextId(db.movies, 'mid'),
    title: SAMPLE_TITLE,
    rating: 9,
    year: 1966
  };
  db.movies.push(movie);
  return res.status(201).json({ message: 'Sample movie inserted.', movie: enrichMovie(movie) });
});

app.post('/api/demo/update-sample', (req, res) => {
  const movie = db.movies.find((row) => row.title === SAMPLE_TITLE);
  if (!movie) return res.status(404).json({ message: 'Insert the sample movie first.' });

  movie.rating = 8;
  return res.json({ message: 'Sample movie updated.', movie: enrichMovie(movie) });
});

app.delete('/api/demo/delete-sample', (req, res) => {
  const movie = db.movies.find((row) => row.title === SAMPLE_TITLE);
  if (!movie) return res.status(404).json({ message: 'Sample movie is not present.' });

  const result = deleteMovieWithCascade(movie.mid);
  return res.json({ message: 'Sample movie deleted.', ...result });
});

app.post('/api/demo/cascade', (req, res) => {
  const demoDb = clone(db);
  const target = demoDb.movies.find((movie) => movie.mid === 2) || demoDb.movies[0];
  const before = {
    movies: demoDb.movies.length,
    directsForMovie: demoDb.directs.filter((row) => row.mid === target.mid).length,
    actsForMovie: demoDb.acts.filter((row) => row.mid === target.mid).length
  };

  const deleted = deleteMovieWithCascade(target.mid, demoDb);
  const after = {
    movies: demoDb.movies.length,
    directsForMovie: demoDb.directs.filter((row) => row.mid === target.mid).length,
    actsForMovie: demoDb.acts.filter((row) => row.mid === target.mid).length
  };

  res.json({
    explanation:
      'ON DELETE CASCADE means deleting a parent row automatically deletes child rows that reference it. This demo uses a cloned in-memory database so the visible app data is not changed.',
    deleted,
    before,
    after
  });
});

app.post('/api/reset', (req, res) => {
  db = createDatabase();
  res.json({ message: 'Database reset to seeded school data.' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.listen(PORT, () => {
  console.log(`Movies platform backend running at http://localhost:${PORT}`);
});

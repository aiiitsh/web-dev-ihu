import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

const tabs = [
  { id: 'movies', label: 'Library' },
  { id: 'add', label: 'Add Movie' },
  { id: 'search', label: 'Search' },
  { id: 'artists', label: 'Artists' },
  { id: 'directors', label: 'Crew Links' },
  { id: 'project', label: 'Project' }
];

const projectDetails = {
  name: 'Red Curtain Cinema',
  purpose: 'A school movie-platform project migrated from PHP/MySQL exercises to a JavaScript app with React Native and Node.js.',
  stack: [
    'Frontend: React Native with Expo',
    'Backend: Node.js with Express',
    'Database: in-memory seeded arrays for movie, personnel, directs, and acts',
    'Authentication: static school-project login with bearer-token protected API routes'
  ],
  features: [
    'Login screen using the original credentials examino / prodef',
    'Cinema-themed movie library dashboard with counts and top-rated highlights',
    'Full movie list with ratings, release years, directors, actors, and roles',
    'Movie deletion with cascade-style cleanup of related directs and acts rows',
    'Movie creation form with title, rating, and year validation',
    'Movie search by partial title',
    'Filtered artist list for people born from 1940 onwards',
    'Crew-link screen for assigning an artist as a movie director',
    'Project details tab documenting features, data model, backend routes, and school requirements',
    'ON DELETE CASCADE explanation and cloned-data test demo',
    'Red movie-site theme with faded film-strip and reel background patterns'
  ],
  properties: [
    'All app data resets when the backend process restarts because storage is intentionally in-memory.',
    'Movie ratings are integers from 0 to 10.',
    'Movie years must be 1888 or later.',
    'Personnel birth years can be null when unknown.',
    'Director links are unique by movie id and personnel id.',
    'The cascade demo runs on a cloned data set, so it does not damage the visible library.',
    'The Project tab should be updated whenever new screens, routes, rules, or UI features are added.'
  ],
  dataModel: [
    'personnel(pid, name, birth_year)',
    'movie(mid, title, rating, year)',
    'directs(pid, mid) connects personnel to movies as directors',
    'acts(pid, mid, role_name) connects personnel to movies as actors and stores the role'
  ],
  routes: [
    'POST /api/auth/login',
    'GET /api/overview',
    'GET /api/movies',
    'GET /api/movies?startsWith=M',
    'GET /api/movies?search=matrix',
    'POST /api/movies',
    'DELETE /api/movies/:mid',
    'GET /api/personnel?bornFrom=1940',
    'GET /api/options',
    'GET /api/directs',
    'POST /api/directs',
    'POST /api/demo/cascade',
    'POST /api/reset'
  ]
};

function BackgroundPattern() {
  return (
    <View pointerEvents="none" style={styles.backgroundPattern}>
      <View style={styles.filmStripOne}>
        {Array.from({ length: 8 }).map((_, index) => (
          <View key={`strip-one-${index}`} style={styles.filmHole} />
        ))}
      </View>
      <View style={styles.filmStripTwo}>
        {Array.from({ length: 7 }).map((_, index) => (
          <View key={`strip-two-${index}`} style={styles.filmHole} />
        ))}
      </View>
      <View style={styles.reelLarge}>
        {Array.from({ length: 5 }).map((_, index) => (
          <View key={`reel-large-${index}`} style={[styles.reelHole, { transform: [{ rotate: `${index * 72}deg` }] }]} />
        ))}
      </View>
      <View style={styles.reelSmall}>
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={`reel-small-${index}`} style={[styles.reelHoleSmall, { transform: [{ rotate: `${index * 90}deg` }] }]} />
        ))}
      </View>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, secureTextEntry = false }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        style={[styles.input, multiline && styles.textarea]}
        placeholderTextColor="#7a8494"
      />
    </View>
  );
}

function Button({ title, onPress, variant = 'primary', disabled = false }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed
      ]}
    >
      <Text style={[styles.buttonText, variant === 'secondary' && styles.buttonSecondaryText]}>{title}</Text>
    </Pressable>
  );
}

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Message({ text, type = 'info' }) {
  if (!text) return null;
  return (
    <View style={[styles.message, type === 'error' && styles.messageError]}>
      <Text style={styles.messageText}>{text}</Text>
    </View>
  );
}

function MovieCard({ movie, onDelete }) {
  const directors = movie.directors?.map((person) => person.name).join(', ') || 'No directors linked';
  const actors = movie.actors?.map((person) => `${person.name} as ${person.role_name}`).join(', ') || 'No actors linked';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{movie.title}</Text>
        <Text style={styles.rating}>{movie.rating}/10</Text>
      </View>
      <Text style={styles.meta}>{movie.year}</Text>
      <Text style={styles.detail}>Directors: {directors}</Text>
      <Text style={styles.detail}>Actors: {actors}</Text>
      {onDelete ? (
        <View style={styles.cardActions}>
          <Button title="Remove movie" onPress={() => onDelete(movie)} variant="danger" />
        </View>
      ) : null}
    </View>
  );
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('examino');
  const [password, setPassword] = useState('prodef');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function submit() {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Login failed.');
      onLogin(data.token);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <BackgroundPattern />
      <View style={styles.loginScreen}>
        <Text style={styles.appTitle}>Red Curtain Cinema</Text>
        <Text style={styles.subtitle}>Movie library and crew manager</Text>
        <View style={styles.panel}>
          <Field label="Username" value={username} onChangeText={setUsername} placeholder="examino" />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="prodef" secureTextEntry />
          <Button title={loading ? 'Signing in...' : 'Sign in'} onPress={submit} disabled={loading} />
          <Message text={message} type="error" />
        </View>
      </View>
    </SafeAreaView>
  );
}

function MoviesScreen({ api }) {
  const [movies, setMovies] = useState([]);
  const [mMovies, setMMovies] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [allMovies, startsWithM, overviewData] = await Promise.all([
        api('/api/movies'),
        api('/api/movies?startsWith=M'),
        api('/api/overview')
      ]);
      setMovies(allMovies);
      setMMovies(startsWithM);
      setOverview(overviewData);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  function deleteMovie(movie) {
    Alert.alert('Remove movie', `Delete ${movie.title} from the library?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await api(`/api/movies/${movie.mid}`, { method: 'DELETE' });
            setMessage(result.message);
            load();
          } catch (error) {
            setMessage(error.message);
          }
        }
      }
    ]);
  }

  if (loading) return <ActivityIndicator style={styles.loader} color="#f5c451" />;

  const topRated = [...movies].sort((a, b) => b.rating - a.rating || b.year - a.year).slice(0, 3);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heroPanel}>
        <Text style={styles.kicker}>Now showing</Text>
        <Text style={styles.heroTitle}>Cinema Library</Text>
        <Text style={styles.heroCopy}>Browse seeded movies, review cast details, and keep director relationships organized.</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Movies" value={overview?.counts.movies ?? movies.length} />
        <StatCard label="Artists" value={overview?.counts.personnel ?? '-'} />
        <StatCard label="Director links" value={overview?.counts.directs ?? '-'} />
      </View>

      <Text style={styles.sectionTitle}>Top rated</Text>
      <View style={styles.featureGrid}>
        {topRated.map((movie) => (
          <View key={`top-${movie.mid}`} style={styles.featureCard}>
            <Text style={styles.featureTitle}>{movie.title}</Text>
            <Text style={styles.featureMeta}>{movie.year} / {movie.rating}/10</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Full library</Text>
        <Button title="Refresh" onPress={load} variant="secondary" />
      </View>
      <Message text={message} type={message.includes('not') ? 'error' : 'info'} />
      {movies.map((movie) => (
        <MovieCard key={movie.mid} movie={movie} onDelete={deleteMovie} />
      ))}

      <Text style={styles.sectionTitle}>Titles starting with M</Text>
      {mMovies.map((movie) => (
        <MovieCard key={`m-${movie.mid}`} movie={movie} />
      ))}
    </ScrollView>
  );
}

function AddMovieScreen({ api }) {
  const [title, setTitle] = useState('');
  const [rating, setRating] = useState('');
  const [year, setYear] = useState('');
  const [message, setMessage] = useState('');

  async function submit() {
    try {
      const movie = await api('/api/movies', {
        method: 'POST',
        body: JSON.stringify({ title, rating, year })
      });
      setTitle('');
      setRating('');
      setYear('');
      setMessage(`Created ${movie.title}.`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Add a movie</Text>
      <View style={styles.panel}>
        <Field label="Title" value={title} onChangeText={setTitle} placeholder="Movie title" />
        <Field label="Rating" value={rating} onChangeText={setRating} placeholder="0-10" keyboardType="number-pad" />
        <Field label="Year" value={year} onChangeText={setYear} placeholder="Release year" keyboardType="number-pad" />
        <Button title="Create movie" onPress={submit} />
        <Message text={message} type={message.startsWith('Created') ? 'info' : 'error'} />
      </View>
    </ScrollView>
  );
}

function SearchScreen({ api }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');

  async function search() {
    try {
      const data = await api(`/api/movies?search=${encodeURIComponent(query)}`);
      setResults(data);
      setMessage(data.length ? '' : 'No movies found.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Find a movie</Text>
      <View style={styles.panel}>
        <Field label="Movie name" value={query} onChangeText={setQuery} placeholder="Type part of a title" />
        <Button title="Search" onPress={search} />
      </View>
      <Message text={message} type={message === 'No movies found.' ? 'info' : 'error'} />
      {results.map((movie) => (
        <MovieCard key={movie.mid} movie={movie} />
      ))}
    </ScrollView>
  );
}

function ArtistsScreen({ api }) {
  const [artists, setArtists] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api('/api/personnel?bornFrom=1940')
      .then(setArtists)
      .catch((error) => setMessage(error.message));
  }, [api]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Artists born from 1940 onwards</Text>
      <Message text={message} type="error" />
      {artists.map((artist) => (
        <View key={artist.pid} style={styles.rowCard}>
          <Text style={styles.rowTitle}>{artist.name}</Text>
          <Text style={styles.meta}>{artist.birth_year}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function OptionButton({ item, selected, title, subtitle, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.option, selected && styles.optionSelected]}>
      <Text style={[styles.optionTitle, selected && styles.optionSelectedText]}>{title}</Text>
      {subtitle ? <Text style={[styles.meta, selected && styles.optionSelectedText]}>{subtitle}</Text> : null}
    </Pressable>
  );
}

function DetailList({ items }) {
  return (
    <View style={styles.detailList}>
      {items.map((item) => (
        <View key={item} style={styles.detailRow}>
          <Text style={styles.bullet}>-</Text>
          <Text style={styles.detailText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function DirectorsScreen({ api }) {
  const [artists, setArtists] = useState([]);
  const [movies, setMovies] = useState([]);
  const [relations, setRelations] = useState([]);
  const [pid, setPid] = useState(null);
  const [mid, setMid] = useState(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const [options, currentRelations] = await Promise.all([api('/api/options'), api('/api/directs')]);
      setArtists(options.artists);
      setMovies(options.movies);
      setRelations(currentRelations);
      setPid((current) => current || options.artists[0]?.pid || null);
      setMid((current) => current || options.movies[0]?.mid || null);
    } catch (error) {
      setMessage(error.message);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  async function assign() {
    try {
      const relation = await api('/api/directs', {
        method: 'POST',
        body: JSON.stringify({ pid, mid })
      });
      setMessage(`${relation.person.name} now directs ${relation.movie.title}.`);
      load();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Assign a director</Text>
      <Text style={styles.listTitle}>Artist names</Text>
      <View style={styles.optionGrid}>
        {artists.map((artist) => (
          <OptionButton
            key={artist.pid}
            item={artist}
            selected={pid === artist.pid}
            title={artist.name}
            subtitle={artist.birth_year ? String(artist.birth_year) : 'Birth year unknown'}
            onPress={() => setPid(artist.pid)}
          />
        ))}
      </View>

      <Text style={styles.listTitle}>Movie titles</Text>
      <View style={styles.optionGrid}>
        {movies.map((movie) => (
          <OptionButton
            key={movie.mid}
            item={movie}
            selected={mid === movie.mid}
            title={movie.title}
            subtitle={`${movie.year} - ${movie.rating}/10`}
            onPress={() => setMid(movie.mid)}
          />
        ))}
      </View>

      <Button title="Create director link" onPress={assign} />
      <Message text={message} type={message.includes('already') ? 'error' : 'info'} />

      <Text style={styles.sectionTitle}>Current directors</Text>
      {relations.map((relation) => (
        <View key={`${relation.pid}-${relation.mid}`} style={styles.rowCard}>
          <Text style={styles.rowTitle}>{relation.person?.name}</Text>
          <Text style={styles.meta}>{relation.movie?.title}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function ProjectScreen({ api }) {
  const [overview, setOverview] = useState(null);
  const [cascade, setCascade] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api('/api/overview')
      .then(setOverview)
      .catch((error) => setMessage(error.message));
  }, [api]);

  async function runCascade() {
    try {
      const result = await api('/api/demo/cascade', { method: 'POST' });
      setCascade(result);
      setMessage('');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heroPanel}>
        <Text style={styles.kicker}>Project file</Text>
        <Text style={styles.heroTitle}>{projectDetails.name}</Text>
        <Text style={styles.heroCopy}>{projectDetails.purpose}</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Movies" value={overview?.counts.movies ?? '-'} />
        <StatCard label="Artists" value={overview?.counts.personnel ?? '-'} />
        <StatCard label="Actor rows" value={overview?.counts.acts ?? '-'} />
      </View>

      <Text style={styles.sectionTitle}>Features</Text>
      <View style={styles.panel}>
        <DetailList items={projectDetails.features} />
      </View>

      <Text style={styles.sectionTitle}>Project properties</Text>
      <View style={styles.panel}>
        <DetailList items={projectDetails.properties} />
      </View>

      <Text style={styles.sectionTitle}>Technology stack</Text>
      <View style={styles.panel}>
        <DetailList items={projectDetails.stack} />
      </View>

      <Text style={styles.sectionTitle}>Data model</Text>
      <View style={styles.panel}>
        <DetailList items={projectDetails.dataModel} />
        <Text style={styles.paragraph}>Entity relationships: personnel 1..n directs n..1 movie, and personnel 1..n acts n..1 movie.</Text>
        {overview ? (
          <Text style={styles.paragraph}>
            Rows: {overview.counts.movies} movies, {overview.counts.personnel} personnel, {overview.counts.directs} directs, {overview.counts.acts} acts.
          </Text>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>Backend routes</Text>
      <View style={styles.panel}>
        <DetailList items={projectDetails.routes} />
      </View>

      <Text style={styles.sectionTitle}>Authentication and locking</Text>
      <View style={styles.panel}>
        <Text style={styles.paragraph}>{overview?.lockingLogic}</Text>
      </View>

      <Text style={styles.sectionTitle}>ON DELETE CASCADE</Text>
      <View style={styles.panel}>
        <Text style={styles.paragraph}>
          Deleting a movie also removes rows in directs and acts that point to that movie. This keeps relationship tables from holding broken references.
        </Text>
        <Button title="Run cascade demo" onPress={runCascade} variant="secondary" />
        <Message text={message} type="error" />
        {cascade ? (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Test movie: {cascade.deleted.movie.title}</Text>
            <Text style={styles.paragraph}>Before: {cascade.before.movies} movies, {cascade.before.directsForMovie} directs rows, {cascade.before.actsForMovie} acts rows.</Text>
            <Text style={styles.paragraph}>After delete: {cascade.after.movies} movies, {cascade.after.directsForMovie} directs rows, {cascade.after.actsForMovie} acts rows.</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function MainApp({ token, onLogout }) {
  const [activeTab, setActiveTab] = useState('movies');

  const api = useCallback(
    async (path, options = {}) => {
      const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(options.headers || {})
        }
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Request failed.');
      return data;
    },
    [token]
  );

  const screen = useMemo(() => {
    if (activeTab === 'movies') return <MoviesScreen api={api} />;
    if (activeTab === 'add') return <AddMovieScreen api={api} />;
    if (activeTab === 'search') return <SearchScreen api={api} />;
    if (activeTab === 'artists') return <ArtistsScreen api={api} />;
    if (activeTab === 'directors') return <DirectorsScreen api={api} />;
    return <ProjectScreen api={api} />;
  }, [activeTab, api]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <BackgroundPattern />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Red Curtain Cinema</Text>
          <Text style={styles.headerSubtitle}>Backend: {API_BASE}</Text>
        </View>
        <Pressable onPress={() => Alert.alert('Logout', 'Sign out of the app?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', onPress: onLogout }
        ])}>
          <Text style={styles.logout}>Logout</Text>
        </Pressable>
      </View>
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {screen}
    </SafeAreaView>
  );
}

export default function App() {
  const [token, setToken] = useState(null);

  if (!token) return <LoginScreen onLogin={setToken} />;
  return <MainApp token={token} onLogout={() => setToken(null)} />;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#12070a'
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#12070a'
  },
  filmStripOne: {
    position: 'absolute',
    top: 58,
    right: -42,
    width: 86,
    height: 420,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(245, 196, 81, 0.14)',
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    justifyContent: 'space-around',
    alignItems: 'center',
    transform: [{ rotate: '17deg' }]
  },
  filmStripTwo: {
    position: 'absolute',
    bottom: -52,
    left: -28,
    width: 78,
    height: 360,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(229, 27, 53, 0.16)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    justifyContent: 'space-around',
    alignItems: 'center',
    transform: [{ rotate: '-18deg' }]
  },
  filmHole: {
    width: 34,
    height: 28,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.025)'
  },
  reelLarge: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 2,
    borderColor: 'rgba(245, 196, 81, 0.10)',
    right: -80,
    bottom: 140
  },
  reelSmall: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 2,
    borderColor: 'rgba(229, 27, 53, 0.12)',
    left: -44,
    top: 160
  },
  reelHole: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    left: 80,
    top: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.035)'
  },
  reelHoleSmall: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    left: 50,
    top: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.035)'
  },
  loginScreen: {
    flex: 1,
    justifyContent: 'center',
    padding: 20
  },
  appTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff7ed',
    letterSpacing: 0
  },
  subtitle: {
    color: '#f5c451',
    marginTop: 6,
    marginBottom: 22
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(23, 9, 12, 0.96)',
    borderBottomWidth: 1,
    borderColor: 'rgba(245, 196, 81, 0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff7ed',
    letterSpacing: 0
  },
  headerSubtitle: {
    color: '#d6a94f',
    fontSize: 12,
    marginTop: 2
  },
  logout: {
    color: '#ff6b7a',
    fontWeight: '700'
  },
  tabBar: {
    backgroundColor: 'rgba(23, 9, 12, 0.92)',
    borderBottomWidth: 1,
    borderColor: 'rgba(245, 196, 81, 0.14)'
  },
  tabContent: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8
  },
  tab: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)'
  },
  tabActive: {
    backgroundColor: '#b11226',
    borderColor: '#e51b35'
  },
  tabText: {
    color: '#d8c9bd',
    fontWeight: '700',
    fontSize: 13
  },
  tabTextActive: {
    color: '#ffffff'
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 12
  },
  panel: {
    backgroundColor: 'rgba(35, 16, 19, 0.92)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 196, 81, 0.16)',
    padding: 14,
    gap: 12
  },
  heroPanel: {
    backgroundColor: 'rgba(177, 18, 38, 0.86)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 196, 81, 0.28)',
    padding: 18,
    gap: 8
  },
  kicker: {
    color: '#f5c451',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0
  },
  heroTitle: {
    color: '#fff7ed',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0
  },
  heroCopy: {
    color: '#ffe6db',
    lineHeight: 21
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8
  },
  statCard: {
    flex: 1,
    minHeight: 78,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 196, 81, 0.16)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 12,
    justifyContent: 'center'
  },
  statValue: {
    color: '#f5c451',
    fontSize: 22,
    fontWeight: '800'
  },
  statLabel: {
    color: '#d8c9bd',
    fontSize: 12,
    marginTop: 3
  },
  featureGrid: {
    gap: 8
  },
  featureCard: {
    minHeight: 76,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 247, 237, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 196, 81, 0.14)',
    padding: 12,
    justifyContent: 'center'
  },
  featureTitle: {
    color: '#fff7ed',
    fontWeight: '800',
    fontSize: 16
  },
  featureMeta: {
    color: '#f5c451',
    marginTop: 4
  },
  sectionHeader: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#fff7ed',
    marginTop: 8,
    letterSpacing: 0
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f5c451',
    marginTop: 10
  },
  field: {
    gap: 6
  },
  label: {
    color: '#f0ded2',
    fontWeight: '700'
  },
  input: {
    minHeight: 46,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 196, 81, 0.20)',
    backgroundColor: 'rgba(255, 247, 237, 0.94)',
    paddingHorizontal: 12,
    color: '#1c0c10'
  },
  textarea: {
    minHeight: 110,
    paddingTop: 12,
    textAlignVertical: 'top'
  },
  button: {
    minHeight: 44,
    borderRadius: 6,
    backgroundColor: '#b11226',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  buttonSecondary: {
    backgroundColor: 'rgba(245, 196, 81, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 196, 81, 0.32)'
  },
  buttonDanger: {
    backgroundColor: '#7f1d1d'
  },
  buttonDisabled: {
    opacity: 0.65
  },
  buttonPressed: {
    opacity: 0.82
  },
  buttonText: {
    color: '#fff7ed',
    fontWeight: '800'
  },
  buttonSecondaryText: {
    color: '#f5c451'
  },
  message: {
    backgroundColor: 'rgba(245, 196, 81, 0.12)',
    borderColor: 'rgba(245, 196, 81, 0.30)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 6
  },
  messageError: {
    backgroundColor: 'rgba(127, 29, 29, 0.40)',
    borderColor: 'rgba(255, 107, 122, 0.35)'
  },
  messageText: {
    color: '#f8e4d5'
  },
  card: {
    backgroundColor: 'rgba(255, 247, 237, 0.95)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 196, 81, 0.25)',
    padding: 14,
    gap: 6
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#1c0c10',
    letterSpacing: 0
  },
  rating: {
    backgroundColor: '#b11226',
    color: '#fff7ed',
    borderRadius: 6,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontWeight: '800'
  },
  meta: {
    color: '#8a655a'
  },
  detail: {
    color: '#3c2528',
    lineHeight: 20
  },
  cardActions: {
    marginTop: 8
  },
  rowCard: {
    backgroundColor: 'rgba(255, 247, 237, 0.95)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 196, 81, 0.20)',
    padding: 12
  },
  rowTitle: {
    color: '#1c0c10',
    fontWeight: '800'
  },
  resultTitle: {
    color: '#f5c451',
    fontWeight: '800'
  },
  optionGrid: {
    gap: 8
  },
  option: {
    borderWidth: 1,
    borderColor: 'rgba(245, 196, 81, 0.18)',
    borderRadius: 6,
    backgroundColor: 'rgba(255, 247, 237, 0.94)',
    padding: 10
  },
  optionSelected: {
    backgroundColor: '#b11226',
    borderColor: '#e51b35'
  },
  optionTitle: {
    color: '#1c0c10',
    fontWeight: '700'
  },
  optionSelectedText: {
    color: '#ffffff'
  },
  actions: {
    gap: 8
  },
  paragraph: {
    color: '#f0ded2',
    lineHeight: 21
  },
  detailList: {
    gap: 8
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8
  },
  bullet: {
    width: 12,
    color: '#f5c451',
    fontWeight: '800',
    lineHeight: 21
  },
  detailText: {
    flex: 1,
    color: '#f0ded2',
    lineHeight: 21
  },
  resultBox: {
    borderTopWidth: 1,
    borderColor: 'rgba(245, 196, 81, 0.18)',
    paddingTop: 12,
    gap: 6
  },
  loader: {
    flex: 1
  }
});

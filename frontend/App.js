import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import * as Haptics from 'expo-haptics';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_WIDTH = Math.min(SCREEN_WIDTH - 32, 720);

const tabs = [
  { id: 'movies', label: 'Library' },
  { id: 'search', label: 'Search' },
  { id: 'artists', label: 'Artists' },
  { id: 'directors', label: 'Crew' },
  { id: 'project', label: 'Project' }
];

const projectDetails = {
  name: 'Red Curtain Cinema',
  purpose: 'A cinema-library project upgraded with production-style loading states, images, gestures, haptics, sheets, and toast feedback.',
  stack: [
    'Frontend: React Native with Expo',
    'Backend: Node.js with Express',
    'Images: poster_url, backdrop_url, and photo_url fields with initial-based fallbacks',
    'Interactions: swipe-to-delete, bottom sheets, haptics, inline validation, and toast messages'
  ],
  features: [
    'Login screen using the original credentials examino / prodef',
    'Dashboard hero carousel with top-rated backdrop images',
    'Poster-led movie cards with director and actor avatars',
    'Swipe-to-delete movie rows with a red destructive action',
    'Skeleton cards for primary loading states',
    'Create Movie and Assign Crew flows in bottom sheets',
    'Inline validation for title, rating, and year',
    'Interactive personnel filter pills',
    'Empty states with faded cinema marks',
    'Toast confirmations for create, delete, and crew-link actions'
  ],
  properties: [
    'All app data resets when the backend process restarts because storage is intentionally in-memory.',
    'Movie ratings are integers from 0 to 10.',
    'Movie years must be 1888 or later.',
    'Director links are unique by movie id and personnel id.',
    'Movies and personnel can render without image URLs by falling back to initial-based art.'
  ],
  dataModel: [
    'personnel(pid, name, birth_year, photo_url)',
    'movie(mid, title, rating, year, poster_url, backdrop_url)',
    'directs(pid, mid) connects personnel to movies as directors',
    'acts(pid, mid, role_name) connects personnel to movies as actors and stores the role'
  ],
  routes: [
    'POST /api/auth/login',
    'GET /api/overview',
    'GET /api/movies',
    'POST /api/movies',
    'DELETE /api/movies/:mid',
    'GET /api/personnel',
    'GET /api/options',
    'GET /api/directs',
    'POST /api/directs'
  ]
};

function initial(value) {
  return String(value || '?').trim().charAt(0).toUpperCase() || '?';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function haptic(type = 'success') {
  try {
    const feedback = type === 'warning' ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success;
    await Haptics.notificationAsync(feedback);
  } catch {
    // Haptics are best effort on web and unsupported devices.
  }
}

function BackgroundPattern() {
  return (
    <View style={[styles.backgroundPattern, styles.noPointerEvents]}>
      <View style={styles.redWash} />
      <View style={styles.filmStrip}>
        {Array.from({ length: 9 }).map((_, index) => <View key={index} style={styles.filmHole} />)}
      </View>
      <View style={styles.reel}>
        {Array.from({ length: 5 }).map((_, index) => (
          <View key={index} style={[styles.reelHole, { transform: [{ rotate: `${index * 72}deg` }] }]} />
        ))}
      </View>
    </View>
  );
}

function ShimmerBlock({ style }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 720, useNativeDriver: false }),
        Animated.timing(opacity, { toValue: 0.35, duration: 720, useNativeDriver: false })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.shimmerBlock, style, { opacity }]} />;
}

function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <ShimmerBlock style={styles.skeletonPoster} />
      <View style={styles.skeletonBody}>
        <ShimmerBlock style={styles.skeletonTitle} />
        <ShimmerBlock style={styles.skeletonLine} />
        <ShimmerBlock style={styles.skeletonLineShort} />
        <View style={styles.avatarRow}>
          <ShimmerBlock style={styles.skeletonAvatar} />
          <ShimmerBlock style={styles.skeletonAvatar} />
          <ShimmerBlock style={styles.skeletonAvatar} />
        </View>
      </View>
    </View>
  );
}

function SkeletonList({ count = 4 }) {
  return (
    <View style={styles.stack}>
      {Array.from({ length: count }).map((_, index) => <SkeletonCard key={index} />)}
    </View>
  );
}

function Toast({ toast, onDone }) {
  const translateY = useRef(new Animated.Value(96)).current;

  useEffect(() => {
    if (!toast) return undefined;
    Animated.spring(translateY, { toValue: 0, useNativeDriver: false, damping: 17, stiffness: 180 }).start();
    const timer = setTimeout(() => {
      Animated.timing(translateY, { toValue: 96, duration: 220, useNativeDriver: false }).start(onDone);
    }, 2600);
    return () => clearTimeout(timer);
  }, [onDone, toast, translateY]);

  if (!toast) return null;
  return (
    <Animated.View style={[styles.toast, toast.type === 'error' && styles.toastError, { transform: [{ translateY }] }]}>
      <Text style={styles.toastTitle}>{toast.title}</Text>
      {toast.message ? <Text style={styles.toastMessage}>{toast.message}</Text> : null}
    </Animated.View>
  );
}

function BottomSheet({ visible, title, onClose, children }) {
  const translateY = useRef(new Animated.Value(520)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : 520,
      useNativeDriver: false,
      damping: 19,
      stiffness: 170
    }).start();
  }, [translateY, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>x</Text>
            </Pressable>
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

function SwipeableRow({ children, onDelete }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const open = useRef(false);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: (_, gesture) => {
          const base = open.current ? -104 : 0;
          translateX.setValue(Math.max(-104, Math.min(0, base + gesture.dx)));
        },
        onPanResponderRelease: (_, gesture) => {
          const shouldOpen = gesture.dx < -38 || (open.current && gesture.dx < 34);
          open.current = shouldOpen;
          Animated.spring(translateX, { toValue: shouldOpen ? -104 : 0, useNativeDriver: false }).start();
        }
      }),
    [translateX]
  );

  return (
    <View style={styles.swipeWrap}>
      <Pressable style={styles.deleteReveal} onPress={onDelete}>
        <Text style={styles.deleteRevealText}>Delete</Text>
      </Pressable>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

function MediaImage({ uri, label, style }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  if (!uri || failed) {
    return (
      <View style={[styles.placeholderMedia, style]}>
        <View style={styles.placeholderReel}>
          <Text style={styles.placeholderText}>{initial(label)}</Text>
        </View>
      </View>
    );
  }

  return <Image source={{ uri }} style={style} resizeMode="cover" onError={() => setFailed(true)} />;
}

function Avatar({ person, size = 34 }) {
  const [failed, setFailed] = useState(false);
  const uri = person?.photo_url;

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri && !failed ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setFailed(true)} />
      ) : (
        <Text style={styles.avatarInitial}>{initial(person?.name)}</Text>
      )}
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
        variant === 'ghost' && styles.buttonGhost,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed
      ]}
    >
      <Text style={[styles.buttonText, variant !== 'primary' && styles.buttonSecondaryText]}>{title}</Text>
    </Pressable>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', secureTextEntry = false, error }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor="#767f8f"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
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

function EmptyState({ title, copy }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <View style={styles.emptyHole} />
        <View style={styles.emptyHole} />
        <View style={styles.emptyHole} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyCopy}>{copy}</Text>
    </View>
  );
}

function MovieCard({ movie, compact = false }) {
  const directors = movie.directors || [];
  const actors = movie.actors || [];
  const people = [...directors, ...actors].slice(0, 5);

  return (
    <View style={[styles.movieCard, compact && styles.movieCardCompact]}>
      <MediaImage uri={movie.poster_url} label={movie.title} style={styles.poster} />
      <View style={styles.movieBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>{movie.title}</Text>
          <Text style={styles.rating}>{movie.rating}/10</Text>
        </View>
        <Text style={styles.meta}>{movie.year}</Text>
        <Text style={styles.detail} numberOfLines={1}>
          {directors.length ? directors.map((person) => person.name).join(', ') : 'No directors linked'}
        </Text>
        <View style={styles.castRow}>
          {people.map((person, index) => <Avatar key={`${person.pid}-${index}`} person={person} />)}
          {!people.length ? <Text style={styles.detail}>Cast pending</Text> : null}
        </View>
      </View>
    </View>
  );
}

function HeroCarousel({ movies }) {
  if (!movies.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={HERO_WIDTH + 12} decelerationRate="fast" contentContainerStyle={styles.carousel}>
      {movies.map((movie) => (
        <View key={movie.mid} style={styles.heroSlide}>
          <MediaImage uri={movie.backdrop_url} label={movie.title} style={styles.heroBackdrop} />
          <View style={styles.heroScrim} />
          <View style={styles.heroContent}>
            <Text style={styles.kicker}>Top rated</Text>
            <Text style={styles.heroTitle} numberOfLines={2}>{movie.title}</Text>
            <Text style={styles.heroCopy}>{movie.year} / {movie.rating}/10</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function CreateMovieSheet({ visible, onClose, onCreate, artists = [] }) {
  const [title, setTitle] = useState('');
  const [rating, setRating] = useState('');
  const [year, setYear] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [directorIds, setDirectorIds] = useState([]);
  const [actorRoles, setActorRoles] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const selectedActors = Object.entries(actorRoles).map(([pid, roleName]) => ({
    pid: Number(pid),
    role_name: roleName
  }));
  const actorRoleError = selectedActors.some((actor) => !actor.role_name.trim()) ? 'Every selected actor needs a role name.' : '';
  const errors = {
    title: title.length > 0 && !title.trim() ? 'Title is required.' : '',
    rating: rating && (!Number.isInteger(Number(rating)) || Number(rating) < 0 || Number(rating) > 10) ? 'Use a whole number from 0 to 10.' : '',
    year: year && (!Number.isInteger(Number(year)) || Number(year) < 1888) ? 'Year must be 1888 or later.' : '',
    actors: actorRoleError
  };
  const canSubmit = title.trim() && rating && year && !errors.title && !errors.rating && !errors.year && !errors.actors;

  function toggleDirector(pid) {
    setDirectorIds((current) => (current.includes(pid) ? current.filter((id) => id !== pid) : [...current, pid]));
  }

  function toggleActor(pid) {
    setActorRoles((current) => {
      if (Object.prototype.hasOwnProperty.call(current, pid)) {
        const next = { ...current };
        delete next[pid];
        return next;
      }

      return { ...current, [pid]: '' };
    });
  }

  function updateActorRole(pid, roleName) {
    setActorRoles((current) => ({ ...current, [pid]: roleName }));
  }

  function resetForm() {
    setTitle('');
    setRating('');
    setYear('');
    setPosterUrl('');
    setBackdropUrl('');
    setDirectorIds([]);
    setActorRoles({});
  }

  async function submit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const ok = await onCreate({
      title,
      rating,
      year,
      poster_url: posterUrl.trim(),
      backdrop_url: backdropUrl.trim(),
      director_ids: directorIds,
      actors: selectedActors.filter((actor) => actor.role_name.trim())
    });
    setSubmitting(false);
    if (ok) {
      resetForm();
      onClose();
    }
  }

  return (
    <BottomSheet visible={visible} title="Create movie" onClose={onClose}>
      <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetContent}>
        <Field label="Title" value={title} onChangeText={setTitle} placeholder="Movie title" error={errors.title} />
        <Field label="Rating" value={rating} onChangeText={setRating} placeholder="0-10" keyboardType="number-pad" error={errors.rating} />
        <Field label="Year" value={year} onChangeText={setYear} placeholder="Release year" keyboardType="number-pad" error={errors.year} />
        <View style={styles.formSection}>
          <Text style={styles.listTitle}>Movie images</Text>
          <Text style={styles.helperText}>Paste public image URLs. Poster is vertical; backdrop is horizontal for the hero carousel.</Text>
          <Field label="Poster URL" value={posterUrl} onChangeText={setPosterUrl} placeholder="https://..." />
          <Field label="Backdrop URL" value={backdropUrl} onChangeText={setBackdropUrl} placeholder="https://..." />
          <View style={styles.previewRow}>
            <MediaImage uri={posterUrl} label={title || 'Poster'} style={styles.posterPreview} />
            <MediaImage uri={backdropUrl} label={title || 'Backdrop'} style={styles.backdropPreview} />
          </View>
        </View>
        <View style={styles.formSection}>
          <Text style={styles.listTitle}>Directors</Text>
          <Text style={styles.helperText}>Select one or more artists as directors.</Text>
          <View style={styles.personGrid}>
            {artists.map((artist) => {
              const selected = directorIds.includes(artist.pid);
              return (
                <Pressable key={artist.pid} onPress={() => toggleDirector(artist.pid)} style={[styles.personChip, selected && styles.personChipActive]}>
                  <Avatar person={artist} size={30} />
                  <Text style={[styles.personChipText, selected && styles.personChipTextActive]} numberOfLines={1}>{artist.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.formSection}>
          <Text style={styles.listTitle}>Actors and roles</Text>
          <Text style={styles.helperText}>Tap an artist to add them as an actor, then type the role name.</Text>
          <View style={styles.personGrid}>
            {artists.map((artist) => {
              const selected = Object.prototype.hasOwnProperty.call(actorRoles, artist.pid);
              return (
                <View key={artist.pid} style={[styles.actorChoice, selected && styles.actorChoiceActive]}>
                  <Pressable onPress={() => toggleActor(artist.pid)} style={styles.actorChoiceHeader}>
                    <Avatar person={artist} size={30} />
                    <Text style={[styles.personChipText, selected && styles.personChipTextActive]} numberOfLines={1}>{artist.name}</Text>
                  </Pressable>
                  {selected ? (
                    <TextInput
                      value={actorRoles[artist.pid]}
                      onChangeText={(value) => updateActorRole(artist.pid, value)}
                      placeholder="Role name"
                      placeholderTextColor="#767f8f"
                      style={[styles.input, styles.roleInput, !actorRoles[artist.pid].trim() && styles.inputError]}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>
          {errors.actors ? <Text style={styles.errorText}>{errors.actors}</Text> : null}
        </View>
        <Button title={submitting ? 'Creating...' : 'Create movie'} onPress={submit} disabled={!canSubmit || submitting} />
      </ScrollView>
    </BottomSheet>
  );
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('examino');
  const [password, setPassword] = useState('prodef');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

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
          {message ? <Text style={styles.errorText}>{message}</Text> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

function MoviesScreen({ api, notify }) {
  const [movies, setMovies] = useState([]);
  const [mMovies, setMMovies] = useState([]);
  const [overview, setOverview] = useState(null);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [allMovies, startsWithM, overviewData, options] = await Promise.all([
        api('/api/movies'),
        api('/api/movies?startsWith=M'),
        api('/api/overview'),
        api('/api/options'),
        sleep(450)
      ]);
      setMovies(allMovies);
      setMMovies(startsWithM);
      setOverview(overviewData);
      setArtists(options.artists);
    } catch (error) {
      notify('Could not load movies', error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [api, notify]);

  useEffect(() => {
    load();
  }, [load]);

  async function createMovie(payload) {
    try {
      const movie = await api('/api/movies', { method: 'POST', body: JSON.stringify(payload) });
      await haptic();
      notify('Movie added', `${movie.title} is now in the library.`);
      await load();
      return true;
    } catch (error) {
      notify('Create failed', error.message, 'error');
      return false;
    }
  }

  async function deleteMovie(movie) {
    try {
      await api(`/api/movies/${movie.mid}`, { method: 'DELETE' });
      setMovies((current) => current.filter((item) => item.mid !== movie.mid));
      setMMovies((current) => current.filter((item) => item.mid !== movie.mid));
      await haptic('warning');
      notify('Movie deleted', `${movie.title} was removed.`);
    } catch (error) {
      notify('Delete failed', error.message, 'error');
    }
  }

  const topRated = [...movies].sort((a, b) => b.rating - a.rating || b.year - a.year).slice(0, 5);

  if (loading) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <ShimmerBlock style={styles.heroSkeleton} />
        <View style={styles.statsGrid}>
          <ShimmerBlock style={styles.statSkeleton} />
          <ShimmerBlock style={styles.statSkeleton} />
          <ShimmerBlock style={styles.statSkeleton} />
        </View>
        <SkeletonList count={5} />
      </ScrollView>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <HeroCarousel movies={topRated} />
        <View style={styles.statsGrid}>
          <StatCard label="Movies" value={overview?.counts.movies ?? movies.length} />
          <StatCard label="Artists" value={overview?.counts.personnel ?? '-'} />
          <StatCard label="Crew links" value={overview?.counts.directs ?? '-'} />
        </View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Full library</Text>
          <Button title="Add movie" onPress={() => setSheetOpen(true)} variant="secondary" />
        </View>
        {movies.length ? (
          movies.map((movie) => (
            <SwipeableRow key={movie.mid} onDelete={() => deleteMovie(movie)}>
              <MovieCard movie={movie} />
            </SwipeableRow>
          ))
        ) : (
          <EmptyState title="No movies yet" copy="Create the first title to start building this library." />
        )}
        <Text style={styles.sectionTitle}>Titles starting with M</Text>
        {mMovies.length ? mMovies.map((movie) => <MovieCard key={`m-${movie.mid}`} movie={movie} compact />) : <EmptyState title="No M titles" copy="Titles beginning with M will appear here." />}
      </ScrollView>
      <CreateMovieSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} onCreate={createMovie} artists={artists} />
    </>
  );
}

function SearchScreen({ api, notify }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search() {
    setLoading(true);
    setSearched(true);
    try {
      const [data] = await Promise.all([api(`/api/movies?search=${encodeURIComponent(query)}`), sleep(350)]);
      setResults(data);
    } catch (error) {
      notify('Search failed', error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Find a movie</Text>
      <View style={styles.panel}>
        <Field label="Movie name" value={query} onChangeText={setQuery} placeholder="Type part of a title" />
        <Button title="Search" onPress={search} />
      </View>
      {loading ? <SkeletonList count={3} /> : null}
      {!loading && results.map((movie) => <MovieCard key={movie.mid} movie={movie} />)}
      {!loading && searched && !results.length ? <EmptyState title="No results" copy="Try a shorter title or search for another movie." /> : null}
    </ScrollView>
  );
}

function ArtistsScreen({ api, notify }) {
  const [artists, setArtists] = useState([]);
  const [filter, setFilter] = useState('1940');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api('/api/personnel'), sleep(350)])
      .then(([data]) => setArtists(data))
      .catch((error) => notify('Could not load artists', error.message, 'error'))
      .finally(() => setLoading(false));
  }, [api, notify]);

  const filtered = useMemo(() => {
    if (filter === 'all') return artists;
    if (filter === 'unknown') return artists.filter((artist) => artist.birth_year === null);
    const year = Number(filter);
    return artists.filter((artist) => artist.birth_year !== null && artist.birth_year >= year);
  }, [artists, filter]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Artists</Text>
      <View style={styles.pillRow}>
        {[
          ['1940', '1940+'],
          ['1950', '1950+'],
          ['unknown', 'Unknown'],
          ['all', 'All']
        ].map(([id, label]) => (
          <Pressable key={id} onPress={() => setFilter(id)} style={[styles.pill, filter === id && styles.pillActive]}>
            <Text style={[styles.pillText, filter === id && styles.pillTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {loading ? <SkeletonList count={4} /> : null}
      {!loading && filtered.map((artist) => (
        <View key={artist.pid} style={styles.artistCard}>
          <Avatar person={artist} size={52} />
          <View>
            <Text style={styles.artistName}>{artist.name}</Text>
            <Text style={styles.meta}>{artist.birth_year || 'Birth year unknown'}</Text>
          </View>
        </View>
      ))}
      {!loading && !filtered.length ? <EmptyState title="No artists found" copy="Change the filter pill to widen the list." /> : null}
    </ScrollView>
  );
}

function OptionButton({ selected, title, subtitle, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.option, selected && styles.optionSelected]}>
      <Text style={[styles.optionTitle, selected && styles.optionSelectedText]}>{title}</Text>
      {subtitle ? <Text style={[styles.meta, selected && styles.optionSelectedText]}>{subtitle}</Text> : null}
    </Pressable>
  );
}

function CrewSheet({ visible, onClose, artists, movies, pid, mid, setPid, setMid, onAssign }) {
  return (
    <BottomSheet visible={visible} title="Assign crew" onClose={onClose}>
      <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheetContent}>
        <Text style={styles.listTitle}>Artist</Text>
        <View style={styles.optionGrid}>
          {artists.map((artist) => (
            <OptionButton
              key={artist.pid}
              selected={pid === artist.pid}
              title={artist.name}
              subtitle={artist.birth_year ? String(artist.birth_year) : 'Birth year unknown'}
              onPress={() => setPid(artist.pid)}
            />
          ))}
        </View>
        <Text style={styles.listTitle}>Movie</Text>
        <View style={styles.optionGrid}>
          {movies.map((movie) => (
            <OptionButton
              key={movie.mid}
              selected={mid === movie.mid}
              title={movie.title}
              subtitle={`${movie.year} / ${movie.rating}/10`}
              onPress={() => setMid(movie.mid)}
            />
          ))}
        </View>
        <Button title="Create director link" onPress={onAssign} disabled={!pid || !mid} />
      </ScrollView>
    </BottomSheet>
  );
}

function DirectorsScreen({ api, notify }) {
  const [artists, setArtists] = useState([]);
  const [movies, setMovies] = useState([]);
  const [relations, setRelations] = useState([]);
  const [pid, setPid] = useState(null);
  const [mid, setMid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [options, currentRelations] = await Promise.all([api('/api/options'), api('/api/directs'), sleep(350)]);
      setArtists(options.artists);
      setMovies(options.movies);
      setRelations(currentRelations);
      setPid((current) => current || options.artists[0]?.pid || null);
      setMid((current) => current || options.movies[0]?.mid || null);
    } catch (error) {
      notify('Could not load crew', error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [api, notify]);

  useEffect(() => {
    load();
  }, [load]);

  async function assign() {
    try {
      const relation = await api('/api/directs', { method: 'POST', body: JSON.stringify({ pid, mid }) });
      await haptic();
      notify('Crew assigned', `${relation.person.name} now directs ${relation.movie.title}.`);
      setSheetOpen(false);
      await load();
    } catch (error) {
      notify('Assignment failed', error.message, 'error');
    }
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Director links</Text>
          <Button title="Assign crew" onPress={() => setSheetOpen(true)} variant="secondary" />
        </View>
        {loading ? <SkeletonList count={4} /> : null}
        {!loading && relations.map((relation) => (
          <View key={`${relation.pid}-${relation.mid}`} style={styles.artistCard}>
            <Avatar person={relation.person} size={52} />
            <View style={styles.flexOne}>
              <Text style={styles.artistName}>{relation.person?.name}</Text>
              <Text style={styles.meta}>{relation.movie?.title}</Text>
            </View>
          </View>
        ))}
        {!loading && !relations.length ? <EmptyState title="No crew links" copy="Use the Assign Crew sheet to connect directors with movies." /> : null}
      </ScrollView>
      <CrewSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        artists={artists}
        movies={movies}
        pid={pid}
        mid={mid}
        setPid={setPid}
        setMid={setMid}
        onAssign={assign}
      />
    </>
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

function ProjectScreen({ api, notify }) {
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    api('/api/overview')
      .then(setOverview)
      .catch((error) => notify('Could not load project data', error.message, 'error'));
  }, [api, notify]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.projectHero}>
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
      <View style={styles.panel}><DetailList items={projectDetails.features} /></View>
      <Text style={styles.sectionTitle}>Properties</Text>
      <View style={styles.panel}><DetailList items={projectDetails.properties} /></View>
      <Text style={styles.sectionTitle}>Stack</Text>
      <View style={styles.panel}><DetailList items={projectDetails.stack} /></View>
      <Text style={styles.sectionTitle}>Data model</Text>
      <View style={styles.panel}><DetailList items={projectDetails.dataModel} /></View>
      <Text style={styles.sectionTitle}>Routes</Text>
      <View style={styles.panel}><DetailList items={projectDetails.routes} /></View>
    </ScrollView>
  );
}

function MainApp({ token, onLogout }) {
  const [activeTab, setActiveTab] = useState('movies');
  const [toast, setToast] = useState(null);

  const notify = useCallback((title, message = '', type = 'success') => {
    setToast({ id: Date.now(), title, message, type });
  }, []);

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
    if (activeTab === 'movies') return <MoviesScreen api={api} notify={notify} />;
    if (activeTab === 'search') return <SearchScreen api={api} notify={notify} />;
    if (activeTab === 'artists') return <ArtistsScreen api={api} notify={notify} />;
    if (activeTab === 'directors') return <DirectorsScreen api={api} notify={notify} />;
    return <ProjectScreen api={api} notify={notify} />;
  }, [activeTab, api, notify]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <BackgroundPattern />
      <View style={styles.header}>
        <View style={styles.flexOne}>
          <Text style={styles.headerTitle}>Red Curtain Cinema</Text>
          <Text style={styles.headerSubtitle}>Backend: {API_BASE}</Text>
        </View>
        <Pressable onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logout}>Logout</Text>
        </Pressable>
      </View>
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
          {tabs.map((tab) => (
            <Pressable key={tab.id} onPress={() => setActiveTab(tab.id)} style={[styles.tab, activeTab === tab.id && styles.tabActive]}>
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {screen}
      <Toast toast={toast} onDone={() => setToast(null)} />
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
    backgroundColor: '#08090d'
  },
  flexOne: {
    flex: 1
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#08090d'
  },
  noPointerEvents: {
    pointerEvents: 'none'
  },
  redWash: {
    position: 'absolute',
    left: -80,
    right: -80,
    top: 210,
    height: 180,
    backgroundColor: 'rgba(229, 9, 20, 0.10)',
    transform: [{ rotate: '-10deg' }]
  },
  filmStrip: {
    position: 'absolute',
    top: 72,
    right: -40,
    width: 82,
    height: 420,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'space-around',
    alignItems: 'center',
    transform: [{ rotate: '16deg' }]
  },
  filmHole: {
    width: 34,
    height: 28,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.035)'
  },
  reel: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: 'rgba(229, 9, 20, 0.12)',
    left: -82,
    bottom: 110
  },
  reelHole: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    left: 86,
    top: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.035)'
  },
  loginScreen: {
    flex: 1,
    justifyContent: 'center',
    padding: 20
  },
  appTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0
  },
  subtitle: {
    color: '#aeb4c2',
    marginTop: 8,
    marginBottom: 22,
    fontSize: 15
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(8, 9, 13, 0.96)',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0
  },
  headerSubtitle: {
    color: '#7f8794',
    fontSize: 12,
    marginTop: 2
  },
  logoutButton: {
    padding: 8
  },
  logout: {
    color: '#ff5661',
    fontWeight: '800'
  },
  tabBar: {
    backgroundColor: 'rgba(12, 13, 18, 0.96)',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  tabContent: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  tabActive: {
    backgroundColor: '#E50914',
    borderColor: '#ff3b45'
  },
  tabText: {
    color: '#b9bfcb',
    fontWeight: '800',
    fontSize: 13
  },
  tabTextActive: {
    color: '#ffffff'
  },
  content: {
    padding: 16,
    paddingBottom: 52,
    gap: 14
  },
  stack: {
    gap: 12
  },
  panel: {
    backgroundColor: 'rgba(21, 23, 31, 0.94)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    gap: 12
  },
  carousel: {
    gap: 12,
    paddingRight: 16
  },
  heroSlide: {
    width: HERO_WIDTH,
    height: 230,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#171923'
  },
  heroBackdrop: {
    width: '100%',
    height: '100%'
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.46)'
  },
  heroContent: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16
  },
  projectHero: {
    minHeight: 164,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.28)',
    padding: 18,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(229, 9, 20, 0.24)'
  },
  kicker: {
    color: '#ffb4b9',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 4
  },
  heroCopy: {
    color: '#dfe3ec',
    lineHeight: 21,
    marginTop: 4
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
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(21, 23, 31, 0.92)',
    padding: 12,
    justifyContent: 'center'
  },
  statValue: {
    color: '#ffffff',
    fontSize: 23,
    fontWeight: '900'
  },
  statLabel: {
    color: '#8f97a6',
    fontSize: 12,
    marginTop: 4
  },
  sectionHeader: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 6
  },
  formSection: {
    gap: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 12,
    marginTop: 2
  },
  helperText: {
    color: '#8f97a6',
    lineHeight: 19
  },
  field: {
    gap: 6
  },
  label: {
    color: '#d7dce6',
    fontWeight: '800'
  },
  input: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: '#11131a',
    paddingHorizontal: 12,
    color: '#ffffff'
  },
  inputError: {
    borderColor: '#ff5661'
  },
  roleInput: {
    minHeight: 40,
    marginTop: 8
  },
  errorText: {
    color: '#ff8a92',
    fontSize: 12,
    fontWeight: '700'
  },
  previewRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'stretch'
  },
  posterPreview: {
    width: 82,
    height: 122,
    borderRadius: 8,
    overflow: 'hidden'
  },
  backdropPreview: {
    flex: 1,
    height: 122,
    borderRadius: 8,
    overflow: 'hidden'
  },
  button: {
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  buttonSecondary: {
    backgroundColor: 'rgba(229, 9, 20, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.44)'
  },
  buttonGhost: {
    backgroundColor: 'transparent'
  },
  buttonDisabled: {
    opacity: 0.5
  },
  buttonPressed: {
    opacity: 0.82
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '900'
  },
  buttonSecondaryText: {
    color: '#ffb4b9'
  },
  movieCard: {
    minHeight: 154,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#15171f',
    flexDirection: 'row',
    overflow: 'hidden'
  },
  movieCardCompact: {
    minHeight: 132
  },
  poster: {
    width: 98,
    minHeight: 154,
    backgroundColor: '#20232e'
  },
  movieBody: {
    flex: 1,
    padding: 12,
    gap: 7
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8
  },
  cardTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0
  },
  rating: {
    backgroundColor: '#E50914',
    color: '#ffffff',
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontWeight: '900',
    fontSize: 12
  },
  meta: {
    color: '#8f97a6'
  },
  detail: {
    color: '#c9ced8',
    lineHeight: 20
  },
  castRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2
  },
  avatarRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8
  },
  avatar: {
    overflow: 'hidden',
    backgroundColor: '#292d39',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)'
  },
  avatarInitial: {
    color: '#ffffff',
    fontWeight: '900'
  },
  placeholderMedia: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#20232e'
  },
  placeholderReel: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: 'rgba(229, 9, 20, 0.52)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  placeholderText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900'
  },
  swipeWrap: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E50914'
  },
  deleteReveal: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 104,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E50914'
  },
  deleteRevealText: {
    color: '#ffffff',
    fontWeight: '900'
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#15171f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  pillActive: {
    backgroundColor: '#E50914',
    borderColor: '#ff3b45'
  },
  pillText: {
    color: '#b9bfcb',
    fontWeight: '900'
  },
  pillTextActive: {
    color: '#ffffff'
  },
  personGrid: {
    gap: 8
  },
  personChip: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#15171f',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  personChipActive: {
    backgroundColor: 'rgba(229, 9, 20, 0.20)',
    borderColor: '#E50914'
  },
  personChipText: {
    flex: 1,
    color: '#d7dce6',
    fontWeight: '800'
  },
  personChipTextActive: {
    color: '#ffffff'
  },
  actorChoice: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#15171f',
    padding: 8
  },
  actorChoiceActive: {
    backgroundColor: 'rgba(229, 9, 20, 0.16)',
    borderColor: '#E50914'
  },
  actorChoiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  artistCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#15171f',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  artistName: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16
  },
  optionGrid: {
    gap: 8
  },
  option: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    backgroundColor: '#15171f',
    padding: 11
  },
  optionSelected: {
    backgroundColor: 'rgba(229, 9, 20, 0.22)',
    borderColor: '#E50914'
  },
  optionTitle: {
    color: '#ffffff',
    fontWeight: '900'
  },
  optionSelectedText: {
    color: '#ffffff'
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
    color: '#E50914',
    fontWeight: '900',
    lineHeight: 21
  },
  detailText: {
    flex: 1,
    color: '#d7dce6',
    lineHeight: 21
  },
  emptyState: {
    minHeight: 180,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(21, 23, 31, 0.72)'
  },
  emptyIcon: {
    width: 84,
    height: 48,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(229, 9, 20, 0.32)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    opacity: 0.8,
    marginBottom: 12
  },
  emptyHole: {
    width: 12,
    height: 22,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)'
  },
  emptyTitle: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 17
  },
  emptyCopy: {
    color: '#9aa2b1',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.54)'
  },
  sheet: {
    maxHeight: '86%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#101219',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 18
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#343946',
    marginBottom: 12
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  sheetTitle: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 20
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1b1e28'
  },
  closeText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 18
  },
  sheetContent: {
    gap: 12,
    paddingBottom: 12
  },
  sheetScroll: {
    maxHeight: 580
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#15171f',
    borderWidth: 1,
    borderColor: 'rgba(99, 230, 190, 0.34)'
  },
  toastError: {
    borderColor: 'rgba(255, 86, 97, 0.55)'
  },
  toastTitle: {
    color: '#ffffff',
    fontWeight: '900'
  },
  toastMessage: {
    color: '#b9bfcb',
    marginTop: 4
  },
  shimmerBlock: {
    backgroundColor: '#2b2f3b',
    borderRadius: 8
  },
  skeletonCard: {
    minHeight: 154,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    backgroundColor: '#15171f',
    flexDirection: 'row',
    overflow: 'hidden'
  },
  skeletonPoster: {
    width: 98,
    borderRadius: 0
  },
  skeletonBody: {
    flex: 1,
    padding: 12
  },
  skeletonTitle: {
    height: 22,
    width: '78%',
    marginBottom: 12
  },
  skeletonLine: {
    height: 14,
    width: '92%',
    marginBottom: 10
  },
  skeletonLineShort: {
    height: 14,
    width: '58%'
  },
  skeletonAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17
  },
  heroSkeleton: {
    height: 230,
    borderRadius: 8
  },
  statSkeleton: {
    flex: 1,
    height: 78
  }
});

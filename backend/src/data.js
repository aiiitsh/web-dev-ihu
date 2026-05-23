const seedPersonnel = [
  { pid: 1, name: 'Clint Eastwood', birth_year: 1930 },
  { pid: 2, name: 'Hilary Swank', birth_year: 1974 },
  { pid: 3, name: 'Morgan Freeman', birth_year: 1937 },
  { pid: 4, name: 'Brian De Palma', birth_year: 1940 },
  { pid: 5, name: 'Christopher Nolan', birth_year: 1970 },
  { pid: 6, name: 'Paul McCuigan', birth_year: null },
  { pid: 7, name: 'Mel Gibson', birth_year: 1956 },
  { pid: 8, name: 'Rudy Youngblood', birth_year: null },
  { pid: 9, name: 'Dalia Hernandez', birth_year: null },
  { pid: 10, name: 'Keith Gordon', birth_year: 1961 },
  { pid: 11, name: 'Andy Wachowski', birth_year: 1967 },
  { pid: 12, name: 'Larry Wachowski', birth_year: 1965 },
  { pid: 13, name: 'Bill Murray', birth_year: 1950 }
];

const seedMovies = [
  { mid: 1, title: 'Letters from Iwo Jima', rating: 9, year: 2006 },
  { mid: 2, title: 'Million Dollar Baby', rating: 8, year: 2004 },
  { mid: 3, title: 'Mystic River', rating: 8, year: 2003 },
  { mid: 4, title: 'The Black Dahlia', rating: 7, year: 2006 },
  { mid: 5, title: 'Insomnia', rating: 9, year: 2002 },
  { mid: 6, title: 'Lucky Number Slevin', rating: 6, year: 2006 },
  { mid: 7, title: 'The Singing Detective', rating: 6, year: 2003 },
  { mid: 8, title: 'Apocalypto', rating: 7, year: 2006 },
  { mid: 9, title: 'The Matrix', rating: 10, year: 1999 },
  { mid: 10, title: 'Groundhog day', rating: 9, year: 1993 },
  { mid: 11, title: 'In the Line of Fire', rating: 8, year: 1993 }
];

const seedDirects = [
  { pid: 1, mid: 1 },
  { pid: 1, mid: 2 },
  { pid: 1, mid: 3 },
  { pid: 4, mid: 4 },
  { pid: 5, mid: 5 },
  { pid: 6, mid: 6 },
  { pid: 7, mid: 8 },
  { pid: 10, mid: 7 },
  { pid: 11, mid: 9 },
  { pid: 12, mid: 9 }
];

const seedActs = [
  { pid: 1, mid: 2, role_name: 'Frankie Dunn' },
  { pid: 2, mid: 2, role_name: 'Maggie Fitzgerald' },
  { pid: 3, mid: 2, role_name: 'Eddie Scrap-Iron Dupris' },
  { pid: 2, mid: 4, role_name: 'Madeleine Cathcart Linscott' },
  { pid: 2, mid: 5, role_name: 'Ellie Burr' },
  { pid: 3, mid: 6, role_name: 'The Boss' },
  { pid: 8, mid: 8, role_name: 'Jaguar Paw' },
  { pid: 9, mid: 8, role_name: 'Seven' },
  { pid: 7, mid: 7, role_name: 'Dr. Gibbon' },
  { pid: 1, mid: 11, role_name: 'Frank Horrigan' },
  { pid: 13, mid: 10, role_name: 'Phil' }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createDatabase() {
  return {
    personnel: clone(seedPersonnel),
    movies: clone(seedMovies),
    directs: clone(seedDirects),
    acts: clone(seedActs)
  };
}

module.exports = {
  createDatabase,
  clone
};

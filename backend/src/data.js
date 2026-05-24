const seedPersonnel = [
  { pid: 1, name: 'Clint Eastwood', birth_year: 1930, photo_url: 'https://media.themoviedb.org/t/p/w185/8TwdCfeOZH7ucRlfLZ6wObxa7cO.jpg' },
  { pid: 2, name: 'Hilary Swank', birth_year: 1974, photo_url: 'https://media.themoviedb.org/t/p/w185/uin6aAehUGpPCiJCaSjZG8B7M7d.jpg' },
  { pid: 3, name: 'Morgan Freeman', birth_year: 1937, photo_url: 'https://media.themoviedb.org/t/p/w185/jPsLqiYGSofU4s6BjrxnefMfabb.jpg' },
  { pid: 4, name: 'Brian De Palma', birth_year: 1940, photo_url: 'https://media.themoviedb.org/t/p/w185/bWjOPDt8HRww5VAtpZ5FiCxpIxu.jpg' },
  { pid: 5, name: 'Christopher Nolan', birth_year: 1970, photo_url: 'https://media.themoviedb.org/t/p/w185/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg' },
  { pid: 6, name: 'Paul McGuigan', birth_year: null, photo_url: 'https://media.themoviedb.org/t/p/w185/8mvSSW9LWnORFvClg4sdHfM1zZJ.jpg' },
  { pid: 7, name: 'Mel Gibson', birth_year: 1956, photo_url: 'https://media.themoviedb.org/t/p/w185/jnqHMaOslt8cef2atSmOpGRvNla.jpg' },
  { pid: 8, name: 'Rudy Youngblood', birth_year: null, photo_url: 'https://media.themoviedb.org/t/p/w185/64HlxkHjgZ8oBxyosonWnSw2e9k.jpg' },
  { pid: 9, name: 'Dalia Hernandez', birth_year: null, photo_url: 'https://media.themoviedb.org/t/p/w185/9nA8P6CrQtwpQ8ejbnmDBaQNgPf.jpg' },
  { pid: 10, name: 'Keith Gordon', birth_year: 1961, photo_url: 'https://media.themoviedb.org/t/p/w185/yjtIRcZXzwNnJXNTyw1sVzdpWFU.jpg' },
  { pid: 11, name: 'Andy Wachowski', birth_year: 1967, photo_url: 'https://media.themoviedb.org/t/p/w185/5KuRHnoH8UkSCFHMKf4YjKOvzOM.jpg' },
  { pid: 12, name: 'Larry Wachowski', birth_year: 1965, photo_url: 'https://media.themoviedb.org/t/p/w185/rCScAjSpeKA19BLNR07MqNNeeTT.jpg' },
  { pid: 13, name: 'Bill Murray', birth_year: 1950, photo_url: 'https://media.themoviedb.org/t/p/w185/nnCsJc9x3ZiG3AFyiyc3FPehppy.jpg' }
];

const seedMovies = [
  { mid: 1, title: 'Letters from Iwo Jima', rating: 9, year: 2006, poster_url: 'https://media.themoviedb.org/t/p/w342/kZokxQtzMPURvijWYFuvh1fAvnv.jpg', backdrop_url: 'https://media.themoviedb.org/t/p/w780/69Mdg9vH6yQx08DwK02RlqO9CPp.jpg' },
  { mid: 2, title: 'Million Dollar Baby', rating: 8, year: 2004, poster_url: 'https://media.themoviedb.org/t/p/w342/jcfEqKdWF1zeyvECPqp3mkWLct2.jpg', backdrop_url: 'https://media.themoviedb.org/t/p/w780/oGMomeS7bE43eN8SGJUaKvQnmud.jpg' },
  { mid: 3, title: 'Mystic River', rating: 8, year: 2003, poster_url: 'https://media.themoviedb.org/t/p/w342/hCHVDbo6XJGj3r2i4hVjKhE0GKF.jpg', backdrop_url: 'https://media.themoviedb.org/t/p/w780/4ycpMe25LYpzGW42U9amyW9gM53.jpg' },
  { mid: 4, title: 'The Black Dahlia', rating: 7, year: 2006, poster_url: 'https://media.themoviedb.org/t/p/w342/su7yuXqGUHICfoijtcSaxWLE34Y.jpg', backdrop_url: 'https://media.themoviedb.org/t/p/w780/kkNO9F5siCFpCAiXnq2t68Kl8go.jpg' },
  { mid: 5, title: 'Insomnia', rating: 9, year: 2002, poster_url: 'https://media.themoviedb.org/t/p/w342/riVXh3EimGO0y5dgQxEWPRy5Itg.jpg', backdrop_url: 'https://media.themoviedb.org/t/p/w780/jU8MC5uSgBkZXyZYGtZgMsMsfeN.jpg' },
  { mid: 6, title: 'Lucky Number Slevin', rating: 6, year: 2006, poster_url: 'https://media.themoviedb.org/t/p/w342/x21s3p5wPww534nYj1cWakTcqz4.jpg', backdrop_url: 'https://media.themoviedb.org/t/p/w780/ShDHEWiJ4NL6ldn4W2m3bEkIBr.jpg' },
  { mid: 7, title: 'The Singing Detective', rating: 6, year: 2003, poster_url: 'https://media.themoviedb.org/t/p/w342/bjkLSHpV294HIllRpHKWkNICs3N.jpg', backdrop_url: 'https://media.themoviedb.org/t/p/w780/hU74yMO9p7UzVvpfCl7rEqA4XPw.jpg' },
  { mid: 8, title: 'Apocalypto', rating: 7, year: 2006, poster_url: 'https://media.themoviedb.org/t/p/w342/cRY25Q32kDNPFDkFkxAs6bgCq3L.jpg', backdrop_url: 'https://media.themoviedb.org/t/p/w780/nnmbJvYyDS1VkMOCbxSpdBi3WbJ.jpg' },
  { mid: 9, title: 'The Matrix', rating: 10, year: 1999, poster_url: 'https://media.themoviedb.org/t/p/w342/aOIuZAjPaRIE6CMzbazvcHuHXDc.jpg', backdrop_url: 'https://media.themoviedb.org/t/p/w780/tlm8UkiQsitc8rSuIAscQDCnP8d.jpg' },
  { mid: 10, title: 'Groundhog Day', rating: 9, year: 1993, poster_url: 'https://media.themoviedb.org/t/p/w342/gCgt1WARPZaXnq523ySQEUKinCs.jpg', backdrop_url: 'https://media.themoviedb.org/t/p/w780/4W6RYDNe4OByNryOCvJprrutm9h.jpg' },
  { mid: 11, title: 'In the Line of Fire', rating: 8, year: 1993, poster_url: 'https://media.themoviedb.org/t/p/w342/3NvOFpmyECI3DNExYMtFIRcGMsu.jpg', backdrop_url: 'https://media.themoviedb.org/t/p/w780/zYM9IbF08gB1Ip3Qee19HPvNY8T.jpg' }
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

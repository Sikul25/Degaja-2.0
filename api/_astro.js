import tzlookup from "tz-lookup";

// Geocodes a free-text place name ("Berlin, Germany") to coordinates using
// OpenStreetMap's free Nominatim API. No API key needed, but their usage
// policy requires an identifying User-Agent and caps us at ~1 req/sec,
// which is far more than this feature will ever see.
async function geocodePlace(place) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(place)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "DEGAJA/1.0 (cs@degaja.com)" },
      signal: controller.signal
    });
    if (!response.ok) return null;
    const results = await response.json();
    if (!Array.isArray(results) || !results.length) return null;
    return { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon) };
  } catch (error) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Parses an Intl "shortOffset" string ("GMT-4", "GMT+5:30") into minutes.
function offsetStringToMinutes(s) {
  const m = /GMT([+-]\d+)(?::(\d+))?/.exec(s || "");
  if (!m) return 0;
  const sign = m[1].startsWith("-") ? -1 : 1;
  const hours = Math.abs(parseInt(m[1], 10));
  const mins = m[2] ? parseInt(m[2], 10) : 0;
  return sign * (hours * 60 + mins);
}

// Resolves the UTC offset (in minutes) that applied in `timeZone` at the
// given local wall-clock date/time, correctly handling historical DST
// rules via Node's built-in ICU timezone database.
function getUtcOffsetMinutes(timeZone, year, month, day, hour, minute) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
  }).formatToParts(new Date(Date.UTC(year, month - 1, day, hour, minute)));
  const tzPart = parts.find(p => p.type === "timeZoneName");
  return offsetStringToMinutes(tzPart && tzPart.value);
}

function toJulianDay(year, month, day, hour, minute) {
  // Standard Julian Day from a UTC civil date/time (Meeus, ch. 7).
  let y = year, m = month;
  if (m <= 2) { y -= 1; m += 12; }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  const dayFraction = day + (hour + minute / 60) / 24;
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + dayFraction + b - 1524.5;
}

const DEG = Math.PI / 180;
const norm360 = deg => ((deg % 360) + 360) % 360;

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

function signFromEclipticLongitude(lonDeg) {
  return ZODIAC_SIGNS[Math.floor(norm360(lonDeg) / 30)];
}

// Moon's apparent ecliptic longitude using the 15 largest periodic terms of
// the ELP2000 lunar theory (Meeus, "Astronomical Algorithms", ch. 47,
// truncated). Accurate to well under a degree - more than precise enough to
// place the Moon in the correct zodiac sign, which is all this feature needs.
function moonEclipticLongitude(jd) {
  const T = (jd - 2451545.0) / 36525;
  const Lp = norm360(218.3164591 + 481267.88134236 * T - 0.0013268 * T * T);
  const D = norm360(297.8502042 + 445267.1115168 * T - 0.0016300 * T * T);
  const M = norm360(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T);
  const Mp = norm360(134.9634114 + 477198.8676313 * T + 0.0089970 * T * T);
  const F = norm360(93.2720993 + 483202.0175273 * T - 0.0034029 * T * T);

  const d = DEG;
  let lon = Lp
    + 6.289 * Math.sin(Mp * d)
    - 1.274 * Math.sin((Mp - 2 * D) * d)
    + 0.658 * Math.sin(2 * D * d)
    - 0.186 * Math.sin(M * d)
    - 0.059 * Math.sin((2 * Mp - 2 * D) * d)
    - 0.057 * Math.sin((Mp - 2 * D + M) * d)
    + 0.053 * Math.sin((Mp + 2 * D) * d)
    + 0.046 * Math.sin((2 * D - M) * d)
    + 0.041 * Math.sin((Mp - M) * d)
    - 0.035 * Math.sin(D * d)
    - 0.031 * Math.sin((Mp + M) * d)
    - 0.015 * Math.sin((2 * F - 2 * D) * d)
    + 0.011 * Math.sin((Mp - 4 * D) * d);

  return norm360(lon);
}

function ascendantEclipticLongitude(jd, latitudeDeg, longitudeDeg) {
  const T = (jd - 2451545.0) / 36525;
  const gmst = norm360(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T);
  const lst = norm360(gmst + longitudeDeg);
  const obliquity = 23.4392911 - 0.0130042 * T;

  const lstR = lst * DEG;
  const latR = latitudeDeg * DEG;
  const oblR = obliquity * DEG;

  const y = -Math.cos(lstR);
  const x = Math.sin(oblR) * Math.tan(latR) + Math.cos(oblR) * Math.sin(lstR);
  return norm360(Math.atan2(y, x) / DEG);
}

// Given a birth date/time/place, returns the English Moon sign and
// Ascendant (rising) sign, or null fields if the place couldn't be
// resolved. Approximate (sub-degree lunar theory, no atmospheric
// refraction correction on the ascendant) - framed as entertainment,
// like the rest of DEGAJA's readings, not a precision ephemeris.
export async function computeMoonAndAscendant({ birthDate, birthTime, birthPlace }) {
  try {
    const [year, month, day] = birthDate.split("-").map(Number);
    const [hour, minute] = (birthTime || "12:00").split(":").map(Number);
    if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) return null;

    const coords = await geocodePlace(birthPlace);
    if (!coords) return null;

    const timeZone = tzlookup(coords.lat, coords.lon);
    const offsetMinutes = getUtcOffsetMinutes(timeZone, year, month, day, hour, minute);

    const utcMinutesTotal = hour * 60 + minute - offsetMinutes;
    const utcDay = day + Math.floor(utcMinutesTotal / 1440);
    const utcHour = Math.floor(((utcMinutesTotal % 1440) + 1440) % 1440 / 60);
    const utcMinute = Math.round(((utcMinutesTotal % 60) + 60) % 60);

    const jd = toJulianDay(year, month, utcDay, utcHour, utcMinute);

    const moonSign = signFromEclipticLongitude(moonEclipticLongitude(jd));
    const ascendantSign = signFromEclipticLongitude(ascendantEclipticLongitude(jd, coords.lat, coords.lon));

    return { moonSign, ascendantSign };
  } catch (error) {
    return null;
  }
}

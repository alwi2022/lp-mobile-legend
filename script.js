const MAX_TEAM_SLOTS = 16;
const verifiedRegistrations = [];

const coreTeams = [
  { name: "ONIC Esports", short: "ONIC", captain: "Sanz", region: "Jakarta", status: "Unggulan", logoUrl: "" },
  { name: "Bigetron Alpha", short: "BTR", captain: "Moreno", region: "Bekasi", status: "Undangan", logoUrl: "" },
  { name: "EVOS Glory", short: "EVOS", captain: "Branz", region: "Jakarta", status: "Undangan", logoUrl: "" },
  { name: "Alter Ego", short: "AE", captain: "Nino", region: "Tangerang", status: "Inti", logoUrl: "" },
  { name: "Team Liquid ID", short: "TLID", captain: "Widy", region: "Bandung", status: "Inti", logoUrl: "" },
  { name: "Dewa United", short: "DEWA", captain: "Keyz", region: "Depok", status: "Inti", logoUrl: "" },
  { name: "Geek Fam", short: "GEEK", captain: "Caderaa", region: "Bogor", status: "Inti", logoUrl: "" },
  { name: "RRQ Hoshi", short: "RRQ", captain: "Skylar", region: "Jakarta", status: "Inti", logoUrl: "" },
];

const matches = [
  {
    event: "NLC Weekly #12",
    round: "Quarter Final",
    date: "2026-04-24T13:00:00+07:00",
    teamA: "ONIC Esports",
    teamB: "RRQ Hoshi",
    scoreA: 2,
    scoreB: 0,
    venue: "Main Stage",
  },
  {
    event: "NLC Weekly #12",
    round: "Quarter Final",
    date: "2026-04-24T16:00:00+07:00",
    teamA: "EVOS Glory",
    teamB: "Alter Ego",
    scoreA: 2,
    scoreB: 1,
    venue: "Main Stage",
  },
  {
    event: "NLC Weekly #12",
    round: "Quarter Final",
    date: "2026-04-25T13:00:00+07:00",
    teamA: "Bigetron Alpha",
    teamB: "Geek Fam",
    scoreA: 2,
    scoreB: 0,
    venue: "Main Stage",
  },
  {
    event: "NLC Weekly #12",
    round: "Quarter Final",
    date: "2026-04-25T16:00:00+07:00",
    teamA: "Team Liquid ID",
    teamB: "Dewa United",
    scoreA: 2,
    scoreB: 1,
    venue: "Main Stage",
  },
  {
    event: "NLC Weekly #12",
    round: "Semi Final",
    date: "2026-04-26T15:15:00+07:00",
    teamA: "ONIC Esports",
    teamB: "EVOS Glory",
    scoreA: null,
    scoreB: null,
    venue: "Main Stage",
  },
  {
    event: "NLC Weekly #12",
    round: "Semi Final",
    date: "2026-04-26T18:15:00+07:00",
    teamA: "Bigetron Alpha",
    teamB: "Team Liquid ID",
    scoreA: null,
    scoreB: null,
    venue: "Main Stage",
  },
  {
    event: "NLC Weekly #12",
    round: "Grand Final",
    date: "2026-04-27T19:00:00+07:00",
    teamA: "Pemenang Semi Final 1",
    teamB: "Pemenang Semi Final 2",
    scoreA: null,
    scoreB: null,
    venue: "Main Stage",
  },
];

const playoffRounds = [
  {
    title: "Quarter Final",
    matches: [
      { teamA: "ONIC Esports", teamB: "RRQ Hoshi", winner: "ONIC Esports" },
      { teamA: "EVOS Glory", teamB: "Alter Ego", winner: "EVOS Glory" },
      { teamA: "Bigetron Alpha", teamB: "Geek Fam", winner: "Bigetron Alpha" },
      { teamA: "Team Liquid ID", teamB: "Dewa United", winner: "Team Liquid ID" },
    ],
  },
  {
    title: "Semi Final",
    matches: [
      { teamA: "ONIC Esports", teamB: "EVOS Glory", winner: null },
      { teamA: "Bigetron Alpha", teamB: "Team Liquid ID", winner: null },
    ],
  },
  {
    title: "Grand Final",
    matches: [
      { teamA: "TBD", teamB: "TBD", winner: null },
    ],
  },
];

const liveStreams = [
  {
    id: "stream-1",
    youtubeId: "1uS8Gk8jb6M",
    title: "Semi Final 1",
    teamA: "ONIC Esports",
    teamB: "EVOS Glory",
    date: "26 April 2026, 15.15 WIB",
    status: "Live Soon",
  },
  {
    id: "stream-2",
    youtubeId: "hNpX0ceVoys",
    title: "Semi Final 2",
    teamA: "Bigetron Alpha",
    teamB: "Team Liquid ID",
    date: "26 April 2026, 18.15 WIB",
    status: "Upcoming",
  },
  {
    id: "stream-3",
    youtubeId: "-",
    title: "Grand Final",
    teamA: "Pemenang SF 1",
    teamB: "Pemenang SF 2",
    date: "27 April 2026, 19.00 WIB",
    status: "Upcoming",
  },
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getTeamShort(teamName) {
  const coreTeam = coreTeams.find((team) => team.name === teamName);
  if (coreTeam?.short) {
    return coreTeam.short;
  }

  return teamName
    .split(/\s+/)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase()
    .slice(0, 3);
}

function getTeamLogo(teamName, logoUrl = "") {
  if (logoUrl) {
    return logoUrl;
  }

  const coreTeam = coreTeams.find((team) => team.name === teamName);
  return coreTeam?.logoUrl || "";
}

function renderTeamIdentity(teamName, size = "", logoUrl = "") {
  const finalLogo = getTeamLogo(teamName, logoUrl);

  return `
    <span class="team-identity">
      <span class="team-logo-slot ${size}">
        ${
          finalLogo
            ? `<img src="${escapeHtml(finalLogo)}" alt="${escapeHtml(teamName)}">`
            : escapeHtml(getTeamShort(teamName))
        }
      </span>
      <span class="team-name">${escapeHtml(teamName)}</span>
    </span>
  `;
}

function renderMatchIdentity(teamA, teamB, label = "") {
  return `
    <span class="match-text-cell">
      ${label ? `<span class="table-meta-label">${escapeHtml(label)}</span>` : ""}
      <span class="match-text">
        <span class="team-name">${escapeHtml(teamA)}</span>
        <span class="match-separator">vs</span>
        <span class="team-name">${escapeHtml(teamB)}</span>
      </span>
    </span>
  `;
}

function getSlotsRemaining() {
  return Math.max(0, MAX_TEAM_SLOTS - coreTeams.length - verifiedRegistrations.length);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getMatchState(match) {
  if (match.scoreA !== null && match.scoreB !== null) {
    return { value: "finished", label: "Selesai", className: "finished" };
  }

  const matchTime = new Date(match.date).getTime();
  const now = Date.now();
  const sixHours = 6 * 60 * 60 * 1000;

  if (matchTime > now && matchTime - now <= sixHours) {
    return { value: "live", label: "Live Soon", className: "live" };
  }

  return { value: "upcoming", label: "Upcoming", className: "" };
}

function updateTeamStatus(map, teamName, position, status, order) {
  if (!teamName || teamName === "TBD") {
    return;
  }

  const current = map.get(teamName);

  if (!current || order < current.order) {
    map.set(teamName, {
      name: teamName,
      position,
      status,
      order,
    });
  }
}

function getTournamentStatuses() {
  const statusMap = new Map();

  coreTeams.forEach((team) => {
    statusMap.set(team.name, {
      name: team.name,
      position: "Top 8",
      status: "Masuk bracket utama",
      order: 4,
    });
  });

  playoffRounds.forEach((round) => {
    round.matches.forEach((match) => {
      if (round.title === "Quarter Final") {
        updateTeamStatus(statusMap, match.teamA, "Top 8", "Main di Quarter Final", 4);
        updateTeamStatus(statusMap, match.teamB, "Top 8", "Main di Quarter Final", 4);
      }

      if (round.title === "Semi Final") {
        updateTeamStatus(statusMap, match.teamA, "Top 4", "Lolos ke Semi Final", 3);
        updateTeamStatus(statusMap, match.teamB, "Top 4", "Lolos ke Semi Final", 3);
      }

      if (round.title === "Grand Final") {
        updateTeamStatus(statusMap, match.teamA, "Finalist", "Lolos ke Grand Final", 2);
        updateTeamStatus(statusMap, match.teamB, "Finalist", "Lolos ke Grand Final", 2);
      }

      if (!match.winner) {
        return;
      }

      const loser = match.winner === match.teamA ? match.teamB : match.teamA;

      if (round.title === "Quarter Final") {
        updateTeamStatus(statusMap, loser, "Top 8", "Tereliminasi di Quarter Final", 4);
      }

      if (round.title === "Semi Final") {
        updateTeamStatus(statusMap, loser, "Top 4", "Tereliminasi di Semi Final", 3);
      }

      if (round.title === "Grand Final") {
        updateTeamStatus(statusMap, match.winner, "Juara", "Menang di Grand Final", 1);
        updateTeamStatus(statusMap, loser, "Runner-up", "Kalah di Grand Final", 2);
      }
    });
  });

  return [...statusMap.values()].sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.name.localeCompare(right.name, "id-ID");
  });
}

function updateRegistrationSummary() {
  const remaining = getSlotsRemaining();
  const slotSummary = document.querySelector("#slot-summary");

  slotSummary.textContent = remaining <= 0 ? "Slot penuh" : `Masih tersedia ${remaining} slot`;
}

function renderHeroSummary() {
  const nextMatch = [...matches]
    .filter((match) => match.scoreA === null && new Date(match.date).getTime() > Date.now())
    .sort((left, right) => new Date(left.date) - new Date(right.date))[0];

  document.querySelector("#slot-total").textContent = MAX_TEAM_SLOTS;
  document.querySelector("#slot-remaining").textContent = getSlotsRemaining();

  if (!nextMatch) {
    document.querySelector("#hero-next-match").textContent = "Semua match demo sudah selesai";
    document.querySelector("#hero-next-date").textContent = "Silakan update jadwal baru";
    return;
  }

  document.querySelector("#hero-next-match").textContent = `${nextMatch.teamA} vs ${nextMatch.teamB}`;
  document.querySelector("#hero-next-date").textContent = formatDate(nextMatch.date);
}

function renderScheduleFilters() {
  const eventSelect = document.querySelector("#event-filter");
  const statusSelect = document.querySelector("#status-filter");
  const eventNames = [...new Set(matches.map((match) => match.event).filter(Boolean))];

  eventSelect.innerHTML = '<option value="all">Semua pekan</option>';

  eventNames.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    eventSelect.append(option);
  });

  statusSelect.innerHTML = `
    <option value="all">Semua status</option>
    <option value="upcoming">Upcoming</option>
    <option value="live">Live Soon</option>
    <option value="finished">Selesai</option>
  `;
}

function getActiveScheduleFilters() {
  return {
    event: document.querySelector("#event-filter")?.value || "all",
    status: document.querySelector("#status-filter")?.value || "all",
  };
}

function renderSchedule(filters = getActiveScheduleFilters()) {
  const body = document.querySelector("#schedule-body");
  const visibleMatches = matches
    .map((match) => ({
      match,
      state: getMatchState(match),
    }))
    .filter(({ match, state }) => {
      const eventMatch = filters.event === "all" || match.event === filters.event;
      const statusMatch = filters.status === "all" || state.value === filters.status;

      return eventMatch && statusMatch;
    });

  if (!visibleMatches.length) {
    body.innerHTML = '<tr><td colspan="6">Belum ada jadwal untuk pekan atau status yang dipilih.</td></tr>';
    return;
  }

  body.innerHTML = visibleMatches
    .map(({ match, state }) => {
      const score = match.scoreA === null ? "-" : `${match.scoreA} - ${match.scoreB}`;

      return `
        <tr>
          <td>${escapeHtml(formatDate(match.date))}</td>
          <td>${renderMatchIdentity(match.teamA, match.teamB)}</td>
          <td>${escapeHtml(match.round)}</td>
          <td>${escapeHtml(match.venue)}</td>
          <td>${escapeHtml(score)}</td>
          <td><span class="status-chip ${state.className}">${escapeHtml(state.label)}</span></td>
        </tr>
      `;
    })
    .join("");
}

function renderStandings() {
  const body = document.querySelector("#standings-body");
  const statuses = getTournamentStatuses();

  body.innerHTML = statuses
    .map((team) => {
      return `
        <tr>
          <td>${renderTeamIdentity(team.name)}</td>
          <td>${escapeHtml(team.position)}</td>
          <td>${escapeHtml(team.status)}</td>
        </tr>
      `;
    })
    .join("");
}

function renderBracket() {
  // Bracket sekarang ditanam statis di index.html agar garis dan posisi tetap rapi.
}

function renderCoreTeams() {
  const body = document.querySelector("#core-team-body");

  body.innerHTML = coreTeams
    .map((team) => {
      return `
        <tr>
          <td>${renderTeamIdentity(team.name)}</td>
          <td>${escapeHtml(team.captain)}</td>
          <td>${escapeHtml(team.region)}</td>
          <td>${escapeHtml(team.status)}</td>
        </tr>
      `;
    })
    .join("");
}

function renderRegistrationTeams() {
  const body = document.querySelector("#registration-body");

  if (!verifiedRegistrations.length) {
    body.innerHTML = `
      <tr>
        <td colspan="4">Belum ada tim pendaftar yang ditampilkan. Setelah Google Form dicek panitia, data bisa diperbarui di sini.</td>
      </tr>
    `;
    return;
  }

  body.innerHTML = verifiedRegistrations
    .map((team) => {
      return `
        <tr>
          <td>${renderTeamIdentity(team.teamName)}</td>
          <td>${escapeHtml(team.captainName)}</td>
          <td>${escapeHtml(team.region)}</td>
          <td>${escapeHtml(team.contact)}</td>
        </tr>
      `;
    })
    .join("");
}

function setFeaturedStream(streamId) {
  const selectedStream = liveStreams.find((stream) => stream.id === streamId) || liveStreams[0];

  document.querySelector("#featured-stream-frame").src =
    `https://www.youtube.com/embed/${encodeURIComponent(selectedStream.youtubeId)}`;
  document.querySelector("#featured-stream-title").textContent = selectedStream.title;
  document.querySelector("#featured-stream-date").textContent = selectedStream.date;
  document.querySelector("#featured-stream-match").textContent =
    `${selectedStream.teamA} vs ${selectedStream.teamB}`;
  document.querySelector("#featured-stream-status").textContent = selectedStream.status;
  document.querySelector("#featured-stream-status").className =
    `status-chip ${selectedStream.status === "Live Soon" ? "live" : ""}`.trim();

  document.querySelectorAll("[data-stream-switch]").forEach((button) => {
    button.classList.toggle("active", button.dataset.streamSwitch === selectedStream.id);
  });
}

function renderLiveTable() {
  const body = document.querySelector("#live-body");

  body.innerHTML = liveStreams
    .map((stream, index) => {
      return `
        <tr>
          <td>${renderMatchIdentity(stream.teamA, stream.teamB, stream.title)}</td>
          <td>${escapeHtml(stream.date)}</td>
          <td><span class="status-chip ${index === 0 ? "live" : ""}">${escapeHtml(stream.status)}</span></td>
          <td>
            <button
              class="action-button ${index === 0 ? "active" : ""}"
              type="button"
              data-stream-switch="${escapeHtml(stream.id)}"
            >
              Tampilkan
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  document.querySelectorAll("[data-stream-switch]").forEach((button) => {
    button.addEventListener("click", () => {
      setFeaturedStream(button.dataset.streamSwitch);
    });
  });

  setFeaturedStream(liveStreams[0].id);
}

function setupNavToggle() {
  const toggle = document.querySelector("#nav-toggle");
  const nav = document.querySelector("#site-nav");

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("open", !expanded);
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function initialize() {
  renderHeroSummary();
  renderScheduleFilters();
  renderSchedule();
  renderStandings();
  renderBracket();
  renderCoreTeams();
  renderRegistrationTeams();
  renderLiveTable();
  updateRegistrationSummary();
  setupNavToggle();

  ["#event-filter", "#status-filter"].forEach((selector) => {
    document.querySelector(selector).addEventListener("change", () => {
      renderSchedule(getActiveScheduleFilters());
    });
  });
}

document.addEventListener("DOMContentLoaded", initialize);

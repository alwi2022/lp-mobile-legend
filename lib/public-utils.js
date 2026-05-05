export function getTeamShort(teamName, teams) {
  const coreTeam = teams.find((team) => team.name === teamName);

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

export function getTeamLogo(teamName, teams, logoUrl = "") {
  if (logoUrl) {
    return logoUrl;
  }

  const coreTeam = teams.find((team) => team.name === teamName);
  return coreTeam?.logoUrl || "";
}

export function formatDate(date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getMatchState(match, now = Date.now()) {
  if (match.status === "cancelled") {
    return { value: "finished", label: "Dibatalkan", className: "finished" };
  }

  if (match.status === "finished") {
    return { value: "finished", label: "Selesai", className: "finished" };
  }

  if (match.status === "live") {
    return { value: "live", label: "Sedang Tayang", className: "live" };
  }

  if (match.scoreA !== null && match.scoreB !== null) {
    return { value: "finished", label: "Selesai", className: "finished" };
  }

  const matchTime = new Date(match.date).getTime();
  const sixHours = 6 * 60 * 60 * 1000;

  if (matchTime > now && matchTime - now <= sixHours) {
    return { value: "live", label: "Segera Tayang", className: "live" };
  }

  return { value: "upcoming", label: "Akan Datang", className: "" };
}

export function getSlotsRemaining(maxTeamSlots, teams, registrations) {
  return Math.max(0, maxTeamSlots - teams.length - registrations.length);
}

function isPlaceholderTeamName(teamName) {
  if (!teamName) {
    return true;
  }

  return /^(tbd|pemenang|winner|loser)/i.test(teamName);
}

function getRoundMeta(roundName = "") {
  const normalized = roundName.toLowerCase();

  if (normalized.includes("grand final") || normalized === "final") {
    return {
      position: "Finalist",
      activeStatus: "Lolos ke Grand Final",
      eliminatedPosition: "Juara 2",
      eliminatedStatus: "Kalah di Grand Final",
      order: 2,
      isGrandFinal: true,
    };
  }

  if (normalized.includes("semi")) {
    return {
      position: "Top 4",
      activeStatus: "Lolos ke Semi Final",
      eliminatedPosition: "Top 4",
      eliminatedStatus: "Tereliminasi di Semi Final",
      order: 3,
      isGrandFinal: false,
    };
  }

  if (normalized.includes("quarter")) {
    return {
      position: "Top 8",
      activeStatus: "Main di Quarter Final",
      eliminatedPosition: "Top 8",
      eliminatedStatus: "Tereliminasi di Quarter Final",
      order: 4,
      isGrandFinal: false,
    };
  }

  return {
    position: roundName || "Bracket",
    activeStatus: roundName ? `Main di ${roundName}` : "Masuk bracket utama",
    eliminatedPosition: roundName || "Bracket",
    eliminatedStatus: roundName ? `Tereliminasi di ${roundName}` : "Tereliminasi",
    order: 5,
    isGrandFinal: false,
  };
}

function updateTeamStatus(map, teamName, position, status, order) {
  if (isPlaceholderTeamName(teamName)) {
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

function getMatchWinnerAndLoser(match) {
  if (match.status && match.status !== "finished") {
    return null;
  }

  if (
    typeof match.scoreA === "number" &&
    typeof match.scoreB === "number" &&
    match.scoreA !== match.scoreB
  ) {
    return match.scoreA > match.scoreB
      ? { winner: match.teamA, loser: match.teamB }
      : { winner: match.teamB, loser: match.teamA };
  }

  return null;
}

export function getTournamentStatuses(teams, matches) {
  const statusMap = new Map();

  teams.forEach((team) => {
    statusMap.set(team.name, {
      name: team.name,
      position: "Tim Resmi",
      status: "Sudah diapprove panitia",
      order: 6,
    });
  });

  matches.forEach((match) => {
    const roundMeta = getRoundMeta(match.round);

    updateTeamStatus(
      statusMap,
      match.teamA,
      roundMeta.position,
      roundMeta.activeStatus,
      roundMeta.order,
    );
    updateTeamStatus(
      statusMap,
      match.teamB,
      roundMeta.position,
      roundMeta.activeStatus,
      roundMeta.order,
    );

    const result = getMatchWinnerAndLoser(match);

    if (!result) {
      return;
    }

    if (roundMeta.isGrandFinal) {
      updateTeamStatus(statusMap, result.winner, "Juara", "Menang di Grand Final", 1);
      updateTeamStatus(statusMap, result.loser, "Juara 2", "Kalah di Grand Final", 2);
      return;
    }

    updateTeamStatus(
      statusMap,
      result.loser,
      roundMeta.eliminatedPosition,
      roundMeta.eliminatedStatus,
      roundMeta.order,
    );
  });

  teams.forEach((team) => {
    if (team.placement === 1 || team.teamStatus === "champion") {
      updateTeamStatus(statusMap, team.name, "Juara", "Menang di Grand Final", 1);
      return;
    }

    if (team.placement === 2) {
      updateTeamStatus(statusMap, team.name, "Juara 2", "Kalah di Grand Final", 2);
      return;
    }

    if (team.teamStatus === "eliminated") {
      const roundMeta = getRoundMeta(team.eliminatedRound);
      updateTeamStatus(
        statusMap,
        team.name,
        roundMeta.eliminatedPosition,
        team.eliminatedRound
          ? `Tereliminasi di ${team.eliminatedRound}`
          : "Tereliminasi",
        roundMeta.order,
      );
    }
  });

  return [...statusMap.values()].sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.name.localeCompare(right.name, "id-ID");
  });
}

export function getTeamRankingRows(teams, matches) {
  const rankingMap = new Map();

  teams.forEach((team) => {
    rankingMap.set(team.name, {
      name: team.name,
      matchWins: 0,
      matchLosses: 0,
      gameWins: 0,
      gameLosses: 0,
      matchPoints: 0,
      netGameWin: 0,
    });
  });

  matches.forEach((match) => {
    if (
      isPlaceholderTeamName(match.teamA) ||
      isPlaceholderTeamName(match.teamB) ||
      typeof match.scoreA !== "number" ||
      typeof match.scoreB !== "number" ||
      match.scoreA === match.scoreB
    ) {
      return;
    }

    const teamA = rankingMap.get(match.teamA);
    const teamB = rankingMap.get(match.teamB);

    if (!teamA || !teamB) {
      return;
    }

    teamA.gameWins += match.scoreA;
    teamA.gameLosses += match.scoreB;
    teamB.gameWins += match.scoreB;
    teamB.gameLosses += match.scoreA;

    if (match.scoreA > match.scoreB) {
      teamA.matchWins += 1;
      teamA.matchPoints += 1;
      teamB.matchLosses += 1;
      return;
    }

    teamB.matchWins += 1;
    teamB.matchPoints += 1;
    teamA.matchLosses += 1;
  });

  return [...rankingMap.values()]
    .map((row) => ({
      ...row,
      netGameWin: row.gameWins - row.gameLosses,
    }))
    .sort((left, right) => {
      if (left.matchPoints !== right.matchPoints) {
        return right.matchPoints - left.matchPoints;
      }

      if (left.matchWins !== right.matchWins) {
        return right.matchWins - left.matchWins;
      }

      if (left.netGameWin !== right.netGameWin) {
        return right.netGameWin - left.netGameWin;
      }

      if (left.gameWins !== right.gameWins) {
        return right.gameWins - left.gameWins;
      }

      return left.name.localeCompare(right.name, "id-ID");
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
}

export function getNextMatch(allMatches, now = Date.now()) {
  const liveMatch = [...allMatches]
    .filter((match) => match.status === "live")
    .sort((left, right) => new Date(left.date) - new Date(right.date))[0];

  if (liveMatch) {
    return liveMatch;
  }

  return [...allMatches]
    .filter((match) => {
      if (match.status === "finished" || match.status === "cancelled") {
        return false;
      }

      if (match.scoreA !== null) {
        return false;
      }

      return new Date(match.date).getTime() > now;
    })
    .sort((left, right) => new Date(left.date) - new Date(right.date))[0];
}

export function getEventNames(allMatches) {
  return [...new Set(allMatches.map((match) => match.event).filter(Boolean))];
}

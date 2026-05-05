const ROUND_ONE_POSITIONS = [
  { left: 40, top: 54 },
  { left: 40, top: 164 },
  { left: 40, top: 348 },
  { left: 40, top: 458 },
  { left: 40, top: 642 },
  { left: 40, top: 752 },
  { left: 40, top: 936 },
  { left: 40, top: 1046 },
];

const ROUND_TWO_POSITIONS = [
  { left: 470, top: 109, variant: "winner" },
  { left: 470, top: 403, variant: "winner" },
  { left: 470, top: 697, variant: "winner" },
  { left: 470, top: 991, variant: "winner" },
];

const ROUND_THREE_POSITIONS = [
  { left: 900, top: 256 },
  { left: 900, top: 844 },
];

const CHAMPION_POSITION = { left: 1325, top: 550, variant: "champion" };

function withString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getRelationName(value) {
  if (Array.isArray(value)) {
    return withString(value[0]?.name, "");
  }

  return withString(value?.name, "");
}

function groupMatchesByRound(matches) {
  const groups = [];
  const groupMap = new Map();

  for (const match of matches || []) {
    if (!groupMap.has(match.round_number)) {
      const group = {
        roundNumber: match.round_number,
        roundName: withString(match.round_name, `Ronde ${match.round_number}`),
        matches: [],
      };

      groupMap.set(match.round_number, group);
      groups.push(group);
    }

    groupMap.get(match.round_number).matches.push(match);
  }

  return groups
    .map((group) => ({
      ...group,
      matches: group.matches.sort((left, right) => left.match_number - right.match_number),
    }))
    .sort((left, right) => left.roundNumber - right.roundNumber);
}

function createPlaceholderPreview(basePreview) {
  return {
    ...basePreview,
    cards: [
      ...ROUND_ONE_POSITIONS.map((position, index) => ({
        id: `placeholder-round-1-${index + 1}`,
        label: "Belum diatur",
        left: position.left,
        top: position.top,
        variant: "",
      })),
      ...ROUND_TWO_POSITIONS.map((position, index) => ({
        id: `placeholder-round-2-${index + 1}`,
        label: "Belum diatur",
        left: position.left,
        top: position.top,
        variant: position.variant || "",
      })),
      ...ROUND_THREE_POSITIONS.map((position, index) => ({
        id: `placeholder-round-3-${index + 1}`,
        label: "Belum diatur",
        left: position.left,
        top: position.top,
        variant: "",
      })),
      {
        id: "placeholder-champion",
        label: "Juara",
        left: CHAMPION_POSITION.left,
        top: CHAMPION_POSITION.top,
        variant: CHAMPION_POSITION.variant,
      },
    ],
  };
}

function findPreviewRounds(matches) {
  const groups = groupMatchesByRound(matches);

  for (let index = 0; index <= groups.length - 3; index += 1) {
    const slice = groups.slice(index, index + 3);
    const counts = slice.map((group) => group.matches.length).join(",");

    if (counts === "4,2,1") {
      return slice;
    }
  }

  return null;
}

function buildSourceLabel(slot) {
  if (!slot?.source_match) {
    return "";
  }

  const baseName =
    withString(slot.source_match.round_name) ||
    (slot.source_match.match_number ? `Pertandingan ${slot.source_match.match_number}` : "");

  if (!baseName) {
    return "";
  }

  return slot.source_outcome === "loser" ? `Kalah dari ${baseName}` : `Pemenang ${baseName}`;
}

function buildInferredMatchLabel(match, side) {
  return "Belum diatur";
}

function getSlotLabel(match, slotMap, side) {
  const slot = slotMap[match.id]?.[side] || null;
  const relationName =
    side === "team_a" ? getRelationName(match.team_a) : getRelationName(match.team_b);
  const placeholder =
    side === "team_a"
      ? withString(match.team_a_placeholder, "")
      : withString(match.team_b_placeholder, "");

  return (
    getRelationName(slot?.team) ||
    withString(slot?.display_label, "") ||
    relationName ||
    placeholder ||
    buildSourceLabel(slot) ||
    buildInferredMatchLabel(match, side)
  );
}

function buildRoundCards(matches, slotMap, positions, prefix, variantOverride = "") {
  const cards = [];

  matches.forEach((match, matchIndex) => {
    const firstPosition = positions[matchIndex * 2];
    const secondPosition = positions[matchIndex * 2 + 1];

    if (firstPosition) {
      cards.push({
        id: `${prefix}-${match.id}-team-a`,
        label: getSlotLabel(match, slotMap, "team_a"),
        left: firstPosition.left,
        top: firstPosition.top,
        variant: variantOverride || firstPosition.variant || "",
      });
    }

    if (secondPosition) {
      cards.push({
        id: `${prefix}-${match.id}-team-b`,
        label: getSlotLabel(match, slotMap, "team_b"),
        left: secondPosition.left,
        top: secondPosition.top,
        variant: variantOverride || secondPosition.variant || "",
      });
    }
  });

  return cards;
}

function buildChampionCard(finalMatch) {
  const championLabel = getRelationName(finalMatch?.winner_team) || "TBD";

  return {
    id: `champion-${finalMatch?.id || "preview"}`,
    label: championLabel,
    left: CHAMPION_POSITION.left,
    top: CHAMPION_POSITION.top,
    variant: CHAMPION_POSITION.variant,
  };
}

export function buildBracketPreviewFromData(basePreview, matches, slots) {
  const previewRounds = findPreviewRounds(matches);

  if (!previewRounds) {
    return createPlaceholderPreview(basePreview);
  }

  const [roundOne, roundTwo, roundThree] = previewRounds;
  const slotMap = (slots || []).reduce((accumulator, slot) => {
    if (!accumulator[slot.match_id]) {
      accumulator[slot.match_id] = {};
    }

    accumulator[slot.match_id][slot.slot_side] = slot;
    return accumulator;
  }, {});

  const cards = [
    ...buildRoundCards(roundOne.matches, slotMap, ROUND_ONE_POSITIONS, "round-1"),
    ...buildRoundCards(roundTwo.matches, slotMap, ROUND_TWO_POSITIONS, "round-2", "winner"),
    ...buildRoundCards(roundThree.matches, slotMap, ROUND_THREE_POSITIONS, "round-3"),
    buildChampionCard(roundThree.matches[0]),
  ];

  return {
    ...basePreview,
    cards,
  };
}

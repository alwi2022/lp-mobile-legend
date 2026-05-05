import { AdminStatusBadge } from "../../../components/admin/admin-shell";
import styles from "../../../components/admin/admin-shell.module.css";
import {
  BEST_OF_OPTIONS,
  MATCH_STATUS_OPTIONS,
} from "../../../lib/admin/matches";

function FormGroup({ title, description, children }) {
  return (
    <section className={styles.formGroup}>
      <div className={styles.formGroupHeader}>
        <h4 className={styles.formGroupTitle}>{title}</h4>
        {description ? <p className={styles.formGroupCopy}>{description}</p> : null}
      </div>
      <div className={styles.formGrid}>{children}</div>
    </section>
  );
}

const SIMPLE_ROUND_OPTIONS = [
  { value: "1|Quarter Final", label: "Quarter Final" },
  { value: "2|Semi Final", label: "Semi Final" },
  { value: "3|Grand Final", label: "Grand Final" },
  { value: "1|Ronde 1", label: "Ronde 1" },
  { value: "2|Ronde 2", label: "Ronde 2" },
  { value: "3|Ronde 3", label: "Ronde 3" },
];

function getRoundPresetDefault(match) {
  if (!match) {
    return SIMPLE_ROUND_OPTIONS[0].value;
  }

  const currentValue = `${match.round_number}|${match.round_name}`;
  return SIMPLE_ROUND_OPTIONS.some((option) => option.value === currentValue)
    ? currentValue
    : currentValue;
}

export function MatchStatusPill({ value }) {
  const config = {
    scheduled: { label: "terjadwal", tone: "info" },
    live: { label: "berlangsung", tone: "success" },
    finished: { label: "selesai", tone: "neutral" },
    cancelled: { label: "dibatalkan", tone: "danger" },
    void: { label: "tidak sah", tone: "warning" },
  }[String(value)] || {
    label: String(value).replaceAll("_", " "),
    tone: "neutral",
  };

  return <AdminStatusBadge label={config.label} tone={config.tone} />;
}

export function formatInputDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (segment) => String(segment).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function TeamSelect({ name, teams, defaultValue = "" }) {
  return (
    <select className={styles.select} name={name} defaultValue={defaultValue}>
      <option value="">Belum dipilih</option>
      {teams.map((team) => (
        <option key={team.id} value={team.id}>
          {team.option_label}
        </option>
      ))}
    </select>
  );
}

function WinnerChoiceSelect({ match, name, defaultValue = "" }) {
  const options = [];

  if (match.team_a_id) {
    options.push({
      value: "team_a",
      label: match.team_a_name || "Tim A",
    });
  }

  if (match.team_b_id) {
    options.push({
      value: "team_b",
      label: match.team_b_name || "Tim B",
    });
  }

  return (
    <select className={styles.select} name={name} defaultValue={defaultValue}>
      <option value="">Belum ada pemenang</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function MatchFormFields({ match = null, teams }) {
  const roundPresetDefault = getRoundPresetDefault(match);
  const hasCustomRound = match
    ? !SIMPLE_ROUND_OPTIONS.some((option) => option.value === roundPresetDefault)
    : false;

  return (
    <div className={styles.stack}>
      <input type="hidden" name="stage_name" value={match?.stage_name || "Bracket Utama"} />
      <input type="hidden" name="match_number" value={String(match?.match_number || 1)} />
      <input type="hidden" name="team_a_placeholder" value={match?.team_a_placeholder || ""} />
      <input type="hidden" name="team_b_placeholder" value={match?.team_b_placeholder || ""} />
      <input type="hidden" name="notes" value={match?.notes || ""} />

      <FormGroup
        title="Data Match"
        description="Cukup isi ronde, nomor match, jam main, dan dua tim."
      >
        <label className={styles.field}>
          Ronde
          <select className={styles.select} name="round_preset" defaultValue={roundPresetDefault}>
            {hasCustomRound ? (
              <option value={roundPresetDefault}>{match.round_name}</option>
            ) : null}
            {SIMPLE_ROUND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          Jam Main
          <input
            className={styles.input}
            type="datetime-local"
            name="scheduled_at"
            defaultValue={formatInputDateTime(match?.scheduled_at)}
          />
        </label>

        <label className={styles.field}>
          Tim A
          <TeamSelect name="team_a_id" teams={teams} defaultValue={match?.team_a_id || ""} />
        </label>

        <label className={styles.field}>
          Tim B
          <TeamSelect name="team_b_id" teams={teams} defaultValue={match?.team_b_id || ""} />
        </label>

        <label className={styles.field}>
          Best Of
          <select
            className={styles.select}
            name="best_of"
            defaultValue={String(match?.best_of || 3)}
          >
            {BEST_OF_OPTIONS.map((option) => (
              <option key={option} value={String(option)}>
                BO{option}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          Status
          <select
            className={styles.select}
            name="status"
            defaultValue={match?.status || "scheduled"}
          >
            {MATCH_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </FormGroup>
    </div>
  );
}

function getWinnerChoice(match, game) {
  if (!game?.winner_team_id) {
    return "";
  }

  if (game.winner_team_id === match.team_a_id) {
    return "team_a";
  }

  if (game.winner_team_id === match.team_b_id) {
    return "team_b";
  }

  return "";
}

function getMatchWinnerChoice(match) {
  if (!match?.winner_team_id) {
    return "";
  }

  if (match.winner_team_id === match.team_a_id) {
    return "team_a";
  }

  if (match.winner_team_id === match.team_b_id) {
    return "team_b";
  }

  return "";
}

export function MatchResultFormFields({ match }) {
  return (
    <div className={styles.formGrid}>
      <label className={styles.field}>
        Skor Tim A
        <input
          className={styles.input}
          type="number"
          min="0"
          name="score_a_total"
          defaultValue={match.score_a_total ?? 0}
          required
        />
      </label>

      <label className={styles.field}>
        Skor Tim B
        <input
          className={styles.input}
          type="number"
          min="0"
          name="score_b_total"
          defaultValue={match.score_b_total ?? 0}
          required
        />
      </label>

      <label className={styles.field}>
        Pemenang Match
        <WinnerChoiceSelect
          match={match}
          name="winner_choice"
          defaultValue={getMatchWinnerChoice(match)}
        />
      </label>
    </div>
  );
}

export function GameFormFields({ match, game = null }) {
  return (
    <div className={styles.formGrid}>
      <input type="hidden" name="game_status" value="finished" />
      <input type="hidden" name="started_at" value="" />
      <input type="hidden" name="ended_at" value="" />
      <input type="hidden" name="game_notes" value={game?.notes || ""} />

      <label className={styles.field}>
        Game Ke
        <input
          className={styles.input}
          type="number"
          min="1"
          name="game_number"
          defaultValue={String(game?.game_number || match.next_game_number)}
          required
        />
      </label>

      <label className={styles.field}>
        Skor Tim A
        <input
          className={styles.input}
          type="number"
          min="0"
          name="team_a_score"
          defaultValue={game?.team_a_score ?? ""}
          required
        />
      </label>

      <label className={styles.field}>
        Skor Tim B
        <input
          className={styles.input}
          type="number"
          min="0"
          name="team_b_score"
          defaultValue={game?.team_b_score ?? ""}
          required
        />
      </label>

      <label className={styles.field}>
        Pemenang Game
        <WinnerChoiceSelect
          match={match}
          name="winner_choice"
          defaultValue={getWinnerChoice(match, game)}
        />
      </label>
    </div>
  );
}

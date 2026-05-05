"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import {
  formatDate,
  getEventNames,
  getMatchState,
  getNextMatch,
  getTeamRankingRows,
  getTeamLogo,
  getTeamShort,
} from "../../lib/public-utils";

function formatDateOnly(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getTournamentDateLabel(tournament, siteSettings) {
  if (tournament?.kickoff_at && tournament?.grand_final_at) {
    return `${formatDateOnly(tournament.kickoff_at)} - ${formatDateOnly(tournament.grand_final_at)}`;
  }

  if (tournament?.kickoff_at) {
    return formatDateOnly(tournament.kickoff_at);
  }

  return siteSettings.register.kickoffMatch;
}

function getRegistrationStatus(tournament, remainingSlots) {
  if (remainingSlots <= 0) {
    return "Slot penuh / daftar tunggu";
  }

  if (tournament?.status === "registration_open") {
    return "Pendaftaran dibuka";
  }

  if (tournament?.status === "registration_closed") {
    return "Pendaftaran ditutup";
  }

  return "Menunggu verifikasi panitia";
}

function getUpcomingMatches(matches, limit = 3, now = Date.now()) {
  const liveMatches = matches
    .filter((match) => match.status === "live")
    .sort((left, right) => new Date(left.date) - new Date(right.date));

  const upcomingMatches = matches
    .filter((match) => {
      if (match.status === "finished" || match.status === "cancelled") {
        return false;
      }

      if (match.scoreA !== null && match.scoreB !== null) {
        return false;
      }

      return new Date(match.date).getTime() >= now;
    })
    .sort((left, right) => new Date(left.date) - new Date(right.date));

  const combined = [...liveMatches, ...upcomingMatches];
  const deduped = combined.filter(
    (match, index) =>
      combined.findIndex((item) => item.id === match.id || `${item.date}-${item.teamA}-${item.teamB}` === `${match.date}-${match.teamA}-${match.teamB}`) === index,
  );

  if (deduped.length >= limit) {
    return deduped.slice(0, limit);
  }

  const fallbackMatches = matches
    .slice()
    .sort((left, right) => new Date(left.date) - new Date(right.date));

  return fallbackMatches.slice(0, limit);
}

function getFeaturedStream(liveStreams) {
  return liveStreams[0] || null;
}

function groupMatchesByRound(matches) {
  const grouped = new Map();

  for (const match of matches) {
    const key = `${match.roundNumber}-${match.round}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        roundNumber: match.roundNumber || 0,
        roundName: match.round,
        matches: [],
      });
    }

    grouped.get(key).matches.push(match);
  }

  return [...grouped.values()].sort((left, right) => left.roundNumber - right.roundNumber);
}

function TeamIdentity({ teamName, teams, size = "", logoUrl = "" }) {
  const finalLogo = getTeamLogo(teamName, teams, logoUrl);
  const slotClassName = ["team-logo-slot", size].filter(Boolean).join(" ");

  return (
    <span className="team-identity">
      <span className={slotClassName}>
        {finalLogo ? <img src={finalLogo} alt={teamName} /> : getTeamShort(teamName, teams)}
      </span>
      <span className="team-name">{teamName}</span>
    </span>
  );
}

function MatchIdentity({ teamA, teamB, label = "" }) {
  return (
    <span className="match-text-cell">
      {label ? <span className="table-meta-label">{label}</span> : null}
      <span className="match-text">
        <span className="team-name">{teamA}</span>
        <span className="match-separator">vs</span>
        <span className="team-name">{teamB}</span>
      </span>
    </span>
  );
}

function StatusChip({ children, className = "" }) {
  const chipClassName = ["status-chip", className].filter(Boolean).join(" ");
  return <span className={chipClassName}>{children}</span>;
}

function Topbar({ navOpen, onToggle, onLinkClick, siteSettings }) {
  const pathname = usePathname();

  return (
    <header className="topbar">
      <div className="shell topbar-inner">
        <Link className="brand" href="/">
        <img className="brand-mark" src={"/sg.png"} alt={siteSettings.brandMarkAlt || "Logo"} />
          <span className="brand-text">{siteSettings.brandText}</span>
        </Link>

        <button
          className="nav-toggle"
          id="nav-toggle"
          type="button"
          aria-expanded={navOpen}
          aria-controls="site-nav"
          onClick={onToggle}
        >
          Menu
        </button>

        <nav className={["site-nav", navOpen ? "open" : ""].filter(Boolean).join(" ")} id="site-nav">
          {siteSettings.navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onLinkClick}
                className={isActive ? "active" : ""}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function FooterSection({ siteSettings }) {
  return (
    <footer className="footer shell">
      <p>{siteSettings.footer.title}</p>
      <span>{siteSettings.footer.description}</span>
    </footer>
  );
}

function PublicShell({ siteSettings, children }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <>
      <Topbar
        navOpen={navOpen}
        onToggle={() => setNavOpen((current) => !current)}
        onLinkClick={() => setNavOpen(false)}
        siteSettings={siteSettings}
      />
      {children}
      <FooterSection siteSettings={siteSettings} />
    </>
  );
}

function PageHero({ eyebrow, title, description, actions = [] }) {
  return (
    <section className="section shell section-first page-hero">
      <div className="page-hero-copy">
        {/* <h1 className=" page-hero-title">{eyebrow}</h1> */}
        {/* <h1 className="page-hero-title">{title}</h1> */}
        {/* <p className="section-copy page-hero-copy-text">{description}</p> */}
        {actions.length ? (
          <div className="hero-actions">
            {actions.map((action) =>
              action.variant === "secondary" ? (
                <Link key={action.href} className="button button-secondary" href={action.href}>
                  {action.label}
                </Link>
              ) : (
                <Link key={action.href} className="button button-primary" href={action.href}>
                  {action.label}
                </Link>
              ),
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SponsorBannerSection({ bannerSlides }) {
  if (!bannerSlides?.length) {
    return null;
  }

  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(null);
  const totalSlides = bannerSlides.length;

  function goToSlide(nextIndex) {
    setActiveIndex((nextIndex + totalSlides) % totalSlides);
  }

  return (
    <section className="showcase-banner">
        <button
                className="showcase-control-button prev"
                type="button"
                aria-label="Slide sebelumnya"
                onClick={() => goToSlide(activeIndex - 1)}
              >
                &#8249; 
              </button>
      <div className="shell showcase-banner-inner">
        
        <div className="showcase-banner-frame">
          <div
            className="showcase-carousel-window"
            aria-live="polite"
            onTouchStart={(event) => {
              touchStartX.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              const endX = event.changedTouches[0]?.clientX ?? null;

              if (touchStartX.current === null || endX === null) {
                touchStartX.current = null;
                return;
              }

              const deltaX = touchStartX.current - endX;

              if (Math.abs(deltaX) >= 40) {
                goToSlide(activeIndex + (deltaX > 0 ? 1 : -1));
              }

              touchStartX.current = null;
            }}
          >
           
          

            <div
              className="showcase-carousel-track"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {bannerSlides.map((slide) => (
                <article key={slide.id} className="showcase-slide">
                  <Link className="showcase-slide-link" href={slide.href} aria-label={slide.alt}>
                    <img className="showcase-slide-image" src={slide.imageSrc} alt={slide.alt} />
                  </Link>
                </article>
              ))}
            </div>
          </div>

          <div className="showcase-carousel-footer">
            <div className="showcase-carousel-dots" role="tablist" aria-label="Pilih slide banner">
              {bannerSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  className={["showcase-dot", index === activeIndex ? "active" : ""]
                    .filter(Boolean)
                    .join(" ")}
                  type="button"
                  role="tab"
                  aria-selected={index === activeIndex}
                  aria-label={`Buka slide ${index + 1}`}
                  onClick={() => goToSlide(index)}
                ></button>
              ))}
            </div>
          </div>
        </div>
      </div>
       
                <button
                className="showcase-control-button next"
                type="button"
                aria-label="Slide berikutnya"
                onClick={() => goToSlide(activeIndex + 1)}
              >
                &#8250;
              </button>
    </section>
  );
}

function TournamentOverviewSection({
  aboutItems,
  remainingSlots,
  siteSettings,
  tournament,
  tournamentConfig,
}) {
  const overviewCards = [
    ...aboutItems,
    {
      title: "Status Slot",
      description:
        remainingSlots > 0
          ? `Masih tersedia ${remainingSlots} slot dari total ${tournamentConfig.maxTeamSlots} slot tim.`
          : "Slot utama sudah penuh dan pendaftaran baru akan diarahkan ke daftar tunggu.",
    },
  ];

  return (
    <section className="section shell">
      <div className="section-head">
        <div>
          <h2 >Tentang Turnamen</h2>
        </div>
      </div>

      <div className="info-grid">
        {overviewCards.map((item) => (
          <article key={item.title} className="info-card">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function RankingPreviewSection({ coreTeams, matches }) {
  const rankingItems = getTeamRankingRows(coreTeams, matches);

  return (
    <section className="section shell">
      <div className="ranking-shell">
        <div className="ranking-head">
          <h2>Peringkat</h2>
          <p className="ranking-subtitle">Performa turnamen saat ini</p>
        </div>

        {rankingItems.length ? (
          <div className="ranking-table-wrap">
            <table className="ranking-table">
              <thead>
                <tr>
                  <th className="ranking-team-head">Tim</th>
                  <th>Poin Match</th>
                  <th>Match W-L</th>
                  <th>Net Game Win</th>
                  <th>Game W-L</th>
                </tr>
              </thead>
              <tbody>
                {rankingItems.map((item) => (
                  <tr key={item.name}>
                    <td>
                      <div className="ranking-team-cell">
                        <span className="ranking-rank-box">{item.rank}</span>
                        <TeamIdentity teamName={item.name} teams={coreTeams} size="small" />
                      </div>
                    </td>
                    <td className="ranking-metric positive">{item.matchPoints}</td>
                    <td>{item.matchWins} - {item.matchLosses}</td>
                    <td
                      className={[
                        "ranking-metric",
                        item.netGameWin > 0 ? "positive" : item.netGameWin < 0 ? "negative" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {item.netGameWin > 0 ? `+${item.netGameWin}` : item.netGameWin}
                    </td>
                    <td>{item.gameWins} - {item.gameLosses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <article className="info-card">
            <h3>Belum ada progres pertandingan</h3>
            <p>
              Setelah hasil pertandingan pertama masuk, tabel peringkat akan otomatis ikut terisi.
            </p>
          </article>
        )}
      </div>
    </section>
  );
}

function HeroSection({ nextMatch, remainingSlots, siteSettings, tournamentConfig, tournament }) {
  const nextMatchLabel = nextMatch
    ? `${nextMatch.teamA} vs ${nextMatch.teamB}`
    : "Belum ada pertandingan berikutnya";

  return (
    <section className="hero shell">
      <div className="hero-copy">
        <h1 >{siteSettings.hero.eyebrow}</h1>
        {/* <h1>{siteSettings.hero.title}</h1> */}
        <p className="hero-copy-text">{siteSettings.hero.description}</p>
        <div className="hero-actions">
          <Link className="button button-primary" href={siteSettings.hero.primaryAction.href}>
            {siteSettings.hero.primaryAction.label}
          </Link>
          <Link className="button button-secondary" href={siteSettings.hero.secondaryAction.href}>
            {siteSettings.hero.secondaryAction.label}
          </Link>
        </div>
      </div>

      <div className="hero-summary">
        <div className="table-wrap">
          <table className="simple-table compact-table">
            <tbody>
              <tr>
                <th>Format</th>
                <td>{siteSettings.hero.format}</td>
              </tr>
              <tr>
                <th>Tanggal Turnamen</th>
                <td>{getTournamentDateLabel(tournament, siteSettings)}</td>
              </tr>
              <tr>
                <th>Status Pendaftaran</th>
                <td>{getRegistrationStatus(tournament, remainingSlots)}</td>
              </tr>
              <tr>
                <th>Slot Tim</th>
                <td>
                  {tournamentConfig.maxTeamSlots} slot / sisa {remainingSlots} slot
                </td>
              </tr>
              <tr>
                <th>Pertandingan Terdekat</th>
                <td>{nextMatchLabel}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function SchedulePreviewSection({ matches }) {
  const previewMatches = getUpcomingMatches(matches, 3);
  const now = Date.now();

  return (
    <section className="section shell">
      <div className="section-head">
        <div>
          <h2 >Jadwal Terdekat</h2>
        </div>
      </div>

      <div className="table-wrap">
        <table className="simple-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Pertandingan</th>
              <th>Ronde</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {previewMatches.length ? (
              previewMatches.map((match) => {
                const state = getMatchState(match, now);

                return (
                  <tr key={`${match.date}-${match.teamA}-${match.teamB}`}>
                    <td>{formatDate(match.date)}</td>
                    <td>
                      <MatchIdentity teamA={match.teamA} teamB={match.teamB} />
                    </td>
                    <td>{match.round}</td>
                    <td>
                      <StatusChip className={state.className}>{state.label}</StatusChip>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4">Belum ada jadwal yang dipublikasikan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


    </section>
  );
}

function ScheduleSection({ matches, siteSettings }) {
  const [filters, setFilters] = useState({ event: "all", status: "all" });
  const eventNames = getEventNames(matches);
  const now = Date.now();
  const visibleMatches = matches
    .map((match) => ({
      match,
      state: getMatchState(match, now),
    }))
    .filter(({ match, state }) => {
      const eventMatch = filters.event === "all" || match.event === filters.event;
      const statusMatch = filters.status === "all" || state.value === filters.status;

      return eventMatch && statusMatch;
    });

  return (
    <section className="section shell section-first">
      <div className="section-head">
        <div>
          <h2>{siteSettings.schedule.title}</h2>
        </div>
        <div className="schedule-controls">
          <label className="filter-field">
            Filter Pekan / Event
            <select
              value={filters.event}
              onChange={(event) =>
                setFilters((current) => ({ ...current, event: event.target.value }))
              }
            >
              <option value="all">Semua pekan</option>
              {eventNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            Status Pertandingan
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({ ...current, status: event.target.value }))
              }
            >
              <option value="all">Semua status</option>
              <option value="upcoming">Akan Datang</option>
              <option value="live">Segera / Live</option>
              <option value="finished">Selesai</option>
            </select>
          </label>
        </div>
      </div>

      <div className="table-wrap">
        <table className="simple-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Pertandingan</th>
              <th>Ronde</th>
              <th>Skor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleMatches.length ? (
              visibleMatches.map(({ match, state }) => {
                const score = match.scoreA === null ? "-" : `${match.scoreA} - ${match.scoreB}`;

                return (
                  <tr key={`${match.date}-${match.teamA}-${match.teamB}`}>
                    <td>{formatDate(match.date)}</td>
                    <td>
                      <MatchIdentity teamA={match.teamA} teamB={match.teamB} />
                    </td>
                    <td>{match.round}</td>
                    <td>{score}</td>
                    <td>
                      <StatusChip className={state.className}>{state.label}</StatusChip>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5">Belum ada jadwal untuk filter yang dipilih.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function BracketPreviewSection({ bracketPreview, siteSettings, fullPage = false }) {
  return (
    <section className="section shell">
      <div className="section-head">
        <div>
          <h1 className="page-hero-title" >{siteSettings.bracket.eyebrow}</h1>
          {/* <h2>{fullPage ? "Bracket turnamen penuh" : siteSettings.bracket.title}</h2> */}
        </div>
        {/* <p className="section-copy">{siteSettings.bracket.description}</p> */}
      </div>

      <div className="showcase-bracket-wrap">
        <div className={["showcase-preview-shell", fullPage ? "full" : ""].filter(Boolean).join(" ")}>
          <div className="showcase-preview-scale">
            <div className="showcase-bracket">
              <div className="showcase-stage">
                <div className="showcase-title-block">
                  <h3>
                    SINGLE
                    <br />
                    ELIMINATION
                  </h3>
                  <div className="showcase-title-accent"></div>
                </div>

                {bracketPreview.cards.map((card) => (
                  <div
                    key={card.id}
                    className={["showcase-team-card", card.variant].filter(Boolean).join(" ")}
                    style={{ left: `${card.left}px`, top: `${card.top}px` }}
                  >
                    <span>{card.label}</span>
                  </div>
                ))}

                {bracketPreview.connectorBoxes.map((box) => (
                  <div
                    key={box.id}
                    className="showcase-connector-box"
                    style={{
                      left: `${box.left}px`,
                      top: `${box.top}px`,
                      width: `${box.width}px`,
                      height: `${box.height}px`,
                    }}
                  ></div>
                ))}

                {bracketPreview.connectorMids.map((connector) => (
                  <div
                    key={connector.id}
                    className="showcase-connector-mid"
                    style={{
                      left: `${connector.left}px`,
                      top: `${connector.top}px`,
                      width: `${connector.width}px`,
                    }}
                  ></div>
                ))}

                <div className="showcase-trophy-wrap" aria-hidden="true">
                  <svg
                    className="showcase-trophy"
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 10h24v8c0 8.3-5.3 15.3-12 17.9C25.3 33.3 20 26.3 20 18v-8Z"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      d="M20 14H12c0 9.4 4.6 15 12 16M44 14h8c0 9.4-4.6 15-12 16"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path d="M32 36v10" stroke="currentColor" strokeWidth="3" />
                    <path d="M24 54h16" stroke="currentColor" strokeWidth="3" />
                    <path d="M26 46h12v8H26z" stroke="currentColor" strokeWidth="3" />
                  </svg>
                </div>
              </div>
              <div className="showcase-bottom-strip"></div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}



function BracketMatchesSection({ matches, coreTeams }) {
  const rounds = groupMatchesByRound(matches);
  const now = Date.now();

  return (
    <section className="section shell">
      <div className="section-head">
        <div>
          <h2 >Detail Bracket</h2>
        </div>
        {/* <p className="section-copy">
          Selain bagan visual, halaman ini juga menampilkan urutan pertandingan per ronde supaya
          mudah dibaca dari desktop maupun mobile.
        </p> */}
      </div>

      <div className="round-grid">
        {rounds.length ? (
          rounds.map((round) => (
            <article key={`${round.roundNumber}-${round.roundName}`} className="round-card">
              <h3>{round.roundName}</h3>
              <div className="table-wrap">
                <table className="simple-table">
                  <thead>
                    <tr>
                      <th>Match</th>
                      <th>Pertandingan</th>
                      <th>Skor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {round.matches.map((match) => {
                      const state = getMatchState(match, now);
                      const score =
                        match.scoreA === null ? "-" : `${match.scoreA} - ${match.scoreB}`;

                      return (
                        <tr key={`${match.date}-${match.teamA}-${match.teamB}`}>
                          <td>#{match.matchNumber || "-"}</td>
                          <td>
                            <MatchIdentity teamA={match.teamA} teamB={match.teamB} />
                          </td>
                          <td>{score}</td>
                          <td>
                            <StatusChip className={state.className}>{state.label}</StatusChip>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-note">
            <p>Belum ada match bracket yang dipublikasikan.</p>
          </div>
        )}
      </div>
    </section>
  );
}





function TeamsSection({ coreTeams }) {
  return (
    <section className="section shell section-first">
      <div className="section-head">
        <div>
          <h2 >Daftar Tim</h2>
        </div>

      </div>

      <div className="table-wrap">
        <table className="simple-table">
          <thead>
            <tr>
              <th>Tim</th>
              <th>Kapten</th>
              <th>Region</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {coreTeams.length ? (
              coreTeams.map((team) => (
                <tr key={team.name}>
                  <td>
                    <TeamIdentity teamName={team.name} teams={coreTeams} logoUrl={team.logoUrl} />
                  </td>
                  <td>{team.captain}</td>
                  <td>{team.region}</td>
                  <td>{team.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">Belum ada tim resmi yang dipublikasikan oleh panitia.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FeaturedStreamSection({ liveStreams, siteSettings }) {
  const featuredStream = getFeaturedStream(liveStreams);

  return (
    <section className="section shell">
      <div className="section-head">
        <div>
          <h2 >{siteSettings.live.eyebrow}</h2>
        </div>

      </div>

      {featuredStream ? (
        <article className="live-feature">
          <div className="live-feature-head">
            <div className="live-feature-intro">
              <p className="live-label">{siteSettings.live.featuredLabel}</p>
              <h3 className="live-feature-title">{featuredStream.title}</h3>
            </div>
            <StatusChip
              className={
                featuredStream.status === "Segera Tayang" || featuredStream.status === "Sedang Tayang"
                  ? "live"
                  : ""
              }
            >
              {featuredStream.status}
            </StatusChip>
          </div>

          <div className="live-feature-meta">
            <div className="live-meta-item">
              <span>Jadwal</span>
              <strong>{featuredStream.date}</strong>
            </div>
            <div className="live-meta-item">
              <span>Pertandingan</span>
              <strong>
                {featuredStream.teamA} vs {featuredStream.teamB}
              </strong>
            </div>
          </div>

          <div className="video-shell">
            <iframe
              src={`https://www.youtube.com/embed/${encodeURIComponent(featuredStream.youtubeId)}`}
              title="Siaran pertandingan utama"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share;"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
          </div>
        </article>
      ) : (
        <div className="table-wrap">
          <table className="simple-table compact-table">
            <tbody>
              <tr>
                <th>Status</th>
                <td>Belum ada siaran utama yang dipublikasikan.</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}



function LiveSection({ liveStreams, siteSettings }) {
  const [selectedStreamId, setSelectedStreamId] = useState(liveStreams[0]?.id || "");
  const featuredStream =
    liveStreams.find((stream) => stream.id === selectedStreamId) || liveStreams[0] || null;

  return (
    <section className="section shell section-first">
      <div className="section-head">
        <div>
          <p className="eyebrow">{siteSettings.live.eyebrow}</p>
          <h2>{siteSettings.live.title}</h2>
        </div>
        <p className="section-copy">{siteSettings.live.description}</p>
      </div>

      <div className="live-layout">
        <article className="live-feature">
          <div className="live-feature-head">
            <div className="live-feature-intro">
              <p className="live-label">{siteSettings.live.featuredLabel}</p>
              <h3 className="live-feature-title">
                {featuredStream ? featuredStream.title : "Belum ada siaran utama"}
              </h3>
            </div>
            <StatusChip
              className={
                featuredStream &&
                (featuredStream.status === "Segera Tayang" ||
                  featuredStream.status === "Sedang Tayang")
                  ? "live"
                  : ""
              }
            >
              {featuredStream ? featuredStream.status : "Belum Aktif"}
            </StatusChip>
          </div>

          <div className="live-feature-meta">
            <div className="live-meta-item">
              <span>Jadwal</span>
              <strong>{featuredStream ? featuredStream.date : "-"}</strong>
            </div>
            <div className="live-meta-item">
              <span>Pertandingan</span>
              <strong>
                {featuredStream
                  ? `${featuredStream.teamA} vs ${featuredStream.teamB}`
                  : "Belum ada pertandingan live"}
              </strong>
            </div>
          </div>

          {featuredStream ? (
            <div className="video-shell">
              <iframe
                src={`https://www.youtube.com/embed/${encodeURIComponent(featuredStream.youtubeId)}`}
                title="Siaran pertandingan utama"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share;"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="simple-table compact-table">
                <tbody>
                  <tr>
                    <th>Status</th>
                    <td>Belum ada stream yang dipublikasi untuk turnamen ini.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </article>

        <aside className="live-side">
          <div className="live-side-head">
            <p className="live-label">{siteSettings.live.listLabel}</p>
            <p className="live-side-copy">{siteSettings.live.listDescription}</p>
          </div>

          <div className="table-wrap live-table-wrap">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Pertandingan</th>
                  <th>Jadwal</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {liveStreams.length ? (
                  liveStreams.map((stream, index) => (
                    <tr key={stream.id}>
                      <td>
                        <MatchIdentity teamA={stream.teamA} teamB={stream.teamB} label={stream.title} />
                      </td>
                      <td>{stream.date}</td>
                      <td>
                        <StatusChip
                          className={
                            stream.status === "Segera Tayang" ||
                            stream.status === "Sedang Tayang" ||
                            index === 0
                              ? "live"
                              : ""
                          }
                        >
                          {stream.status}
                        </StatusChip>
                      </td>
                      <td>
                        <button
                          className={[
                            "action-button",
                            selectedStreamId === stream.id ? "active" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          type="button"
                          onClick={() => setSelectedStreamId(stream.id)}
                        >
                          Tampilkan
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">Belum ada stream yang dipublikasikan oleh panitia.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </aside>
      </div>
    </section>
  );
}

function FaqSection({ faqItems }) {
  return (
    <section className="section shell section-first" id="faq">
      <div className="faq-shell">
        <div className="faq-shell-head">
          <h2 >FAQ</h2>
        </div>

        <div className="faq-scroll">
          {faqItems.map((item) => (
            <details key={item.question} className="faq-item">
              <summary className="faq-question">
                <span className="faq-icon" aria-hidden="true"></span>
                <span>{item.question}</span>
              </summary>
              <div className="faq-answer">
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PublicHomePage({ initialData }) {
  const {
    aboutItems,
    bracketPreview,
    coreTeams,
    faqItems,
    liveStreams,
    matches,
    remainingSlots,
    bannerSlides,
    siteSettings,
    tournament,
    tournamentConfig,
  } = initialData;
  const nextMatch = getNextMatch(matches);

  return (
    <PublicShell siteSettings={siteSettings}>
      <main>
        <SponsorBannerSection bannerSlides={bannerSlides} />
        <HeroSection
          nextMatch={nextMatch}
          remainingSlots={remainingSlots}
          siteSettings={siteSettings}
          tournament={tournament}
          tournamentConfig={tournamentConfig}
        />
        <TournamentOverviewSection
          aboutItems={aboutItems}
          remainingSlots={remainingSlots}
          siteSettings={siteSettings}
          tournament={tournament}
          tournamentConfig={tournamentConfig}
        />
        <RankingPreviewSection coreTeams={coreTeams} matches={matches} />
        <SchedulePreviewSection matches={matches} />
        <FeaturedStreamSection liveStreams={liveStreams} siteSettings={siteSettings} />
        <FaqSection faqItems={faqItems} />
      </main>
    </PublicShell>
  );
}

export function PublicSchedulePage({ initialData }) {
  return (
    <PublicShell siteSettings={initialData.siteSettings}>
      <main>

        <ScheduleSection matches={initialData.matches} siteSettings={initialData.siteSettings} />
        <RankingPreviewSection coreTeams={initialData.coreTeams} matches={initialData.matches} />
      </main>
    </PublicShell>
  );
}

export function PublicBracketPage({ initialData }) {
  return (
    <PublicShell siteSettings={initialData.siteSettings}>
      <main>
        <PageHero
          eyebrow="Halaman Bracket"
          title="Bracket turnamen"
          description="Bagan turnamen penuh ditampilkan di halaman ini supaya lebih enak dibaca daripada dipaksa penuh di homepage."

        />
        <BracketPreviewSection
          bracketPreview={initialData.bracketPreview}
          siteSettings={initialData.siteSettings}
          
        />
        <BracketMatchesSection matches={initialData.matches} coreTeams={initialData.coreTeams} />
      </main>
    </PublicShell>
  );
}

export function PublicTeamsPage({ initialData }) {
  return (
    <PublicShell siteSettings={initialData.siteSettings}>
      <main>
        <PageHero
          eyebrow="Halaman Tim"
          title="Daftar tim resmi"
          description="Semua tim yang sudah disetujui panitia ditampilkan di sini. Homepage hanya menampilkan preview agar tetap ringkas."

        />
        <TeamsSection coreTeams={initialData.coreTeams} />
      </main>
    </PublicShell>
  );
}

export function PublicStreamsPage({ initialData }) {
  return (
    <PublicShell siteSettings={initialData.siteSettings}>
      <main>
        <PageHero
          eyebrow="Halaman Siaran"
          title="Siaran dan match live"
          description="Semua siaran turnamen dipusatkan di halaman ini. Pengunjung bisa memilih match yang ingin ditampilkan sebagai video utama."

        />
        <LiveSection liveStreams={initialData.liveStreams} siteSettings={initialData.siteSettings} />
      </main>
    </PublicShell>
  );
}

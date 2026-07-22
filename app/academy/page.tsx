import Link from "next/link";
import type { Metadata } from "next";

import { AcademyShell } from "./academy-shell";
import { getCurrentAcademySession } from "./academy-server-session";
import {
  getAcademyCoursePage,
  getAcademyCourses,
  getLaunchAcademyCourseIds,
} from "@/src/lib/academy/academy-content";
import { AcademyProgressStore } from "@/src/lib/academy/academy-progress-store";
import {
  ACADEMY_HOME_DESCRIPTION,
  ACADEMY_HOME_TITLE,
  buildAcademyHomeJsonLd,
  buildAcademyMetadata,
  jsonLdScript,
  TRADERSLINK_DISCORD_INVITE_URL,
} from "@/src/lib/academy/academy-seo";

const discordInviteUrl = TRADERSLINK_DISCORD_INVITE_URL;

type AcademyHomePageProps = {
  searchParams: Promise<{ auth?: string | string[] }>;
};

type AuthNotice = {
  tone: "warning" | "success";
  title: string;
  body: string;
  showInvite: boolean;
  showLogin: boolean;
} | null;

const chartReadingCourseId = "chart-reading-market-structure";
const candlestickModuleIds = new Set([
  "bullish-candle-patterns",
  "bearish-candle-patterns",
  "indecision-neutral-candles",
  "momentum-continuation-candles",
  "session-gap-behavior",
]);
const chartPatternModuleIds = new Set(["chart-patterns-context"]);

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: AcademyHomePageProps): Promise<Metadata> {
  const authStatus = normalizeSearchParam((await searchParams).auth);

  return buildAcademyMetadata({
    title: ACADEMY_HOME_TITLE,
    description: ACADEMY_HOME_DESCRIPTION,
    pathname: "/academy/",
    type: "website",
    keywords: [
      "free stock market lessons",
      "small cap trading academy",
      "stock market academy",
      "chart reading lessons",
      "candlestick lessons",
      "trading risk management",
    ],
    noIndex: Boolean(authStatus),
  });
}

export default async function AcademyHomePage({
  searchParams,
}: AcademyHomePageProps) {
  const authStatus = normalizeSearchParam((await searchParams).auth);
  const authNotice = getAuthNotice(authStatus);
  const academySession = await getCurrentAcademySession();
  const completedLessonSlugs = academySession
    ? new Set(
        await new AcademyProgressStore().listCompletedLessonSlugs(
          academySession.discordUserId,
        ),
      )
    : new Set<string>();
  const courses = getAcademyCourses();
  const liveCourseIds = getLaunchAcademyCourseIds();
  const liveCourseIdSet = new Set(liveCourseIds);
  const liveCourses = liveCourseIds
    .map((courseId) => {
      const course = courses.find((item) => item.course_id === courseId);
      const coursePage = getAcademyCoursePage(courseId);

      return course && coursePage ? { course, coursePage } : null;
    })
    .filter((item) => item !== null);
  const liveLessonCount = liveCourses.reduce(
    (total, item) => total + item.coursePage.totalLessonCount,
    0,
  );
  const comingSoonCourses = courses.filter(
    (course) => !liveCourseIdSet.has(course.course_id),
  );
  const academyJsonLd = buildAcademyHomeJsonLd(
    liveCourses.map((item) => item.course),
  );
  const shouldShowSaveProgressNote =
    !academySession && authNotice?.tone !== "success";

  return (
    <AcademyShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(academyJsonLd)}
      />
      <div className="academy-container">
        <section className="academy-hero">
          <div className="academy-hero-copy">
            <p className="academy-eyebrow">TradersLink Academy</p>
            <h1 className="academy-title">
              Free Stock Market Lessons for Small Cap Stock Traders
            </h1>
            <p className="academy-lede">
              Learn how small cap stock traders read charts, understand candles,
              track market structure, manage risk, and build better trading
              habits through structured small cap academy courses.
            </p>
            {authNotice ? (
              <div
                className={`academy-auth-alert academy-auth-alert-${authNotice.tone}`}
                role={authNotice.tone === "warning" ? "alert" : "status"}
              >
                <p className="academy-auth-alert-title">{authNotice.title}</p>
                <p>{authNotice.body}</p>
                <div className="academy-auth-alert-actions">
                  {authNotice.showInvite ? (
                    <a
                      href={discordInviteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="academy-auth-alert-button"
                    >
                      Join the free Discord
                    </a>
                  ) : null}
                  {authNotice.showLogin ? (
                    <Link
                      href="/api/auth/discord/login?returnTo=%2Facademy%2F"
                      className="academy-auth-alert-link"
                    >
                      Log in with Discord
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
            {shouldShowSaveProgressNote ? (
              <div className="academy-progress-note">
                <p className="academy-progress-note-title">
                  Save your place as you learn.
                </p>
                <p>
                  Academy lessons are open to read for free. To save completed
                  lessons and keep your progress synced, join the free{" "}
                  <a
                    href={discordInviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    TradersLink Discord
                  </a>
                  , then log in here with the same Discord account.
                </p>
              </div>
            ) : null}
          </div>

          <div className="academy-stat-grid">
            <StatCard
              label="Live courses"
              value={liveCourses.length.toString()}
            />
            <StatCard label="Lessons" value={liveLessonCount.toString()} />
            <StatCard
              label="Coming soon"
              value={comingSoonCourses.length.toString()}
            />
          </div>
        </section>

        <section className="academy-section academy-grid-sidebar">
          <div>
            <div className="academy-section-heading">
              <div>
                <p className="academy-section-label">Available Now</p>
                <h2 className="academy-section-title">
                  Begin The Academy Path
                </h2>
              </div>
            </div>

            {liveCourses.length > 0 ? (
              <div className="academy-module-list">
                {liveCourses.map(({ course, coursePage }) => {
                  const lessons = coursePage.modules.flatMap(
                    ({ lessons }) => lessons,
                  );
                  const progress = getCourseProgress(
                    lessons,
                    completedLessonSlugs,
                  );
                  const lessonGroupProgress = getCourseLessonGroupProgress(
                    course.course_id,
                    lessons,
                    completedLessonSlugs,
                  );

                  return (
                    <Link
                      key={course.course_id}
                      href={course.course_slug}
                      className="academy-card academy-card-link"
                    >
                      <div className="academy-card-topline">
                        <p className="academy-kicker">
                          Course {course.course_order}
                        </p>
                        <span className="academy-chip academy-chip-success">
                          Open now
                        </span>
                      </div>
                      <h3 className="academy-card-title">
                        {course.course_title}
                      </h3>
                      <p className="academy-card-text">
                        {course.course_outcome || course.display_model}
                      </p>
                      <div className="academy-chip-row">
                        <span className="academy-chip">
                          {coursePage.totalLessonCount} lessons
                        </span>
                      </div>
                      <div className="academy-course-progress">
                        <CourseProgressMeter
                          isAuthenticated={Boolean(academySession)}
                          label={
                            course.course_id === chartReadingCourseId
                              ? "Core lessons"
                              : undefined
                          }
                          progress={progress}
                        />
                        {lessonGroupProgress.map((groupProgress) => (
                          <CourseProgressMeter
                            key={groupProgress.label}
                            isAuthenticated={Boolean(academySession)}
                            label={groupProgress.label}
                            progress={groupProgress}
                          />
                        ))}
                      </div>
                      <span className="academy-card-action">Open course</span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>

          <section aria-label="Coming soon Academy courses" className="academy-sidebar">
            <div className="academy-sidebar-card academy-sidebar-card-accent">
              <h2 className="academy-sidebar-title">Courses Coming Soon</h2>
            </div>

            {comingSoonCourses.map((course) => (
              <div key={course.course_id} className="academy-sidebar-card">
                <div className="academy-card-topline">
                  <p className="academy-card-text">
                    Course {course.course_order}
                  </p>
                  <span className="academy-chip academy-chip-warning">
                    Coming soon
                  </span>
                </div>
                <h3 className="academy-sidebar-title">{course.course_title}</h3>
              </div>
            ))}
          </section>
        </section>
      </div>
    </AcademyShell>
  );
}

function normalizeSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getCourseProgress(
  lessons: Array<{
    lesson_slug: string;
    module_id: string;
    counts_toward_course_progress: boolean;
  }>,
  completedLessonSlugs: Set<string>,
) {
  const progressLessons = lessons.filter(
    (lesson) => lesson.counts_toward_course_progress,
  );
  const completed = progressLessons.filter((lesson) =>
    completedLessonSlugs.has(lesson.lesson_slug),
  ).length;
  const total = progressLessons.length;

  return {
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

function getCourseLessonGroupProgress(
  courseId: string,
  lessons: Array<{
    lesson_slug: string;
    module_id: string;
    counts_toward_course_progress: boolean;
  }>,
  completedLessonSlugs: Set<string>,
) {
  if (courseId !== chartReadingCourseId) {
    return [];
  }

  return [
    getLessonGroupProgress(
      "Candlestick lessons",
      lessons.filter((lesson) => candlestickModuleIds.has(lesson.module_id)),
      completedLessonSlugs,
    ),
    getLessonGroupProgress(
      "Chart pattern lessons",
      lessons.filter((lesson) => chartPatternModuleIds.has(lesson.module_id)),
      completedLessonSlugs,
    ),
  ].filter((progress) => progress.total > 0);
}

function getLessonGroupProgress(
  label: string,
  lessons: Array<{
    lesson_slug: string;
  }>,
  completedLessonSlugs: Set<string>,
) {
  const completed = lessons.filter((lesson) =>
    completedLessonSlugs.has(lesson.lesson_slug),
  ).length;
  const total = lessons.length;

  return {
    completed,
    label,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

function getAuthNotice(authStatus: string | undefined): AuthNotice {
  switch (authStatus) {
    case "join-discord":
      return {
        tone: "warning",
        title: "Join the free TradersLink Discord to save progress.",
        body: "Your Discord login worked, but this account is not a member of the TradersLink server yet. Join the free Discord, then come back and log in again with the same Discord account so the Academy can track completed lessons.",
        showInvite: true,
        showLogin: true,
      };
    case "invalid-state":
      return {
        tone: "warning",
        title: "Discord login did not finish.",
        body: "The login session expired or restarted before it could connect. Try logging in again; if you are not already in the free TradersLink Discord, join the server first so progress tracking can turn on.",
        showInvite: true,
        showLogin: true,
      };
    case "failed":
      return {
        tone: "warning",
        title: "Discord login could not connect.",
        body: "Discord approved the login request, but the Academy could not finish the connection. Try again with the same Discord account. If it still fails, the site owner may need to refresh the Discord app settings.",
        showInvite: true,
        showLogin: true,
      };
    case "progress-storage-failed":
      return {
        tone: "warning",
        title: "Discord login worked, but progress could not be saved.",
        body: "Your Discord account was verified, but the Academy could not create the progress session. Try again in a moment. If it keeps happening, the progress database connection needs to be checked.",
        showInvite: false,
        showLogin: true,
      };
    case "missing-config":
      return {
        tone: "warning",
        title: "Discord login is not ready in this environment.",
        body: "The Academy can still be read for free, but progress tracking needs the Discord login settings to be configured before it can save lesson completion.",
        showInvite: false,
        showLogin: false,
      };
    case "connected":
      return {
        tone: "success",
        title: "You are logged in.",
        body: "Your Discord account is connected to the Academy. Lesson progress can now be saved as you work through the courses.",
        showInvite: false,
        showLogin: false,
      };
    default:
      return null;
  }
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="academy-stat-card">
      <p className="academy-stat-label">{label}</p>
      <p className="academy-stat-value">{value}</p>
    </div>
  );
}

function CourseProgressMeter({
  isAuthenticated,
  label,
  progress,
}: {
  isAuthenticated: boolean;
  label?: string;
  progress: {
    completed: number;
    total: number;
    percent: number;
  };
}) {
  return (
    <div className="academy-course-progress-row">
      {label ? (
        <p className="academy-course-progress-label">{label}</p>
      ) : null}
      <div className="academy-course-progress-track">
        <span
          className="academy-course-progress-fill"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <div className="academy-course-progress-meta">
        <span>
          {isAuthenticated
            ? `${progress.percent}% complete`
            : "Log in to track progress"}
        </span>
        <span>
          {progress.completed}/{progress.total}
        </span>
      </div>
    </div>
  );
}

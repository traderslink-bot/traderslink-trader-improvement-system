import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentAcademySession } from "../academy-server-session";
import { AcademyShell } from "../academy-shell";
import { LessonCompletionLink } from "../lesson-completion-link";
import {
  type AcademyLessonMembership,
  type AcademyModule,
  getAcademyCoursePage,
  getAcademyLessonBySegments,
  getLaunchAcademyLessonStaticParams,
  isAcademyCourseLaunchReady,
  isAcademyLessonLaunchReady,
} from "@/src/lib/academy/academy-content";
import { AcademyMarkdown } from "@/src/lib/academy/academy-markdown";
import {
  buildAcademyMetadata,
  buildLessonJsonLd,
  jsonLdScript,
  TRADERSLINK_DISCORD_INVITE_URL,
} from "@/src/lib/academy/academy-seo";

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

const discordInviteUrl = TRADERSLINK_DISCORD_INVITE_URL;

export const dynamicParams = false;
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getLaunchAcademyLessonStaticParams();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getAcademyLessonBySegments(slug);

  if (!lesson || !isAcademyLessonLaunchReady(lesson)) {
    return buildAcademyMetadata({
      title: "Academy Lesson",
      description: "A TradersLink Academy lesson for practical trading education.",
      pathname: "/academy/",
      noIndex: true,
    });
  }

  return buildAcademyMetadata({
    title: lesson.seoTitle,
    description: lesson.description,
    pathname: lesson.slug,
  });
}

export default async function AcademyLessonPage({ params }: PageProps) {
  const { slug } = await params;
  const lesson = getAcademyLessonBySegments(slug);

  if (!lesson || !isAcademyLessonLaunchReady(lesson)) {
    notFound();
  }

  const academySession = await getCurrentAcademySession();
  const primaryContext = lesson.contexts[0] ?? null;
  const primaryCoursePage = primaryContext
    ? getAcademyCoursePage(primaryContext.courseId)
    : null;
  const courseModules = primaryCoursePage?.modules ?? [];
  const learningPathSection = splitLearningPathSection(lesson.body);
  const visibleSecondaryContexts = lesson.contexts.filter(
    (context) =>
      context.courseId !== primaryContext?.courseId &&
      isAcademyCourseLaunchReady(context.courseId),
  );
  const lessonJsonLd = buildLessonJsonLd(lesson);

  return (
    <AcademyShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(lessonJsonLd)}
      />
      <div className="academy-container-wide academy-grid-sidebar">
        <article className="academy-article">
          {academySession ? null : (
            <div className="academy-progress-label">
              <p className="academy-progress-label-title">
                Track your progress
              </p>
              <p>
                To save this lesson to your Academy progress, join the free{" "}
                <a
                  href={discordInviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  TradersLink Discord
                </a>{" "}
                and log in with your Discord account.
              </p>
              <a
                href={`/api/auth/discord/login?returnTo=${encodeURIComponent(lesson.slug)}`}
                className="academy-progress-label-link"
              >
                Log in with Discord
              </a>
            </div>
          )}

          <div>
            <AcademyMarkdown body={learningPathSection.mainBody} />
          </div>

          <nav className="academy-nav-grid">
            {lesson.previousLesson ? (
              <Link
                href={lesson.previousLesson.slug}
                className="academy-nav-card"
              >
                <p className="academy-nav-label">Previous lesson</p>
                <p className="academy-nav-title">
                  {lesson.previousLesson.title}
                </p>
              </Link>
            ) : (
              <Link href="/academy/" className="academy-nav-card">
                <p className="academy-nav-label">Academy home</p>
                <p className="academy-nav-title">View all courses</p>
              </Link>
            )}

            {lesson.nextLesson ? (
              <LessonCompletionLink
                href={lesson.nextLesson.slug}
                className="academy-nav-card academy-nav-card-accent"
                lessonSlug={lesson.slug}
                shouldTrack={Boolean(academySession)}
              >
                <p className="academy-nav-label">Next lesson</p>
                <p className="academy-nav-title">{lesson.nextLesson.title}</p>
              </LessonCompletionLink>
            ) : (
              <LessonCompletionLink
                href="/academy/"
                className="academy-nav-card academy-nav-card-accent"
                lessonSlug={lesson.slug}
                shouldTrack={Boolean(academySession)}
              >
                <p className="academy-nav-label">Course complete</p>
                <p className="academy-nav-title">Return to Academy</p>
              </LessonCompletionLink>
            )}
          </nav>

          {learningPathSection.learningPathBody ? (
            <div className="academy-learning-path">
              <AcademyMarkdown body={learningPathSection.learningPathBody} />
            </div>
          ) : null}
        </article>

        <section aria-label="Academy lesson navigation" className="academy-sidebar">
          {primaryContext ? (
            <div className="academy-sidebar-card academy-sidebar-card-accent">
              <p className="academy-kicker">Course Context</p>
              <h2 className="academy-sidebar-title">
                {primaryContext.courseTitle}
              </h2>
              <div className="academy-sidebar-text">
                <p>{primaryContext.moduleTitle}</p>
                <p>Lesson {primaryContext.displayOrder}</p>
              </div>
              <Link
                href={primaryContext.courseSlug}
                className="academy-sidebar-link"
              >
                View course
              </Link>
            </div>
          ) : null}

          {visibleSecondaryContexts.length > 0 ? (
            <div className="academy-sidebar-card">
              <h2 className="academy-sidebar-title">Also Appears In</h2>
              <div className="academy-sidebar-list">
                {visibleSecondaryContexts.map((context) => (
                  <Link
                    key={`${context.courseId}-${context.moduleId}`}
                    href={context.courseSlug}
                    className="academy-course-link"
                  >
                    <span className="academy-course-link-title">
                      {context.courseTitle}
                    </span>
                    <span className="academy-course-link-order">
                      {context.moduleTitle}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {courseModules.length > 0 ? (
            <div className="academy-sidebar-card">
              <h2 className="academy-sidebar-title">Course Path</h2>
              <p className="academy-sidebar-text">
                Move through the course in order, or jump to the lesson you
                need.
              </p>
              <div className="academy-course-path">
                <CourseLessonGroups
                  currentSlug={lesson.slug}
                  groups={courseModules}
                  label="Lessons"
                />
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </AcademyShell>
  );
}

function CourseLessonGroups({
  currentSlug,
  groups,
  label,
}: {
  currentSlug: string;
  groups: Array<{ module: AcademyModule; lessons: AcademyLessonMembership[] }>;
  label: string;
}) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="academy-course-groups">
      <p className="academy-nav-label">{label}</p>
      {groups.map(({ module, lessons }) => (
        <div key={module.module_id} className="academy-course-group">
          <p className="academy-course-group-title">{module.module_title}</p>
          {lessons.map((courseLesson) => {
            const isCurrent = courseLesson.lesson_slug === currentSlug;

            return (
              <Link
                key={`${courseLesson.display_course_id}-${courseLesson.lesson_slug}-${courseLesson.display_order}`}
                href={courseLesson.lesson_slug}
                className={`academy-course-link ${
                  isCurrent ? "academy-course-link-current" : ""
                }`}
              >
                <span className="academy-course-link-order">
                  Lesson {courseLesson.display_order}
                </span>
                <span className="academy-course-link-title">
                  {courseLesson.display_title}
                </span>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function splitLearningPathSection(body: string): {
  mainBody: string;
  learningPathBody: string | null;
} {
  const heading = /^## Continue The Learning Path\s*$/m.exec(body);

  if (!heading) {
    return {
      mainBody: body,
      learningPathBody: null,
    };
  }

  const sectionStart = heading.index;
  const afterHeadingIndex = sectionStart + heading[0].length;
  const remainingBody = body.slice(afterHeadingIndex);
  const nextHeading = /^##\s+/m.exec(remainingBody);
  const sectionEnd = nextHeading
    ? afterHeadingIndex + nextHeading.index
    : body.length;
  const beforeSection = body.slice(0, sectionStart).trimEnd();
  const learningPathBody = body.slice(sectionStart, sectionEnd).trim();
  const afterSection = body.slice(sectionEnd).trimStart();
  const mainBody = [beforeSection, afterSection].filter(Boolean).join("\n\n");

  return {
    mainBody,
    learningPathBody,
  };
}

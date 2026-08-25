import { redirect } from "next/navigation";
import { getActiveBrand } from "@/lib/branding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ManufacturerHeader } from "@/components/manufacturer-shell";
import { saveTrainingAssignments } from "./actions";
import AssignmentManager, { type AssignmentRow } from "./assignment-manager";
import RetailerSelector from "./retailer-selector";
import {
  AcademyPageHeader,
  AcademySurface,
  StepLabel,
  academyButton,
  academyInput,
} from "@/components/academy-ui";

type Retailer = {
  company_id: string;
  company_name: string;
  member_count: number;
  assignment_count: number;
  city?: string | null;
  state_region?: string | null;
  address_line_1?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
};
type Quiz = {
  quiz_id: string;
  title: string;
  description: string | null;
  passing_score: number;
};
type Course = {
  course_id: string;
  title: string;
  description: string | null;
  status: string;
  block_count: number;
  assignment_count: number;
};

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    saved?: string;
    updated?: string;
    removed?: string;
    notified?: string;
    emailFailed?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [{ data: auth }, brand] = await Promise.all([
    supabase.auth.getUser(),
    getActiveBrand(),
  ]);
  if (!auth.user) redirect("/login");
  if (!brand?.can_manage_training) redirect("/app");
  const [
    { data: retailerRows },
    { data: retailerProfiles },
    { data: quizRows },
    { data: courseRows },
    { data: assignmentRows, error: assignmentError },
    { data: assignmentEmailsEnabled },
  ] = await Promise.all([
    supabase.rpc("manufacturer_retailer_dashboard"),
    supabase.rpc("manufacturer_retailer_profiles"),
    supabase.rpc("manufacturer_published_quizzes"),
    supabase.rpc("manufacturer_courses"),
    supabase.rpc("manufacturer_assignment_directory"),
    supabase.rpc("assignment_notifications_enabled"),
  ]);
  const profileMap = new Map(
    (
      (retailerProfiles ?? []) as {
        company_id: string;
        city: string | null;
        state_region: string | null;
        address_line_1: string | null;
        postal_code: string | null;
        phone: string | null;
        contact_name: string | null;
        contact_email: string | null;
      }[]
    ).map((profile) => [profile.company_id, profile]),
  );
  const retailers = ((retailerRows ?? []) as Retailer[]).map((retailer) => ({
    ...retailer,
    ...profileMap.get(retailer.company_id),
  }));
  const quizzes = (quizRows ?? []) as Quiz[];
  const courses = ((courseRows ?? []) as Course[]).filter(
    (course) => course.status === "published",
  );
  const primary = brand.primary_color;

  return (
    <div className="min-h-screen bg-[#f4f4f2] text-black">
      <ManufacturerHeader brand={brand} email={auth.user.email} />
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <AcademyPageHeader
          eyebrow="Audience-based learning"
          title="Assignments"
          description="Assign published training, set expectations, and manage every active audience from one workspace."
          accent={primary}
        />
        {(params.error || assignmentError) && (
          <div
            role="alert"
            className="mt-6 border-l-4 bg-red-50 p-4 font-semibold text-red-900"
            style={{ borderColor: primary }}
          >
            {params.error ||
              assignmentError?.message ||
              "Assignments are temporarily unavailable."}
          </div>
        )}
        {params.saved && (
          <div
            role="status"
            className="mt-6 border-l-4 border-green-600 bg-green-50 p-4 font-semibold text-green-900"
          >
            Training assignment saved for {params.saved} audience
            {params.saved === "1" ? "" : "s"}.
          </div>
        )}
        {params.notified && (
          <div
            role="status"
            className="mt-3 border-l-4 border-green-600 bg-green-50 p-4 font-semibold text-green-900"
          >
            Assignment email sent to {params.notified} learner
            {params.notified === "1" ? "" : "s"}.
            {Number(params.emailFailed) > 0
              ? ` ${params.emailFailed} could not be delivered.`
              : ""}
          </div>
        )}
        {params.updated && (
          <div
            role="status"
            className="mt-6 border-l-4 border-green-600 bg-green-50 p-4 font-semibold text-green-900"
          >
            Assignment updated.
          </div>
        )}
        {params.removed && (
          <div
            role="status"
            className="mt-6 border-l-4 border-green-600 bg-green-50 p-4 font-semibold text-green-900"
          >
            {params.removed === "1" ? "Assignment" : "Assignments"} removed.
            Learner history was preserved.
          </div>
        )}

        <form action={saveTrainingAssignments} className="mt-8 grid gap-5">
          <AcademySurface className="p-6 lg:p-7">
            <StepLabel number="01" accent={primary}>Build the assignment</StepLabel>
            <h2 className="mt-2 text-xl font-extrabold uppercase">
              Choose training
            </h2>
            <label className="mt-5 grid gap-2 font-bold">
              Published content
              <select
                name="content"
                required
                className={academyInput}
              >
                <option value="">Select a quiz or course</option>
                <optgroup label="Quizzes">
                  {quizzes.map((quiz) => (
                    <option key={quiz.quiz_id} value={`quiz:${quiz.quiz_id}`}>
                      {quiz.title}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Courses">
                  {courses.map((course) => (
                    <option
                      key={course.course_id}
                      value={`course:${course.course_id}`}
                    >
                      {course.title}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid grid-rows-[auto_1.25rem_3rem] gap-2 font-bold">
                <span>Due date</span>
                <span className="text-xs font-normal text-black/45">
                  Optional
                </span>
                <input
                  name="dueDate"
                  type="date"
                  className={academyInput}
                />
              </label>
              <label className="flex min-h-11 items-center gap-3 self-end rounded-md border border-black/15 bg-black/[.02] px-4 font-bold">
                <input
                  name="required"
                  type="checkbox"
                  defaultChecked
                  className="h-5 w-5"
                />
                Required training
              </label>
            </div>
            {!quizzes.length && !courses.length && (
              <p className="mt-4 text-sm text-amber-800">
                Publish a quiz or course before creating an assignment.
              </p>
            )}
          </AcademySurface>
          <AcademySurface className="p-6 lg:p-7">
            <StepLabel number="02" accent={primary}>Choose who receives it</StepLabel>
            <h2 className="mt-2 text-xl font-extrabold uppercase">
              Choose audience
            </h2>
            <label className="mt-5 flex items-center justify-between gap-4 rounded-md border border-black/15 bg-black/[.02] p-4 transition hover:border-black/35">
              <span>
                <b className="block uppercase">Manufacturer Team</b>
                <span className="mt-1 block text-xs text-black/45">
                  Everyone with active access to this brand team
                </span>
              </span>
              <input
                type="checkbox"
                name="manufacturerTeam"
                className="h-6 w-6"
              />
            </label>
            <RetailerSelector retailers={retailers} />
            <label className="mt-5 flex items-center justify-between gap-4 rounded-md border border-black/15 bg-black/[.03] p-4">
              <span>
                <b className="block uppercase">Email learners</b>
                <span className="mt-1 block text-xs text-black/45">
                  {assignmentEmailsEnabled ? "Send a branded notification after saving" : "Enable new-assignment emails under Manage > Notifications"}
                </span>
              </span>
              <input
                type="checkbox"
                name="notify"
                defaultChecked={Boolean(assignmentEmailsEnabled)}
                disabled={!assignmentEmailsEnabled}
                className="h-6 w-6"
              />
            </label>
            <button
              disabled={!quizzes.length && !courses.length}
              className={`${academyButton.primary} mt-5 w-full disabled:translate-y-0 disabled:opacity-40`}
              style={{ backgroundColor: primary }}
            >
              Save assignment
            </button>
          </AcademySurface>
        </form>

        <AssignmentManager
          assignments={((assignmentRows ?? []) as AssignmentRow[]).map(
            (row) => ({
              ...row,
              learner_count: Number(row.learner_count),
              completed_count: Number(row.completed_count),
            }),
          )}
          brandSlug={brand.slug}
          primary={primary}
        />
      </main>
    </div>
  );
}

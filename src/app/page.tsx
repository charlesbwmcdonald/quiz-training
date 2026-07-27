import Link from "next/link";
import Image from "next/image";

const features = [
  {
    title: "Product Training",
    description:
      "Learn Gen-Y Hitch products, applications, key features, and customer benefits.",
    icon: "01",
  },
  {
    title: "Dealer Certification",
    description:
      "Complete assigned courses and quizzes to confirm product knowledge.",
    icon: "02",
  },
  {
    title: "Training Resources",
    description:
      "Access videos, installation information, product guides, and sales materials.",
    icon: "03",
  },
];

const benefits = [
  "Understand which hitch fits each application",
  "Learn the differences between Gen-Y product lines",
  "Build confidence answering customer questions",
  "Stay current on new products and updates",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-[Poppins] text-black">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image
  src="/GENYHitch_BlackText2024.png"
  alt="Gen-Y Hitch"
  width={220}
  height={48}
  priority
  className="h-12 w-auto"
/>

            <div>
              <p className="text-lg font-extrabold uppercase tracking-tight">
                Gen-Y Hitch
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#333333]">
                Dealer Training
              </p>
            </div>
          </Link>

          <Link
            href="/login"
            className="bg-black px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition hover:bg-[#D90000]"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-black text-white">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -right-24 -top-36 h-96 w-96 rounded-full border-[70px] border-[#D90000]" />
            <div className="absolute -bottom-44 -left-24 h-96 w-96 rounded-full border-[70px] border-[#333333]" />
          </div>

          <div className="relative mx-auto grid min-h-[650px] max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-wide">
                <span className="h-2 w-2 rounded-full bg-[#D90000]" />
                Gen-Y Hitch Learning Center
              </div>

              <h1 className="max-w-3xl text-5xl font-extrabold uppercase leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Know the product.
                <span className="block italic text-[#D90000]">
                  Sell with confidence.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#CCCCCC]">
                Product training built for Gen-Y Hitch dealers, distributors,
                sales teams, and industry partners. Learn the products, complete
                assigned training, and stay ready to help every customer find
                the right towing solution.
              </p>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex min-h-14 items-center justify-center bg-[#D90000] px-7 text-base font-extrabold uppercase tracking-wide text-white transition hover:bg-[#A30000]"
                >
                  Start Training
                </Link>

                <a
                  href="#overview"
                  className="inline-flex min-h-14 items-center justify-center border border-white/30 px-7 text-base font-bold uppercase tracking-wide text-white transition hover:border-white hover:bg-white hover:text-black"
                >
                  View Platform
                </a>
              </div>
            </div>

            <div className="border border-white/15 bg-[#333333]/70 p-5 shadow-2xl backdrop-blur">
              <div className="bg-white p-6 text-black">
                <div className="flex items-start justify-between border-b border-black/10 pb-5">
                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-wider text-[#D90000]">
                      Training Overview
                    </p>
                    <h2 className="mt-1 text-2xl font-extrabold uppercase">
                      Welcome Back, Dealer Team
                    </h2>
                  </div>

                  <div className="bg-black px-3 py-2 text-xs font-extrabold italic text-white">
                    GEN-Y
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <StatCard value="4" label="Assigned" />
                  <StatCard value="3" label="Completed" />
                  <StatCard value="92%" label="Avg. Score" />
                </div>

                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-bold">Current Training</p>
                    <p className="text-sm font-semibold text-[#333333]">
                      75% complete
                    </p>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-[#CCCCCC]">
                    <div className="h-full w-3/4 rounded-full bg-[#D90000]" />
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <TrainingItem
                    title="Executive Torsion-Flex Hitch"
                    status="Completed"
                    complete
                  />
                  <TrainingItem
                    title="Mega-Duty Adjustable Hitch"
                    status="Completed"
                    complete
                  />
                  <TrainingItem
                    title="Goosepuck Towing System"
                    status="In Progress"
                  />
                  <TrainingItem
                    title="New Product Introduction"
                    status="Not Started"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="overview" className="px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-extrabold uppercase italic tracking-[0.22em] text-[#D90000]">
                Built for the Gen-Y Network
              </p>

              <h2 className="mt-4 text-4xl font-extrabold uppercase leading-tight tracking-tight sm:text-5xl">
                Everything needed to learn, sell, and support the product.
              </h2>

              <p className="mt-5 text-lg leading-8 text-[#333333]">
                The Gen-Y Hitch Learning Center brings product information and
                dealer training together in one simple place.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="border border-black/10 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center bg-black text-sm font-extrabold text-white">
                    {feature.icon}
                  </div>

                  <h3 className="mt-6 text-xl font-extrabold uppercase">
                    {feature.title}
                  </h3>

                  <p className="mt-3 leading-7 text-[#333333]">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F3F3F3] px-6 py-24 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-extrabold uppercase italic tracking-[0.22em] text-[#D90000]">
                Better Product Knowledge
              </p>

              <h2 className="mt-4 text-4xl font-extrabold uppercase leading-tight tracking-tight sm:text-5xl">
                Help every dealer become a product expert.
              </h2>

              <p className="mt-6 text-lg leading-8 text-[#333333]">
                Clear, consistent training helps dealer teams understand the
                products, explain the benefits, recommend the right solution,
                and serve customers with confidence.
              </p>

              <div className="mt-9 grid gap-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-4">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D90000] text-xs font-extrabold text-white">
                      ✓
                    </div>
                    <p className="font-semibold text-black">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-black p-8 text-white shadow-xl sm:p-10">
              <p className="text-sm font-extrabold uppercase italic tracking-[0.22em] text-[#D90000]">
                Manager Visibility
              </p>

              <h3 className="mt-4 text-3xl font-extrabold uppercase">
                See how training is progressing.
              </h3>

              <p className="mt-4 leading-7 text-[#CCCCCC]">
                Training results help Gen-Y understand who has completed
                assignments, which topics need more attention, and where
                additional dealer support may be helpful.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Metric value="87%" label="Training completion" />
                <Metric value="91%" label="Average quiz score" />
                <Metric value="248" label="Active learners" />
                <Metric value="36" label="Dealer locations" />
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-5xl bg-[#D90000] px-8 py-14 text-center text-white shadow-xl sm:px-14">
            <p className="text-sm font-extrabold uppercase italic tracking-[0.22em] text-white/80">
              Ready to Begin?
            </p>

            <h2 className="mt-4 text-4xl font-extrabold uppercase tracking-tight">
              Start your Gen-Y Hitch training.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/85">
              Sign in to view assigned courses, access product resources, and
              continue your training.
            </p>

            <Link
              href="/login"
              className="mt-8 inline-flex min-h-14 items-center justify-center bg-white px-8 text-base font-extrabold uppercase tracking-wide text-black transition hover:bg-black hover:text-white"
            >
              Sign In to Training
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/10 bg-black">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-[#CCCCCC] sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>
            © {new Date().getFullYear()} Gen-Y Hitch. Dealer Training Platform.
          </p>

          <p>Engineered for the toughest towing applications.</p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-[#F3F3F3] p-4 text-center">
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#333333]">
        {label}
      </p>
    </div>
  );
}

function TrainingItem({
  title,
  status,
  complete = false,
}: {
  title: string;
  status: string;
  complete?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border border-black/10 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
            complete
              ? "bg-[#D90000] text-white"
              : "border border-[#CCCCCC] bg-white text-[#333333]"
          }`}
        >
          {complete ? "✓" : "•"}
        </div>

        <p className="text-sm font-bold">{title}</p>
      </div>

      <p
        className={`shrink-0 text-xs font-bold ${
          complete ? "text-[#D90000]" : "text-[#333333]"
        }`}
      >
        {status}
      </p>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="border border-white/10 bg-[#333333] p-5">
      <p className="text-3xl font-extrabold">{value}</p>
      <p className="mt-2 text-sm font-semibold text-[#CCCCCC]">{label}</p>
    </div>
  );
}

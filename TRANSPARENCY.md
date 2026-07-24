# Echoverse Environments Transparency Doc

# OVERVIEW

Echoverse Environments is a set of four self-contained synthetic web
environments for evaluating computer-use agents. Two are deep domain
environments: EchoStay, a vacation-rental search and booking
application, and EchoForge, a code-hosting application. Two are
capability environments, each rendering a single hard-to-operate control
in many forms: a date-picker environment (six core widget types across
ten contexts, plus ten held-out widget types) and a nested-filter
environment (twenty widget families, plus nine held-out compound-panel
families). Each environment ships as a fully interactive application
with its own backend (FastAPI and SQLite), seeded database, and React
frontend. The environments are synthetic and Echo-branded; no real
products are referenced or named in the release.

Echoverse Benchmark Tasks is a dataset of approximately 720 evaluation
tasks across the four environments. Each task carries a
database-grounded verifier: an answer key minted from the environment
database by a SQL query at task generation and re-checked after the
agent finishes. It was developed to solve a gap in computer-use agent
evaluation, where success on stateful, multi-step, login-gated workflows
is hard to measure on the live web and is often graded from screenshots
rather than from application state.

# WHAT CAN ECHOVERSE DO

Echoverse Environments was developed to let any user bring their own
computer-use agent and have it evaluated against a set of rich, stateful
environments. The environments support browsing, application use, form
submission, file manipulation, and multi-step workflows. Grading is
grounded in the application database rather than in screen appearance: a
read task is graded on semantic equivalence to the stored value, a write
task on a real before/after database diff, and a read-write task on the
lower of the two.

Echoverse Benchmark Tasks is being released together with Echoverse
Environments to enable users to benchmark their own agents against
graded, verifiable tasks. This is a benchmark and framework release
only: no agents, no model weights, and no training tasks are included.
Users plug in their own AI models or agents and run them against the
environments we provide.

# INTENDED USES

Echoverse Environments is best suited for research evaluation of
computer-use agents on stateful web workflows, including closed,
login-gated interaction patterns (search, booking, issue and repository
workflows) and targeted control operation (date pickers and nested
filters, including held-out widget forms for out-of-distribution
measurement).

Echoverse Benchmark Tasks is intended to be used together with Echoverse
Environments, since each task is graded by a verifier that runs against
the corresponding environment database.

Echoverse Environments and Echoverse Benchmark Tasks are being shared
with the research community to facilitate reproduction of our results
and foster further research on high-fidelity simulated worlds for
computer-use agents.

Echoverse Environments and Echoverse Benchmark Tasks are intended to be
used by domain experts who are independently capable of evaluating the
quality of outputs before acting on them.

# OUT-OF-SCOPE USES

Echoverse Environments is released for evaluation, not training:
training tasks are not included in the release, and results obtained by
training on the released evaluation tasks would invalidate the
benchmark.

Echoverse Benchmark Tasks is not well suited for assessing agent
performance on open, live-web browsing, on domains outside the four
released environments, or on controls other than the two targeted
interaction types. The environments are synthetic stand-ins and do not
reproduce live-web conditions such as bot-blocking, rate limiting,
content drift, or page redesigns.

There are few or no instances of non-English content in this dataset. As
a result, Echoverse Benchmark Tasks should not be used to draw
conclusions about agent performance in other languages.

We do not recommend using Echoverse Environments or Echoverse Benchmark
Tasks in commercial or real-world applications without further testing
and development. They are being released for research purposes.

Echoverse Environments and Echoverse Benchmark Tasks were not designed
or evaluated for all possible downstream purposes. Developers should
consider their inherent limitations as they select use cases, and
evaluate and mitigate for accuracy, safety, and fairness concerns
specific to each intended downstream use.

Without further testing and development, Echoverse Environments and
Echoverse Benchmark Tasks should not be used in highly regulated domains
where inaccurate outputs could suggest actions that lead to injury or
negatively impact an individual's legal, financial, or life
opportunities.

We do not recommend using Echoverse Environments or Echoverse Benchmark
Tasks in the context of high-risk decision making (e.g. in law
enforcement, legal, finance, or healthcare).

# DATASET DETAILS

## DATASET CONTENTS

Echoverse Benchmark Tasks consists of approximately 720 instances (722)
of graded computer-use tasks across four environments. Each instance
represents a natural-language goal to be completed by an agent operating
the environment through its user interface.

Each instance includes the task goal, the environment it runs against,
and the exact database-grounded check that grades it (a value or state
change minted from the environment database by a SQL query at
generation).

Each instance is associated with a verifier describing the expected
outcome: reads are graded on semantic equivalence to the stored value,
writes on a before/after database diff, and read-write tasks on the
lower of the two. The capability environments each include an
in-distribution split and a held-out split of widget forms never used in
task generation for the training worlds.

The data was generated between Jan 2026 to July 2026. The environment
and data are self-contained and works out-of-the-box.

## DATA CREATION & PROCESSING

Echoverse Benchmark Tasks was created from scratch through an automated
environment-and-task pipeline, with one exception: the seed data for
EchoStay is adapted from InsideAirbnb, an existing public dataset of
vacation-rental listings, so EchoStay listings, hosts, reviews, and
amenities derive from real data rather than being invented.

The existing data that was used to seed EchoStay consisted of public
InsideAirbnb records: listings, host profiles, reviews, and amenities.
This data was originally collected by the InsideAirbnb project from
publicly available Airbnb pages. Similarly, EchoForge data is adapted
from WebArena Gitlab synthetic data to generate seeds for EchoForge
Tasks. The other two released environments (the date-picker environment,
and the nested-filter environment) use a synthetic pipeline to generate
rich tasks without any external dependency.

Environments were created by a semi-automated pipeline that expands seed
scenarios into a specification, compiles the specification into
machine-checkable claims about routes, state, and behavior, generates
the application, and repairs the database, backend, and frontend until
every claim passes. Tasks were created by grounding generated goals on
entities in the live environment database, then passing each goal
through a panel of automated analyzers checking that its entities exist,
the goal is plausible, its stated difficulty matches the work, and an
agent driving the real user interface can complete it. Failures were
tagged to the layer at fault (database, backend, frontend, task text, or
verifier), repaired by layer-specific automated fixers, and re-scored
against database ground truth until the pass rate plateaued.

Dataset creation was carried out by members of the research team using
automated methods, including AI model/agent-based generation, analysis,
and repair.

Echoverse Benchmark Tasks includes data derived from web-collected
sources only via the InsideAirbnb seed for EchoStay; the research team
did not crawl the web to build this release. InsideAirbnb supports
redistribution.

## PEOPLE & IDENTIFIERS

Data points in the EchoStay environment derive from real vacation-rental
listings, host profiles, and guest reviews, and therefore may correspond
to individual people's names, review text, and hosting activity. The
remaining three environments contain synthetically generated state.

The existing data that was used to seed EchoStay contained information
that could be used to directly or indirectly identify a person, such as
host first names and free-text review content with reviewer names.

Note: We are reusing InsideAirbnb dataset, which may contain PII. We
recommend our users to exercise discretion when using our datasets for
PII.

## SENSITIVE OR HARMFUL CONTENT

The existing data that was used to seed EchoStay did not contain
information that might be considered sensitive or private. InsideAirbnb
data is public listing data; review free text has not been screened for
sensitive categories.

The existing data that was used to seed EchoStay did not contain
information that might be considered offensive or insulting, or
otherwise cause emotional distress.

Sensitive information was screened and removed from the existing
dataset.

We performed an LLM based audit to screen and filter any harmful content
in the data.

The three environments with synthetically generated state (EchoForge,
date-picker, nested-filter) are not believed to contain sensitive,
private, offensive, or distressing content, as their data was generated
under controlled constraints for benign application domains.

## OTHER PROCESSING

Duplicate/redundant information was automatically removed.

The data was annotated with database-grounded verifiers. The annotation
was performed using automated methods: each verifier was minted from the
environment database by a SQL query at task generation, and every task
was checked for solvability by an automated agent driving the real user
interface in a browser before inclusion.

Tasks that failed validation were repaired or discarded through an
automated analyze-and-fix loop, with repairs rolled back if they
regressed the running application. Each surviving task is exported
carrying the exact check that grades it.

# HOW TO GET STARTED

To begin using Echoverse Environments and Echoverse Benchmark Tasks,
users bring their own agent, run each environment locally as a
self-contained application, and score results with the bundled
verifiers. More information can be found at
https://github.com/microsoft/Echoverse

# VALIDATION

To assess how effective Echoverse Benchmark Tasks would be at its
intended purpose, our team looked for three properties in every task:
the goal is grounded in entities that actually exist in the environment
database, the task is completable by an agent driving the real user
interface, and the verifier that grades it agrees with database ground
truth.

Specifically, we passed every generated goal through a panel of
automated analyzers (entity existence, plausibility, difficulty match,
and an in-browser solvability check), tagged each failure to the layer
at fault, applied layer-specific automated repairs, and re-scored
against database ground truth until the pass rate stopped climbing. We
additionally ran basic adversarial sanity checks, including behavior
when a task cannot be solved or is not supported by the environment.

# EVALUATION

Echoverse Environments was evaluated on its ability to measure and
differentiate computer-use agent performance on stateful, multi-step
workflows, and on whether training signal drawn from these environments
reflects real capability rather than environment defects.

## EVALUATION METHODS

We used task success rate, graded by the database-grounded verifiers, to
measure agent performance in each environment.

We compared the performance of a base model (Qwen3.5-9B, lightly aligned
to the browser action space), the same 9B model trained on trajectories
from the full internal environment suite, and GPT-5.4 as a frontier
reference, across the internal suite of fourteen environments, of which
the four in this release are a subset. Transfer was additionally
measured on the public WebVoyager and Online-Mind2Web benchmarks.

The models used for evaluation were Qwen3.5-9B and GPT-5.4. Results may
vary if the environments are used with a different model or agent based
on its unique design, configuration and training. No model weights are
included in this release.

For adversarial and robustness testing, we ran basic sanity checks
covering unsolvable and unsupported tasks, and separately validated
environment integrity by tracing agent failures to their source:
environment defects (for example, a broken guest-count control in
EchoStay), verifier drift, and task infeasibility were repaired rather
than attributed to the agent.

## EVALUATION RESULTS

At a high level, we found that the environments produce a wide, stable
spread between agents: on EchoStay, GPT-5.4 reaches 50.4% task success
while a corpus-trained 9B model reaches 38.5% (up from 16.2% on an
earlier environment version), and on the nested-filter environment the
trained 9B model matches or exceeds the frontier reference, including on
held-out widget families never seen in training. Environment repairs
measurably improved task gradability (for example, fixing one EchoStay
control raised the share of completable booking tasks from 48% to 78%).

# LIMITATIONS

## CODE

Echoverse Environments was developed for research and experimental
purposes. Further testing and validation are needed before considering
its application in commercial or real-world scenarios.

Echoverse Environments was designed and tested using the English
language. Performance in other languages may vary and should be assessed
by someone who is both an expert in the expected outputs and a native
speaker of that language.

The environments, tasks, and verifiers were generated and repaired by an
automated, AI-assisted pipeline. Outputs generated by AI may include
factual errors, fabrication, or speculation, and residual defects may
remain despite the validation loop. Users are responsible for assessing
the accuracy of results obtained with the benchmark, and all decisions
leveraging those results should be made with human oversight.

The environments are synthetic and fixed in time. They trade surface
realism for control: they do not reproduce live-web conditions such as
content drift, page redesigns, bot-blocking, or rate limiting, and
scores obtained in them are not directly comparable to live-web scores.

This release contains no agents and no model weights; users plug in
their own. Sandboxing of the user's own agent, and any isolation between
that agent and the user's broader system, is the user's responsibility.
The environments themselves are self-contained local applications.

There has not been a systematic effort to ensure that systems using
Echoverse Environments are protected from security vulnerabilities such
as indirect prompt injection attacks. Environment content has not been
security-audited as agent input. Any systems using it should take
proactive measures to harden their systems as appropriate.

## DATA

Echoverse Benchmark Tasks was developed for research and experimental
purposes. Further testing and validation are needed before considering
its application in commercial or real-world scenarios.

Echoverse Benchmark Tasks consists of English language instances only.

Echoverse Benchmark Tasks is an evaluation-only release: training tasks
are not included, and the nearly 720 released tasks cover four
environments out of the larger internal suite. Conclusions drawn from it
are limited to the domains and controls it covers (rental booking, code
hosting, date pickers, nested filters).

There are few or no instances of open-web, read-mostly browsing tasks in
the dataset. As a result, Echoverse Benchmark Tasks is not expected to
predict performance on public-site browsing benchmarks.

EchoStay reflects a fixed snapshot of InsideAirbnb seed data and will
not track changes to real-world rental listings.

Echoverse Benchmark Tasks has not been systematically evaluated for
sociocultural/economic/demographic/linguistic bias. Developers should
consider the potential for bias as they select use cases, and evaluate
and mitigate for accuracy, safety, and fairness concerns specific to
each intended downstream use.

Echoverse Benchmark Tasks should not be used in highly regulated domains
where inaccurate or incomplete outputs could suggest actions that lead
to injury or negatively impact an individual's legal, financial, or life
opportunities.

Echoverse Benchmark Tasks is model-agnostic by design: it was developed
for use with any computer-use agent the user supplies, and no reference
agent or model card ships with the release.

# BEST PRACTICES

Better benchmark validity can be achieved by keeping the released
evaluation tasks out of any training data. The capability environments
include held-out widget splits specifically for out-of-distribution
measurement; report in-distribution and held-out results separately.

Run each environment locally and score with the bundled
database-grounded verifiers rather than screenshot-based judging; the
verifiers are the ground truth the tasks were built against.

We strongly encourage users to use LLMs/MLLMs that support robust
Responsible AI mitigations, such as Azure Open AI (AOAI) services. Such
services continually update their safety and RAI mitigations with the
latest industry standards for responsible use. For more on AOAI's best
practices when employing foundations models for scripts and
applications:

  - What is Azure AI Content Safety?
    (https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview)

  - Overview of Responsible AI practices for Azure OpenAI models
    (https://learn.microsoft.com/en-us/legal/cognitive-services/openai/overview)

  - Azure OpenAI Transparency Note
    (https://learn.microsoft.com/en-us/legal/cognitive-services/openai/transparency-note)

  - OpenAI's Usage policies (https://openai.com/policies/usage-policies)

  - Azure OpenAI's Code of Conduct
    (https://learn.microsoft.com/en-us/legal/cognitive-services/openai/code-of-conduct)

It is the user's responsibility to ensure that the use of Echoverse
Environments and Echoverse Benchmark Tasks complies with relevant data
protection regulations and organizational guidelines.

# LICENSE

MIT License. See [LICENSE](LICENSE).

Nothing disclosed here, including the Out of Scope Uses section, should
be interpreted as or deemed a restriction or modification to the license
the code is released under.

# TRADEMARKS

All environments in this release use original Echo-branded names; no
real products are referenced or named. This project may contain
trademarks or logos for projects, products, or services. Authorized use
of Microsoft trademarks or logos is subject to and must follow
Microsoft's Trademark & Brand Guidelines. Use of Microsoft trademarks
or logos in modified versions of this project must not cause confusion
or imply Microsoft sponsorship. Any use of third-party trademarks or
logos are subject to those third-party's policies.

# ETHICS

No human data collection, human annotation, or study participation was
conducted for this release; environments and tasks were created by the
research team using automated methods, and no annotators or contributors
were engaged or compensated.

# CONTACT

This research was conducted by members of Microsoft Research. We welcome
feedback and collaboration from our audience. If you have suggestions,
questions, or observe unexpected/offensive behavior in our technology,
please contact us at Akshay.Nambi@microsoft.com, yashpandya@microsoft.com,
or kchourasia@microsoft.com.

If the team receives reports of undesired behavior/content or identifies
issues independently, we will update this repository with appropriate
mitigations.

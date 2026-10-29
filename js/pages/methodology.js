/**
 * PAGE 8 — Methodology & Transparency (Intelly Aesthetic)
 * Explains 7-step pipeline, math, and disclaimers styled with Intelly warm canvas, white rounded-3xl cards, and pastel accents.
 */

export function renderMethodology(container) {
  container.innerHTML = `
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center text-xs text-textMuted font-medium mb-1">
        <a href="#dashboard" class="hover:text-textMain transition-colors">OutlookIQ</a>
        <i class="fas fa-chevron-right mx-2 text-[9px]"></i>
        <span class="text-textMain font-semibold">Methodology</span>
      </div>
      <h2 class="text-2xl font-bold text-textMain">How OutlookIQ Works</h2>
      <p class="text-textMuted text-xs mt-1">A transparent guide to our 7-step extraction pipeline, deterministic evaluation formulas, and ethics standards.</p>
    </div>

    <!-- 7-Step Visual Pipeline -->
    <div class="bg-cardWhite rounded-3xl p-6 mb-6 intelly-shadow border border-gray-100">
      <div class="mb-5">
        <h3 class="text-base font-bold text-textMain">The OutlookIQ 7-Step Intelligence Pipeline</h3>
        <p class="text-xs text-textMuted mt-0.5">From unstructured SEC transcripts to audited forecast scorecards</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-bgLight rounded-2xl p-4 text-center">
          <div class="w-10 h-10 rounded-full bg-pastelPink/40 text-sidebarDark font-mono text-sm font-bold flex items-center justify-center mx-auto mb-2">01</div>
          <h4 class="text-xs font-bold text-textMain mb-1">Ingest Filings</h4>
          <p class="text-[11px] text-textMuted leading-relaxed">Continuous collection of historical Form 10-K, 10-Q, 8-K filings, and verbatim call transcripts.</p>
        </div>

        <div class="bg-bgLight rounded-2xl p-4 text-center">
          <div class="w-10 h-10 rounded-full bg-pastelGreen text-green-900 font-mono text-sm font-bold flex items-center justify-center mx-auto mb-2">02</div>
          <h4 class="text-xs font-bold text-textMain mb-1">RAG Retrieval</h4>
          <p class="text-[11px] text-textMuted leading-relaxed">Semantic vector retrieval identifies forward-looking management guidance passages and executive remarks.</p>
        </div>

        <div class="bg-bgLight rounded-2xl p-4 text-center">
          <div class="w-10 h-10 rounded-full bg-pastelBlue text-blue-900 font-mono text-sm font-bold flex items-center justify-center mx-auto mb-2">03</div>
          <h4 class="text-xs font-bold text-textMain mb-1">Structured Extraction</h4>
          <p class="text-[11px] text-textMuted leading-relaxed">Extract numerical corridors (lower, upper, midpoint), announcement dates, and specific reporting periods.</p>
        </div>

        <div class="bg-bgLight rounded-2xl p-4 text-center">
          <div class="w-10 h-10 rounded-full bg-pastelYellow text-yellow-900 font-mono text-sm font-bold flex items-center justify-center mx-auto mb-2">04</div>
          <h4 class="text-xs font-bold text-textMain mb-1">Match Actuals</h4>
          <p class="text-[11px] text-textMuted leading-relaxed">Cross-reference subsequently filed periodic financial statements to locate official reported figures.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <div class="bg-bgLight rounded-2xl p-4 text-center">
          <div class="w-10 h-10 rounded-full bg-pastelPink/40 text-sidebarDark font-mono text-sm font-bold flex items-center justify-center mx-auto mb-2">05</div>
          <h4 class="text-xs font-bold text-textMain mb-1">Calendar Normalization</h4>
          <p class="text-[11px] text-textMuted leading-relaxed">Normalize differing corporate fiscal calendars, metric definitions, and accounting currencies.</p>
        </div>

        <div class="bg-bgLight rounded-2xl p-4 text-center">
          <div class="w-10 h-10 rounded-full bg-pastelGreen text-green-900 font-mono text-sm font-bold flex items-center justify-center mx-auto mb-2">06</div>
          <h4 class="text-xs font-bold text-textMain mb-1">Deterministic Math</h4>
          <p class="text-[11px] text-textMuted leading-relaxed">Compute exact percentage deviations, boundary checks, and outcome classifications with deterministic algorithms.</p>
        </div>

        <div class="bg-bgLight rounded-2xl p-4 text-center">
          <div class="w-10 h-10 rounded-full bg-pastelBlue text-blue-900 font-mono text-sm font-bold flex items-center justify-center mx-auto mb-2">07</div>
          <h4 class="text-xs font-bold text-textMain mb-1">Audit Trail & Evidence</h4>
          <p class="text-[11px] text-textMuted leading-relaxed">Display verifiable results alongside exact transcript citations in the Evidence Drawer.</p>
        </div>
      </div>
    </div>

    <!-- Explanatory Knowledge Cards (3 columns) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <div class="bg-cardWhite rounded-3xl p-6 intelly-shadow border border-gray-100">
        <div class="w-10 h-10 rounded-2xl bg-pastelBlue text-blue-800 flex items-center justify-center mb-4">
          <i class="fas fa-ruler-combined text-sm"></i>
        </div>
        <h3 class="text-sm font-bold text-textMain mb-2">What Counts as Guidance?</h3>
        <p class="text-xs text-textMuted leading-relaxed">
          OutlookIQ tracks formal forward-looking statements made by authorized corporate officers (CEO or CFO) in SEC filings, shareholder letters, or official earnings presentations. Statements must convey explicit quantitative parameters rather than generic qualitative sentiment.
        </p>
      </div>

      <div class="bg-cardWhite rounded-3xl p-6 intelly-shadow border border-gray-100">
        <div class="w-10 h-10 rounded-2xl bg-pastelGreen text-green-800 flex items-center justify-center mb-4">
          <i class="fas fa-balance-scale text-sm"></i>
        </div>
        <h3 class="text-sm font-bold text-textMain mb-2">Exceeded vs Met vs Missed</h3>
        <div class="bg-bgLight p-3.5 rounded-2xl text-[11px] font-mono text-textMain leading-relaxed mb-2">
          <strong class="text-green-700">Higher-is-better (e.g. Revenue):</strong><br>
          • Exceeded: Actual &gt; Upper Bound<br>
          • Met: Lower &le; Actual &le; Upper<br>
          • Missed: Actual &lt; Lower Bound<br><br>
          <strong class="text-blue-700">Lower-is-better (Expenses):</strong><br>
          • Exceeded: Actual &lt; Lower (Savings)<br>
          • Met: Lower &le; Actual &le; Upper<br>
          • Missed: Actual &gt; Upper (Overrun)
        </div>
      </div>

      <div class="bg-cardWhite rounded-3xl p-6 intelly-shadow border border-gray-100">
        <div class="w-10 h-10 rounded-2xl bg-pastelYellow text-yellow-900 flex items-center justify-center mb-4">
          <i class="fas fa-bullseye text-sm"></i>
        </div>
        <h3 class="text-sm font-bold text-textMain mb-2">Ranges & Tolerance</h3>
        <p class="text-xs text-textMuted leading-relaxed mb-3">
          When companies state single-point estimates, OutlookIQ calculates deviation strictly against that point. When a corridor is specified, results landing anywhere within the bracket are classified as "Met".
        </p>
        <div class="bg-bgLight p-2.5 rounded-xl text-[11px] font-mono text-textMain font-semibold text-center">
          Deviation % = ((Actual - Midpoint) / Midpoint) &times; 100
        </div>
      </div>

      <div class="bg-cardWhite rounded-3xl p-6 intelly-shadow border border-gray-100">
        <div class="w-10 h-10 rounded-2xl bg-pastelPink text-pink-900 flex items-center justify-center mb-4">
          <i class="fas fa-certificate text-sm"></i>
        </div>
        <h3 class="text-sm font-bold text-textMain mb-2">Source Provenance</h3>
        <p class="text-xs text-textMuted leading-relaxed">
          Every evaluated promise is indexed with the source document title, filing type, announcement date, and exact quote. OutlookIQ enforces strict provenance rules: if an actual result cannot be mapped to an authoritative filing, the record is flagged as "Pending" or "Unverifiable".
        </p>
      </div>

      <div class="bg-cardWhite rounded-3xl p-6 intelly-shadow border border-gray-100">
        <div class="w-10 h-10 rounded-2xl bg-pastelYellow text-yellow-900 flex items-center justify-center mb-4">
          <i class="fas fa-exclamation-triangle text-sm"></i>
        </div>
        <h3 class="text-sm font-bold text-textMain mb-2">Limitations of Automation</h3>
        <p class="text-xs text-textMuted leading-relaxed">
          Automated financial extraction can be affected by mid-quarter guidance revisions, foreign currency translation swings, restatements, or changes in accounting standards (e.g. ASC 606 revenue adjustments). Analysts should always inspect the source evidence in the Evidence Drawer.
        </p>
      </div>

      <div class="bg-cardWhite rounded-3xl p-6 intelly-shadow border border-gray-100">
        <div class="w-10 h-10 rounded-2xl bg-pastelGreen text-green-900 flex items-center justify-center mb-4">
          <i class="fas fa-shield-alt text-sm"></i>
        </div>
        <h3 class="text-sm font-bold text-textMain mb-2">Ethical Safeguards</h3>
        <p class="text-xs text-textMuted leading-relaxed">
          <strong class="text-textMain">Crucial Principle:</strong> An inaccurate forecast or missed guidance does not inherently imply management dishonesty. Macro volatility and supply shocks routinely alter execution. OutlookIQ presents quantitative facts, not ethical judgments.
        </p>
      </div>
    </div>
  `;
}

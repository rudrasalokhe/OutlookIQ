/**
 * PAGE 8 — Methodology & Standards (Neo-Brutalist Design)
 * Explains 7-step RAG extraction pipeline, deterministic math, and provenance ethics.
 */

export function renderMethodology(container) {
  container.innerHTML = `
    <!-- Header -->
    <header class="header">
      <div class="header-title">
        <h1>Methodology & Standards</h1>
        <div class="badge">Deterministic Provenance</div>
        <span style="margin-left: 12px; font-weight: 700; font-size: 0.9rem;">Algorithmic Integrity, Hybrid RAG Extraction & Ethical Standards</span>
      </div>
      <div class="header-actions">
        <span class="badge" style="background: var(--main-teal);">ISO-Financial Compliance</span>
      </div>
    </header>

    <!-- 7-Step Visual Pipeline -->
    <div class="brutal-card" style="margin-bottom: 24px;">
      <div style="margin-bottom: 16px; border-bottom: 2px solid var(--border-color); padding-bottom: 12px;">
        <h3 style="font-size: 1.25rem; font-weight: 700; text-transform: uppercase;">The OutlookIQ 7-Step Intelligence Pipeline</h3>
        <p style="font-weight: 600; font-size: 0.85rem; color: #666; margin-top: 4px;">From raw SEC Form 10-K/Q filings & earnings calls to audited scorecards</p>
      </div>

      <div class="grid-4" style="margin-bottom: 16px;">
        <div class="brutal-card bg-yellow" style="padding: 16px;">
          <div class="stat-label" style="font-size: 0.75rem;">Stage 01</div>
          <h4 style="font-size: 1.1rem; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">Ingest Filings</h4>
          <p style="font-size: 0.8rem; font-weight: 600; line-height: 1.4;">Automated indexing of Form 10-K, 10-Q, 8-K filings, and verbatim earnings call transcripts.</p>
        </div>

        <div class="brutal-card" style="padding: 16px;">
          <div class="stat-label" style="font-size: 0.75rem;">Stage 02</div>
          <h4 style="font-size: 1.1rem; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">Hybrid RAG</h4>
          <p style="font-size: 0.8rem; font-weight: 600; line-height: 1.4;">Dense cosine vector retrieval fused with sparse lexical BM25-style scoring to isolate guidance remarks.</p>
        </div>

        <div class="brutal-card" style="padding: 16px;">
          <div class="stat-label" style="font-size: 0.75rem;">Stage 03</div>
          <h4 style="font-size: 1.1rem; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">Extraction</h4>
          <p style="font-size: 0.8rem; font-weight: 600; line-height: 1.4;">Extract numerical corridors (lower, upper, midpoint), announcement dates, and accounting units.</p>
        </div>

        <div class="brutal-card bg-teal" style="padding: 16px;">
          <div class="stat-label" style="font-size: 0.75rem;">Stage 04</div>
          <h4 style="font-size: 1.1rem; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">Match Actuals</h4>
          <p style="font-size: 0.8rem; font-weight: 600; line-height: 1.4;">Cross-reference subsequent Form 10-Q periodic financial statements to locate audited reported figures.</p>
        </div>
      </div>

      <div class="grid-3">
        <div class="brutal-card" style="padding: 16px;">
          <div class="stat-label" style="font-size: 0.75rem;">Stage 05</div>
          <h4 style="font-size: 1.1rem; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">Calendar Normalization</h4>
          <p style="font-size: 0.8rem; font-weight: 600; line-height: 1.4;">Align fiscal year offsets (e.g. Nvidia FY ends January, Microsoft ends June) to common calendar periods.</p>
        </div>

        <div class="brutal-card bg-pink" style="padding: 16px;">
          <div class="stat-label" style="font-size: 0.75rem;">Stage 06</div>
          <h4 style="font-size: 1.1rem; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">Deterministic Math</h4>
          <p style="font-size: 0.8rem; font-weight: 600; line-height: 1.4;">Zero hallucination: compute percentage variance, boundary checks, and outcome classifications with pure math.</p>
        </div>

        <div class="brutal-card bg-yellow" style="padding: 16px;">
          <div class="stat-label" style="font-size: 0.75rem;">Stage 07</div>
          <h4 style="font-size: 1.1rem; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">Audit Trail Drawer</h4>
          <p style="font-size: 0.8rem; font-weight: 600; line-height: 1.4;">Provide verbatim quotes, document IDs, and full calculation telemetry in the slide-out Evidence Drawer.</p>
        </div>
      </div>
    </div>

    <!-- Explanatory Knowledge Cards (3 columns) -->
    <div class="grid-3" style="margin-bottom: 24px;">
      <div class="brutal-card">
        <div class="stat-label">Formal Definition</div>
        <h3 style="font-size: 1.15rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">What Counts as Guidance?</h3>
        <p style="font-size: 0.85rem; font-weight: 600; line-height: 1.5; color: #333;">
          OutlookIQ tracks formal forward-looking statements made by authorized corporate officers (CEO or CFO) in SEC filings, shareholder letters, or official earnings presentations. Statements must convey explicit quantitative parameters rather than generic qualitative sentiment.
        </p>
      </div>

      <div class="brutal-card bg-yellow">
        <div class="stat-label">Classification Logic</div>
        <h3 style="font-size: 1.15rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Exceeded vs Met vs Missed</h3>
        <div class="brutal-border" style="background: #fff; padding: 12px; font-size: 0.8rem; font-weight: 700; line-height: 1.5;">
          <strong style="color: #000;">Higher-is-better (Revenue, EPS):</strong><br>
          • Exceeded: Actual &gt; Upper Bound<br>
          • Met: Lower &le; Actual &le; Upper<br>
          • Missed: Actual &lt; Lower Bound<br><br>
          <strong style="color: #000;">Lower-is-better (Expenses):</strong><br>
          • Exceeded: Actual &lt; Lower (Cost Savings)<br>
          • Met: Lower &le; Actual &le; Upper<br>
          • Missed: Actual &gt; Upper (Cost Overrun)
        </div>
      </div>

      <div class="brutal-card">
        <div class="stat-label">Mathematical Formula</div>
        <h3 style="font-size: 1.15rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Tolerance & Deviation</h3>
        <p style="font-size: 0.85rem; font-weight: 600; line-height: 1.5; color: #333; margin-bottom: 12px;">
          When companies state single-point estimates, OutlookIQ calculates deviation strictly against that point. When a corridor is specified, results landing anywhere within the bracket are classified as "Met".
        </p>
        <div class="brutal-border" style="padding: 10px; background: #fff; text-align: center; font-weight: 700; font-size: 0.85rem;">
          Variance % = ((Actual - Midpoint) / Midpoint) &times; 100
        </div>
      </div>
    </div>

    <!-- Bottom Ethics Row -->
    <div class="grid-3">
      <div class="brutal-card">
        <div class="stat-label">Source Provenance</div>
        <h3 style="font-size: 1.15rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Filing Provenance</h3>
        <p style="font-size: 0.85rem; font-weight: 600; line-height: 1.5; color: #333;">
          Every evaluated promise is indexed with the source document title, filing type, announcement date, and exact quote. OutlookIQ enforces strict provenance rules: if an actual result cannot be mapped to an authoritative filing, the record is flagged as "Pending" or "Unverifiable".
        </p>
      </div>

      <div class="brutal-card bg-pink">
        <div class="stat-label">Edge Cases</div>
        <h3 style="font-size: 1.15rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Accounting Revisions</h3>
        <p style="font-size: 0.85rem; font-weight: 600; line-height: 1.5; color: #111;">
          Financial extraction can be affected by mid-quarter guidance revisions, foreign currency translation swings, or restatements under ASC 606. Analysts should always inspect the verbatim context in the Evidence Drawer.
        </p>
      </div>

      <div class="brutal-card bg-teal">
        <div class="stat-label">Ethical Standard</div>
        <h3 style="font-size: 1.15rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">Objective Reporting</h3>
        <p style="font-size: 0.85rem; font-weight: 600; line-height: 1.5; color: #111;">
          An inaccurate forecast or missed guidance does not imply management dishonesty. Macro volatility and supply shocks alter execution. OutlookIQ presents quantitative facts, not ethical accusations.
        </p>
      </div>
    </div>
  `;
}

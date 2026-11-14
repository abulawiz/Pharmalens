import Link from "next/link";
import { Camera, ChevronRight, Eye, FileWarning, PackageSearch, ScanLine, ShieldCheck } from "@/components/icons";
import { Logo } from "@/components/logo";
import { OutcomeCard } from "@/components/outcome-card";
import { SCREENING_DISCLAIMER } from "@/lib/screening";

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-header">
        <Logo />
        <nav aria-label="Public navigation">
          <Link href="#how">How it works</Link>
          <Link href="/help">Help & FAQs</Link>
          <Link href="/login">Log in</Link>
          <Link className="button button-primary" href="/signup">
            Create account
          </Link>
        </nav>
        <Link className="mobile-login" href="/login">
          Log in
        </Link>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="pill">
              <ShieldCheck size={15} /> Instant Medicine Packaging Verification
            </span>
            <h1>
              Scan the pack.<br />
              <em>Spot the signs.</em>
            </h1>
            <p>
              Take a quick photo of any medicine pack to read its label, check batch and expiry dates, and compare against registered medicine records.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/scan">
                <Camera size={19} /> Scan a package
              </Link>
              <Link className="button button-secondary" href="/signup">
                Create free account <ChevronRight size={18} />
              </Link>
            </div>
            <div className="guest-note">
              <ShieldCheck size={18} />
              <span>
                <strong>No account required to scan.</strong> Scans stay privately on your device. Sign in for cloud history and pharmacist review tracking.
              </span>
            </div>
          </div>
          <div className="hero-visual" aria-label="PharmaLens screening preview">
            <div className="phone">
              <div className="phone-bar">
                <span>9:41</span>
                <i></i>
              </div>
              <div className="phone-head">
                <Logo compact />
                <span>Package scan</span>
                <i>•••</i>
              </div>
              <div className="camera-preview">
                <div className="pack">
                  <span>SAMPLE PACK</span>
                  <strong>Paracetamol 500mg</strong>
                  <small>Batch • Expiry • NAFDAC</small>
                </div>
                <span className="corner c1"></span>
                <span className="corner c2"></span>
                <span className="corner c3"></span>
                <span className="corner c4"></span>
                <div className="scan-beam"></div>
              </div>
              <div className="preview-result">
                <span className="eyebrow">Preliminary check</span>
                <OutcomeCard outcome="unable_to_verify" compact />
              </div>
            </div>
            <div className="floating-card">
              <ScanLine size={20} />
              <span>
                <strong>Label text detected</strong>
                <small>Review details before screening</small>
              </span>
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <p>{SCREENING_DISCLAIMER}</p>
          <span>Medicine identification</span>
          <span>Packaging verification</span>
          <span>Expiry date checking</span>
          <span>NAFDAC registration check</span>
        </section>

        <section className="landing-section" id="how">
          <div className="section-intro">
            <span className="eyebrow">Simple & Transparent</span>
            <h2>
              Verify medicine packaging<br />
              in three simple steps.
            </h2>
            <p>PharmaLens puts you in control. Review detected text before checking against reference standards.</p>
          </div>
          <div className="steps">
            <article>
              <span>01</span>
              <div className="step-icon">
                <Camera />
              </div>
              <h3>Take a photo of the pack</h3>
              <p>Use your phone camera or upload a clear photo. Keep the label flat and well-lit.</p>
            </article>
            <article>
              <span>02</span>
              <div className="step-icon">
                <Eye />
              </div>
              <h3>Review detected details</h3>
              <p>Verify the medicine name, batch number, expiry date, and registration number.</p>
            </article>
            <article>
              <span>03</span>
              <div className="step-icon">
                <PackageSearch />
              </div>
              <h3>Get clear results</h3>
              <p>See immediately whether packaging details match verified records or need pharmacist review.</p>
            </article>
          </div>
        </section>

        <section className="outcomes-section">
          <div>
            <span className="eyebrow">Clear Results</span>
            <h2>
              Three outcomes.<br />
              No false promises.
            </h2>
            <p>
              An image can reveal visible discrepancies and packaging differences. It does not test chemical composition or substitute for a licensed healthcare provider.
            </p>
            <Link href="/limitations" className="text-link">
              Read our screening limitations <ChevronRight size={15} />
            </Link>
          </div>
          <div className="outcome-stack">
            <OutcomeCard outcome="reference_match" />
            <OutcomeCard outcome="needs_review" />
            <OutcomeCard outcome="unable_to_verify" />
          </div>
        </section>

        <section className="responsible">
          <div className="responsible-icon">
            <FileWarning />
          </div>
          <div>
            <span className="eyebrow">If something looks wrong</span>
            <h2>Notice something suspicious? Report for review.</h2>
            <p>
              Save your scan details and submit a report for pharmacist review. Your data is stored securely and never forwarded externally without your consent.
            </p>
          </div>
          <Link className="button button-secondary" href="/signup">
            Create an account
          </Link>
        </section>
      </main>
      <footer>
        <div>
          <Logo />
          <p>Preliminary packaging screening for Nigeria.</p>
        </div>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/limitations">Limitations</Link>
          <Link href="/help">Help & FAQs</Link>
        </div>
        <small>© {new Date().getFullYear()} PharmaLens. Not a medical or regulatory authority.</small>
      </footer>
    </div>
  );
}

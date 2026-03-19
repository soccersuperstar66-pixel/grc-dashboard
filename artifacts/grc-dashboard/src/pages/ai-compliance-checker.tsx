import { useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Scan,
  Trash2,
  ClipboardPaste,
  Eye,
  EyeOff,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Detection rules ─────────────────────────────────────────────────────────

type Severity = "critical" | "high" | "medium";

interface Rule {
  id: string;
  label: string;
  category: "pii" | "credentials" | "confidential";
  severity: Severity;
  patterns: RegExp[];
  keywords?: string[];
}

const RULES: Rule[] = [
  // ── PII ──────────────────────────────────────────────────────────────────
  {
    id: "ssn",
    label: "Social Security Number",
    category: "pii",
    severity: "critical",
    patterns: [
      /\b(?!000|666|9\d{2})\d{3}[- ](?!00)\d{2}[- ](?!0000)\d{4}\b/g,
    ],
  },
  {
    id: "credit_card",
    label: "Credit Card Number",
    category: "pii",
    severity: "critical",
    patterns: [
      /\b(?:4\d{12}(?:\d{3})?|[25][1-7]\d{14}|6(?:011|5\d{2})\d{12}|3[47]\d{13}|3(?:0[0-5]|[68]\d)\d{11}|(?:2131|1800|35\d{3})\d{11})\b/g,
    ],
  },
  {
    id: "email",
    label: "Email Address",
    category: "pii",
    severity: "medium",
    patterns: [
      /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g,
    ],
  },
  {
    id: "phone",
    label: "Phone Number",
    category: "pii",
    severity: "medium",
    patterns: [
      /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g,
    ],
  },
  {
    id: "dob",
    label: "Date of Birth / Date Pattern",
    category: "pii",
    severity: "medium",
    patterns: [
      /\b(?:DOB|date of birth|born on|born:)\s*:?\s*\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/gi,
    ],
  },
  {
    id: "ip_address",
    label: "IP Address",
    category: "pii",
    severity: "medium",
    patterns: [
      /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    ],
  },
  {
    id: "passport",
    label: "Passport / Government ID",
    category: "pii",
    severity: "critical",
    patterns: [
      /\b(?:passport|passport\s*no|passport\s*#|passport\s*number)\s*:?\s*[A-Z]{1,2}\d{6,9}\b/gi,
    ],
  },
  // ── Credentials ──────────────────────────────────────────────────────────
  {
    id: "api_key_generic",
    label: "API Key / Token",
    category: "credentials",
    severity: "critical",
    patterns: [
      /\b(?:api[_\-]?key|api[_\-]?token|access[_\-]?token|auth[_\-]?token)\s*[:=]\s*["']?[A-Za-z0-9\-_.+/]{16,}["']?/gi,
      /\bsk-[A-Za-z0-9]{20,}/g,          // OpenAI secret key
      /\bpk_(?:live|test)_[A-Za-z0-9]{24,}/g, // Stripe publishable key
      /\bsk_(?:live|test)_[A-Za-z0-9]{24,}/g, // Stripe secret key
      /\bghp_[A-Za-z0-9]{36}\b/g,        // GitHub PAT
      /\bgho_[A-Za-z0-9]{36}\b/g,        // GitHub OAuth token
      /\bAKIA[0-9A-Z]{16}\b/g,           // AWS access key
    ],
  },
  {
    id: "password",
    label: "Password / Secret",
    category: "credentials",
    severity: "critical",
    patterns: [
      /\b(?:password|passwd|pwd|secret|private[_\-]?key)\s*[:=]\s*["']?.{4,}["']?/gi,
    ],
  },
  {
    id: "connection_string",
    label: "Database / Connection String",
    category: "credentials",
    severity: "critical",
    patterns: [
      /(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis|amqp):\/\/[^\s"']+/gi,
      /\bData\s+Source\s*=.+(?:Password|Pwd)\s*=[^;]+/gi,
    ],
  },
  {
    id: "private_key_block",
    label: "Private Key Block",
    category: "credentials",
    severity: "critical",
    patterns: [
      /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
    ],
  },
  {
    id: "jwt",
    label: "JWT Token",
    category: "credentials",
    severity: "high",
    patterns: [
      /\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\b/g,
    ],
  },
  // ── Confidential keywords ─────────────────────────────────────────────────
  {
    id: "confidential_label",
    label: "Confidential Document Label",
    category: "confidential",
    severity: "high",
    patterns: [],
    keywords: [
      "confidential", "strictly confidential", "top secret", "classified",
      "internal only", "internal use only", "do not distribute",
      "not for distribution", "privileged", "attorney-client",
    ],
  },
  {
    id: "nda_legal",
    label: "NDA / Legal Agreement",
    category: "confidential",
    severity: "high",
    patterns: [],
    keywords: [
      "non-disclosure agreement", "nda", "trade secret", "proprietary",
      "confidentiality agreement", "binding agreement", "intellectual property",
    ],
  },
  {
    id: "financial_sensitive",
    label: "Sensitive Financial Information",
    category: "confidential",
    severity: "high",
    patterns: [],
    keywords: [
      "unreported earnings", "insider information", "material non-public",
      "mnpi", "pre-announcement", "unaudited financials",
    ],
  },
];

// ── Scanner logic ─────────────────────────────────────────────────────────────

interface Finding {
  ruleId: string;
  label: string;
  category: Rule["category"];
  severity: Severity;
  matches: string[];
  count: number;
}

function scanText(text: string): Finding[] {
  if (!text.trim()) return [];

  const findings: Finding[] = [];
  const lowerText = text.toLowerCase();

  for (const rule of RULES) {
    const allMatches: string[] = [];

    // Regex patterns
    for (const pattern of rule.patterns) {
      const cloned = new RegExp(pattern.source, pattern.flags);
      const found = text.match(cloned) ?? [];
      allMatches.push(...found);
    }

    // Keyword matching (whole-word, case-insensitive)
    for (const kw of rule.keywords ?? []) {
      const idx = lowerText.indexOf(kw.toLowerCase());
      if (idx !== -1) {
        allMatches.push(text.slice(idx, idx + kw.length));
      }
    }

    if (allMatches.length > 0) {
      const unique = [...new Set(allMatches)];
      findings.push({
        ruleId: rule.id,
        label: rule.label,
        category: rule.category,
        severity: rule.severity,
        matches: unique.slice(0, 5), // cap display to 5
        count: allMatches.length,
      });
    }
  }

  // Sort: critical → high → medium
  const severityOrder: Record<Severity, number> = { critical: 0, high: 1, medium: 2 };
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return findings;
}

// ── UI helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<Rule["category"], string> = {
  pii: "PII",
  credentials: "Credentials",
  confidential: "Confidential",
};

const SEVERITY_STYLES: Record<Severity, { badge: string; border: string; bg: string; text: string }> = {
  critical: {
    badge: "bg-red-100 text-red-700 border border-red-200",
    border: "border-l-red-500",
    bg: "bg-red-50/60",
    text: "text-red-700",
  },
  high: {
    badge: "bg-orange-100 text-orange-700 border border-orange-200",
    border: "border-l-orange-500",
    bg: "bg-orange-50/60",
    text: "text-orange-700",
  },
  medium: {
    badge: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    border: "border-l-yellow-500",
    bg: "bg-yellow-50/60",
    text: "text-yellow-700",
  },
};

const CATEGORY_BADGE: Record<Rule["category"], string> = {
  pii: "bg-purple-100 text-purple-700 border border-purple-200",
  credentials: "bg-blue-100 text-blue-700 border border-blue-200",
  confidential: "bg-slate-100 text-slate-700 border border-slate-200",
};

function maskValue(val: string): string {
  if (val.length <= 4) return "****";
  return val.slice(0, 2) + "****" + val.slice(-2);
}

// ── Component ─────────────────────────────────────────────────────────────────

const SAMPLE_TEXTS = {
  clean: `Team,

Please review the attached Q3 compliance report before Thursday's meeting.
The document covers our risk assessment framework updates and includes recommendations
for the upcoming audit cycle.

Let me know if you have any questions.

Best,
Alex`,
  risky: `Hi team,

Here is the customer info for the refund:
Name: John Doe
SSN: 523-45-6789
Email: johndoe@example.com
Phone: (555) 867-5309
Credit card: 4111 1111 1111 1111

Also, our new API key is: sk-aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890abcdef
DB: postgres://admin:Sup3rS3cr3t!@db.internal.corp/prod

This is CONFIDENTIAL and INTERNAL ONLY — please do not distribute outside the team.`,
};

export default function AIComplianceChecker() {
  const [text, setText] = useState("");
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [showMatches, setShowMatches] = useState<Record<string, boolean>>({});
  const [isScanning, setIsScanning] = useState(false);

  const hasCritical = findings?.some((f) => f.severity === "critical");
  const hasAny = findings && findings.length > 0;

  const handleScan = useCallback(() => {
    setIsScanning(true);
    // Small delay for UX feedback
    setTimeout(() => {
      setFindings(scanText(text));
      setIsScanning(false);
    }, 300);
  }, [text]);

  const handleClear = () => {
    setText("");
    setFindings(null);
    setShowMatches({});
  };

  const toggleMatches = (id: string) => {
    setShowMatches((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const loadSample = (type: "clean" | "risky") => {
    setText(SAMPLE_TEXTS[type]);
    setFindings(null);
  };

  const criticalCount = findings?.filter((f) => f.severity === "critical").length ?? 0;
  const highCount = findings?.filter((f) => f.severity === "high").length ?? 0;
  const mediumCount = findings?.filter((f) => f.severity === "medium").length ?? 0;

  return (
    <AppLayout title="AI Compliance Checker">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Explainer banner */}
        <Card className="border-primary/20 bg-primary/5 shadow-none">
          <CardContent className="p-4 flex gap-3 items-start">
            <ShieldAlert className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground/80 leading-relaxed">
              Before pasting content into a public AI tool (e.g. ChatGPT, Gemini, Copilot), run it through this checker.
              It scans for <strong>PII</strong>, <strong>credentials</strong>, and <strong>confidential keywords</strong>
              that should never leave your organization's security boundary.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left — Input */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="shadow-sm border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Text to Check</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => loadSample("clean")}
                    >
                      Load safe sample
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-orange-200 text-orange-600 hover:bg-orange-50"
                      onClick={() => loadSample("risky")}
                    >
                      Load risky sample
                    </Button>
                  </div>
                </div>
                <CardDescription>Paste an email, document, code snippet, or any text you want to check.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  className="w-full h-64 rounded-lg border border-border bg-background p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
                  placeholder="Paste text here…"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setFindings(null); // reset on edit
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {text.length > 0 ? `${text.length.toLocaleString()} characters` : "No text entered"}
                  </span>
                  <div className="flex gap-2">
                    {text && (
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleClear}>
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleScan}
                      disabled={!text.trim() || isScanning}
                      className="shadow-sm"
                    >
                      <Scan className="w-4 h-4 mr-1.5" />
                      {isScanning ? "Scanning…" : "Scan Text"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right — Results */}
          <div className="lg:col-span-2 space-y-4">
            {findings === null ? (
              <Card className="shadow-sm border-dashed border-2 border-border/40 h-full min-h-[200px] flex items-center justify-center bg-transparent">
                <div className="text-center p-6 flex flex-col items-center gap-3">
                  <ClipboardPaste className="w-10 h-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Paste text and click <strong>Scan Text</strong> to check for sensitive data.</p>
                </div>
              </Card>
            ) : !hasAny ? (
              /* Clean result */
              <Card className="shadow-sm border-green-200 bg-green-50/50">
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                    <ShieldCheck className="w-7 h-7 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-800 text-lg">All Clear</p>
                    <p className="text-sm text-green-700 mt-1">
                      No sensitive data detected. This text appears safe to use with AI tools.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Findings summary */
              <div className="space-y-3">
                {/* Top-level warning */}
                <Card className={cn(
                  "shadow-md border-l-4",
                  hasCritical ? "border-l-red-500 bg-red-50" : "border-l-orange-400 bg-orange-50"
                )}>
                  <CardContent className="p-4 flex gap-3 items-start">
                    <AlertTriangle className={cn("w-5 h-5 mt-0.5 flex-shrink-0", hasCritical ? "text-red-600" : "text-orange-500")} />
                    <div>
                      <p className={cn("font-bold text-sm", hasCritical ? "text-red-800" : "text-orange-800")}>
                        {hasCritical
                          ? "⚠ This text contains critical sensitive data."
                          : "⚠ This text contains potentially sensitive content."}
                      </p>
                      <p className={cn("text-xs mt-0.5", hasCritical ? "text-red-700" : "text-orange-700")}>
                        Do not paste into public AI tools.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Severity summary pills */}
                <div className="flex gap-2 flex-wrap">
                  {criticalCount > 0 && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                      {criticalCount} Critical
                    </span>
                  )}
                  {highCount > 0 && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                      {highCount} High
                    </span>
                  )}
                  {mediumCount > 0 && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
                      {mediumCount} Medium
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Findings detail list */}
        {hasAny && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Detected Issues ({findings.length})
            </h3>
            <div className="space-y-2">
              {findings.map((finding) => {
                const s = SEVERITY_STYLES[finding.severity];
                const showing = showMatches[finding.ruleId];
                return (
                  <Card
                    key={finding.ruleId}
                    className={cn("shadow-sm border-l-4 overflow-hidden", s.border, s.bg)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn("text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full", s.badge)}>
                              {finding.severity}
                            </span>
                            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", CATEGORY_BADGE[finding.category])}>
                              {CATEGORY_LABELS[finding.category]}
                            </span>
                            <span className="font-semibold text-sm text-foreground">{finding.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5">
                            {finding.count} instance{finding.count !== 1 ? "s" : ""} found
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground shrink-0 h-7"
                          onClick={() => toggleMatches(finding.ruleId)}
                        >
                          {showing ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
                          {showing ? "Hide" : "Show"}
                        </Button>
                      </div>

                      {showing && (
                        <div className="mt-3 pt-3 border-t border-border/40 space-y-1.5">
                          {finding.matches.map((m, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <code className="text-xs bg-background border border-border rounded px-2 py-0.5 font-mono text-foreground/80 flex-1 truncate">
                                {maskValue(m)}
                              </code>
                            </div>
                          ))}
                          {finding.count > 5 && (
                            <p className="text-xs text-muted-foreground italic">
                              +{finding.count - 5} more match{finding.count - 5 !== 1 ? "es" : ""} not shown.
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Rule reference */}
        <Card className="shadow-none border-border/40 bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">What gets detected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
              <div>
                <p className="font-semibold text-purple-700 mb-1.5">PII</p>
                <ul className="space-y-0.5 list-disc list-inside">
                  <li>Social Security Numbers</li>
                  <li>Credit card numbers</li>
                  <li>Email addresses</li>
                  <li>Phone numbers</li>
                  <li>IP addresses</li>
                  <li>Passport / Gov IDs</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-blue-700 mb-1.5">Credentials</p>
                <ul className="space-y-0.5 list-disc list-inside">
                  <li>API keys & tokens</li>
                  <li>Passwords & secrets</li>
                  <li>Database connection strings</li>
                  <li>Private key blocks</li>
                  <li>JWT tokens</li>
                  <li>AWS / GitHub / Stripe keys</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-700 mb-1.5">Confidential Keywords</p>
                <ul className="space-y-0.5 list-disc list-inside">
                  <li>"Confidential", "Classified"</li>
                  <li>"Internal Only", "Do Not Distribute"</li>
                  <li>"NDA", "Non-Disclosure Agreement"</li>
                  <li>"Proprietary", "Trade Secret"</li>
                  <li>"Attorney-Client Privilege"</li>
                  <li>MNPI / Insider information</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

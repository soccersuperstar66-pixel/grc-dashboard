import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle2, XCircle, FileText, Plus, Edit, Trash2, ShieldCheck } from "lucide-react";
import { useFrameworks, usePolicies, useGapAnalysis, useDeletePolicy } from "@/hooks/use-gap-analysis";
import { PolicyFormDialog } from "@/components/policies/policy-form-dialog";
import { formatDate, cn } from "@/lib/utils";
import type { Policy } from "@workspace/api-client-react/src/generated/api.schemas";

const STATUS_COLORS: Record<string, string> = {
  draft: "secondary",
  active: "success",
  under_review: "warning",
  retired: "destructive"
};

export default function GapAnalysis() {
  const [activeTab, setActiveTab] = useState<"analysis" | "policies">("analysis");
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>("");
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);

  const { data: frameworks, isLoading: isLoadingFrameworks } = useFrameworks();
  const { data: policies, isLoading: isLoadingPolicies } = usePolicies();
  
  const analyzeMutation = useGapAnalysis();
  const deletePolicyMutation = useDeletePolicy();

  const handleRunAnalysis = () => {
    if (!selectedFrameworkId) return;
    analyzeMutation.mutate({ data: { frameworkId: selectedFrameworkId } });
  };

  const handleEditPolicy = (policy: Policy) => {
    setEditingPolicy(policy);
    setFormOpen(true);
  };

  const handleCreatePolicy = () => {
    setEditingPolicy(null);
    setFormOpen(true);
  };

  const handleDeletePolicy = (id: number) => {
    if (window.confirm("Are you sure you want to delete this policy?")) {
      deletePolicyMutation.mutate({ id });
    }
  };

  const analysisResult = analyzeMutation.data;

  return (
    <AppLayout title="Gap Analysis Tool">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-border/60 pb-px mb-6">
        <button 
          onClick={() => setActiveTab("analysis")}
          className={cn(
            "pb-3 text-sm font-semibold transition-colors relative",
            activeTab === "analysis" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Run Analysis
          {activeTab === "analysis" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab("policies")}
          className={cn(
            "pb-3 text-sm font-semibold transition-colors relative",
            activeTab === "policies" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Policy Inventory
          {activeTab === "policies" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
        </button>
      </div>

      {activeTab === "analysis" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-sm border-border/60">
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>Select a framework to map against your active policies.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="form-label">Target Framework</label>
                  <select 
                    className="form-input"
                    value={selectedFrameworkId}
                    onChange={(e) => setSelectedFrameworkId(e.target.value)}
                    disabled={isLoadingFrameworks}
                  >
                    <option value="">Select a framework...</option>
                    {frameworks?.map(fw => (
                      <option key={fw.id} value={fw.id}>{fw.name}</option>
                    ))}
                  </select>
                </div>
                
                <Button 
                  className="w-full shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5" 
                  size="lg"
                  disabled={!selectedFrameworkId || analyzeMutation.isPending}
                  onClick={handleRunAnalysis}
                >
                  {analyzeMutation.isPending ? "Analyzing..." : (
                    <><Play className="w-4 h-4 mr-2" /> Run Gap Analysis</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {selectedFrameworkId && frameworks && (
              <Card className="shadow-sm border-border/60 bg-muted/20">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm">About Framework</h4>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {frameworks.find(f => f.id === selectedFrameworkId)?.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-2">
            {!analysisResult ? (
              <Card className="h-full min-h-[400px] border-dashed border-2 flex items-center justify-center bg-transparent">
                <div className="text-center text-muted-foreground flex flex-col items-center">
                  <ShieldCheck className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-medium text-lg text-foreground/50">Ready for Analysis</p>
                  <p className="text-sm mt-1 max-w-sm">Select a framework on the left and run the analysis to identify gaps in your policy coverage.</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                {/* Score Card */}
                <Card className="shadow-md border-primary/20 overflow-hidden relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div>
                        <h2 className="text-2xl font-display font-bold">{analysisResult.frameworkName} Readiness</h2>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {analysisResult.coveredControls} of {analysisResult.totalControls} controls covered by active policies.
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="text-5xl font-display font-extrabold text-foreground">
                          {Math.round(analysisResult.coveragePercent)}<span className="text-2xl text-muted-foreground">%</span>
                        </div>
                        <div className="text-sm font-medium mt-1 text-primary">Coverage Score</div>
                      </div>
                    </div>
                    
                    <div className="mt-8">
                      <div className="flex justify-between text-xs font-semibold mb-2">
                        <span className="text-muted-foreground">0%</span>
                        <span className="text-primary">Target: 100%</span>
                      </div>
                      <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out"
                          style={{ width: `${analysisResult.coveragePercent}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Gaps List */}
                {analysisResult.gaps.length > 0 && (
                  <Card className="shadow-sm border-border/60 border-l-4 border-l-destructive">
                    <CardHeader className="pb-2 bg-destructive/5">
                      <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                        <XCircle className="w-5 h-5" /> Action Required: Uncovered Controls ({analysisResult.gapControls})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border/50 max-h-[300px] overflow-y-auto">
                        {analysisResult.gaps.map(gap => (
                          <div key={gap.controlId} className="p-4 hover:bg-muted/20 transition-colors">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-mono text-xs font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded mr-2">
                                  {gap.controlId}
                                </span>
                                <span className="font-semibold text-sm">{gap.controlName}</span>
                              </div>
                              <span className="text-xs font-medium text-muted-foreground">{gap.categoryName}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">{gap.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Covered List */}
                {analysisResult.covered.length > 0 && (
                  <Card className="shadow-sm border-border/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 className="w-5 h-5" /> Covered Controls ({analysisResult.coveredControls})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border/50 max-h-[300px] overflow-y-auto">
                        {analysisResult.covered.map(cov => (
                          <div key={cov.controlId} className="p-4 hover:bg-muted/20 transition-colors">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded mr-2">
                                  {cov.controlId}
                                </span>
                                <span className="font-semibold text-sm">{cov.controlName}</span>
                              </div>
                            </div>
                            <div className="mt-2 flex gap-2 items-center">
                              <span className="text-xs text-muted-foreground">Mapped to:</span>
                              <div className="flex flex-wrap gap-1">
                                {cov.coveredByPolicies.map((p, i) => (
                                  <Badge key={i} variant="secondary" className="text-[10px] py-0">{p}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Policies Inventory Tab */
        <Card className="shadow-sm border-border/60 animate-in fade-in duration-300">
          <div className="p-6 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20">
            <div>
              <h2 className="text-lg font-display font-bold">Organization Policies</h2>
              <p className="text-sm text-muted-foreground mt-1">Manage internal policies mapped to framework controls.</p>
            </div>
            <Button onClick={handleCreatePolicy} className="shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
              <Plus className="w-4 h-4 mr-2" /> Add Policy
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-4 font-semibold text-muted-foreground">Policy Details</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground">Status</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground">Covered Controls</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground">Last Reviewed</th>
                  <th className="px-6 py-4 font-semibold text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoadingPolicies ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading policies...</td></tr>
                ) : policies?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No policies found. Add your first policy to begin gap analysis.
                    </td>
                  </tr>
                ) : (
                  policies?.map((policy) => (
                    <tr key={policy.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-primary/50 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-semibold text-foreground">{policy.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1 mt-1">{policy.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={STATUS_COLORS[policy.status] as any} className="capitalize">
                          {policy.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {policy.coveredControls.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {policy.coveredControls.slice(0, 3).map((c, i) => (
                              <span key={i} className="font-mono text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                                {c}
                              </span>
                            ))}
                            {policy.coveredControls.length > 3 && (
                              <span className="text-[10px] text-muted-foreground px-1 py-0.5">+{policy.coveredControls.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Unmapped</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {formatDate(policy.lastReviewed)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleEditPolicy(policy)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeletePolicy(policy.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <PolicyFormDialog 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        policy={editingPolicy} 
      />
    </AppLayout>
  );
}

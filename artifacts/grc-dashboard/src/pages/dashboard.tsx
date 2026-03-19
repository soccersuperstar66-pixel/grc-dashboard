import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Filter, MoreHorizontal, Edit, Trash2, Globe, Building2, Landmark, Calendar, AlertCircle } from "lucide-react";
import { useRegulations, useRegulationStats, useDeleteRegulation } from "@/hooks/use-regulations";
import { RegulationFormDialog } from "@/components/regulations/regulation-form-dialog";
import { formatDate } from "@/lib/utils";
import type { Regulation } from "@workspace/api-client-react/src/generated/api.schemas";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  proposed: "warning",
  enacted: "default",
  effective: "success"
};

const JURISDICTION_ICONS: Record<string, any> = {
  federal: Landmark,
  state: Building2,
  international: Globe
};

export default function Dashboard() {
  const [filterJurisdiction, setFilterJurisdiction] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingRegulation, setEditingRegulation] = useState<Regulation | null>(null);

  const { data: regulations, isLoading: isLoadingRegs } = useRegulations({
    jurisdiction: filterJurisdiction || undefined,
    status: filterStatus || undefined,
    search: search || undefined
  });
  
  const { data: stats, isLoading: isLoadingStats } = useRegulationStats();
  const deleteMutation = useDeleteRegulation();

  const handleEdit = (reg: Regulation) => {
    setEditingRegulation(reg);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingRegulation(null);
    setFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this regulation?")) {
      deleteMutation.mutate({ id });
    }
  };

  // Chart Colors
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-3))'];

  return (
    <AppLayout title="Regulatory Tracker">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 shadow-sm border-border/60 hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Active by Jurisdiction</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            {isLoadingStats ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Loading...</div>
            ) : stats?.byJurisdiction ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byJurisdiction}>
                  <XAxis dataKey="jurisdiction" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm border-border/60 hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center">
            {isLoadingStats ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Loading...</div>
            ) : stats?.byStatus ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                  >
                    {stats.byStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm border-border/60 hover:shadow-md transition-shadow duration-300 bg-gradient-to-br from-card to-slate-50 dark:to-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : stats?.upcomingDeadlines?.length === 0 ? (
              <div className="text-sm text-muted-foreground flex items-center gap-2 mt-4">
                <AlertCircle className="w-4 h-4 text-emerald-500" /> No urgent deadlines
              </div>
            ) : (
              <ul className="space-y-4 mt-2">
                {stats?.upcomingDeadlines.slice(0,3).map(reg => (
                  <li key={reg.id} className="flex flex-col gap-1 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-sm line-clamp-1">{reg.lawName}</span>
                      <Badge variant="outline" className="text-[10px] py-0">{formatDate(reg.deadlineDate)}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-1">{reg.nextAction}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Regulations Table Area */}
      <Card className="shadow-sm border-border/60">
        <div className="p-6 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20">
          <div>
            <h2 className="text-lg font-display font-bold">Law & Regulation Registry</h2>
            <p className="text-sm text-muted-foreground mt-1">Track privacy and security legislation across jurisdictions.</p>
          </div>
          <Button onClick={handleCreate} className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
            <Plus className="w-4 h-4 mr-2" /> Add Regulation
          </Button>
        </div>
        
        <div className="p-4 border-b border-border/60 flex flex-wrap gap-3 bg-white">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5 border border-border/50">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select 
              className="bg-transparent text-sm font-medium focus:outline-none text-foreground"
              value={filterJurisdiction}
              onChange={e => setFilterJurisdiction(e.target.value)}
            >
              <option value="">All Jurisdictions</option>
              <option value="federal">Federal</option>
              <option value="state">State</option>
              <option value="international">International</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5 border border-border/50">
            <select 
              className="bg-transparent text-sm font-medium focus:outline-none text-foreground"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="proposed">Proposed</option>
              <option value="enacted">Enacted</option>
              <option value="effective">Effective</option>
            </select>
          </div>
          
          <input 
            type="text" 
            placeholder="Search names..." 
            className="form-input w-full sm:w-64 py-1.5 h-auto ml-auto"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 font-semibold text-muted-foreground w-1/4">Law Name & Summary</th>
                <th className="px-6 py-4 font-semibold text-muted-foreground">Jurisdiction</th>
                <th className="px-6 py-4 font-semibold text-muted-foreground">Status</th>
                <th className="px-6 py-4 font-semibold text-muted-foreground">Next Action</th>
                <th className="px-6 py-4 font-semibold text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoadingRegs ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading regulations...</td>
                </tr>
              ) : regulations?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Search className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                      <p className="font-medium text-foreground">No regulations found</p>
                      <p className="text-xs">Adjust your filters or add a new one.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                regulations?.map((reg) => {
                  const Icon = JURISDICTION_ICONS[reg.jurisdiction] || Globe;
                  return (
                    <tr key={reg.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{reg.lawName}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2 mt-1 pr-4">{reg.summary}</div>
                        {reg.relevantPolicies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {reg.relevantPolicies.map((p, i) => (
                              <span key={i} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Icon className="w-4 h-4" />
                          <span className="capitalize">{reg.jurisdiction}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={STATUS_COLORS[reg.status] as any} className="capitalize">
                          {reg.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-foreground">{reg.nextAction}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Deadline: {formatDate(reg.deadlineDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleEdit(reg)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(reg.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <RegulationFormDialog 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        regulation={editingRegulation} 
      />
    </AppLayout>
  );
}

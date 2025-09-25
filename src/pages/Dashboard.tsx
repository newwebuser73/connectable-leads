import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Trophy, TrendingUp } from 'lucide-react';

interface DashboardStats {
  total_leads: number;
  unassigned: number;
  signed: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    total_leads: 0,
    unassigned: 0,
    signed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [totalLeads, unassignedLeads, signedLeads] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase
          .from('leads')
          .select('*, assignments!left(*)', { count: 'exact', head: true })
          .is('assignments.id', null),
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'signed')
      ]);

      setStats({
        total_leads: totalLeads.count || 0,
        unassigned: unassignedLeads.count || 0,
        signed: signedLeads.count || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Leads',
      value: stats.total_leads,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      title: 'Unassigned',
      value: stats.unassigned,
      icon: UserCheck,
      color: 'text-warning',
      bg: 'bg-warning/10'
    },
    {
      title: 'Signed Deals',
      value: stats.signed,
      icon: Trophy,
      color: 'text-success',
      bg: 'bg-success/10'
    },
    {
      title: 'Conversion Rate',
      value: stats.total_leads > 0 ? `${Math.round((stats.signed / stats.total_leads) * 100)}%` : '0%',
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-primary/10'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's an overview of your lead management system.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <Card key={index} className="shadow-card hover:shadow-card-hover transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`${card.bg} rounded-lg p-2`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {loading ? '...' : card.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {card.title === 'Total Leads' && '+12% from last month'}
                {card.title === 'Unassigned' && 'Needs attention'}
                {card.title === 'Signed Deals' && '+8% from last month'}
                {card.title === 'Conversion Rate' && 'Target: 25%'}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-muted-foreground">New lead assigned to John Doe</span>
                <span className="text-xs text-muted-foreground ml-auto">2 min ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-muted-foreground">Deal closed: TechCorp Inc.</span>
                <span className="text-xs text-muted-foreground ml-auto">1 hour ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-warning rounded-full"></div>
                <span className="text-muted-foreground">Follow-up scheduled with StartupXYZ</span>
                <span className="text-xs text-muted-foreground ml-auto">3 hours ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-muted-foreground">5 new leads imported from campaign</span>
                <span className="text-xs text-muted-foreground ml-auto">1 day ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Pipeline Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Lead Generation</span>
                <span className="text-sm font-medium">{Math.floor(stats.unassigned * 0.4)} leads</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Lead Qualification</span>
                <span className="text-sm font-medium">{Math.floor(stats.total_leads * 0.3)} leads</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Proposal</span>
                <span className="text-sm font-medium">{Math.floor(stats.total_leads * 0.2)} leads</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Negotiation</span>
                <span className="text-sm font-medium">{Math.floor(stats.total_leads * 0.1)} leads</span>
              </div>
              <div className="flex justify-between items-center border-t pt-4">
                <span className="text-sm font-medium text-success">Closed Won</span>
                <span className="text-sm font-bold text-success">{stats.signed} deals</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
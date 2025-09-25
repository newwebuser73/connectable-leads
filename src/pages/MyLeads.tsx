import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Calendar, ExternalLink, Plus, Phone, Mail, Globe, MapPin, Building } from 'lucide-react';

interface Lead {
  id: number;
  brand: string;
  origin_country: string;
  category: string;
  phone: string;
  website: string;
  pipeline_stage: string;
  status: string;
  email: string;
  ceo_name: string;
  target_markets: string;
  assigned_at: string;
}

interface Activity {
  id: number;
  activity_type: string;
  content: string;
  next_steps: string;
  actor_id: string;
  created_at: string;
  actor_name: string;
}

const MyLeads = () => {
  const [myLeads, setMyLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadActivities, setLeadActivities] = useState<Activity[]>([]);
  const [showLeadDetail, setShowLeadDetail] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addingActivity, setAddingActivity] = useState(false);
  const { toast } = useToast();

  // Activity form state
  const [activityType, setActivityType] = useState('');
  const [activityContent, setActivityContent] = useState('');
  const [nextSteps, setNextSteps] = useState('');

  // Lead update state
  const [newStatus, setNewStatus] = useState('');
  const [newStage, setNewStage] = useState('');

  useEffect(() => {
    fetchMyLeads();
  }, []);

  const fetchMyLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          id, brand, origin_country, category, phone, website, 
          pipeline_stage, status, email, ceo_name, target_markets,
          assignments!inner(assigned_at, assignee_id)
        `)
        .eq('assignments.assignee_id', (await supabase.auth.getUser()).data.user?.id)
        .order('assignments.assigned_at', { ascending: false });

      if (error) throw error;
      
      // Flatten the data structure
      const formattedLeads = (data || []).map(lead => ({
        ...lead,
        assigned_at: lead.assignments[0]?.assigned_at
      }));
      
      setMyLeads(formattedLeads);
    } catch (error) {
      console.error('Error fetching my leads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your leads.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadActivities = async (leadId: number) => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          id, activity_type, content, next_steps, actor_id, created_at,
          profiles!activities_actor_id_fkey(full_name)
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedActivities = (data || []).map(activity => ({
        ...activity,
        actor_name: activity.profiles?.full_name || 'Unknown'
      }));
      
      setLeadActivities(formattedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setNewStatus(lead.status);
    setNewStage(lead.pipeline_stage);
    fetchLeadActivities(lead.id);
    setShowLeadDetail(true);
  };

  const handleAddActivity = async () => {
    if (!selectedLead || !activityType || !activityContent) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setAddingActivity(true);
    try {
      const { error } = await supabase.rpc('rpc_add_activity', {
        p_lead_id: selectedLead.id,
        p_activity_type: activityType,
        p_content: activityContent,
        p_next_steps: nextSteps || ''
      });

      if (error) throw error;

      toast({
        title: "Activity Added",
        description: "The activity has been successfully recorded.",
      });

      // Reset form and refresh activities
      setActivityType('');
      setActivityContent('');
      setNextSteps('');
      setShowAddActivity(false);
      fetchLeadActivities(selectedLead.id);
    } catch (error: any) {
      console.error('Error adding activity:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add activity.",
        variant: "destructive",
      });
    } finally {
      setAddingActivity(false);
    }
  };

  const handleUpdateLead = async () => {
    if (!selectedLead) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          status: newStatus,
          pipeline_stage: newStage
        })
        .eq('id', selectedLead.id);

      if (error) throw error;

      toast({
        title: "Lead Updated",
        description: "The lead status and stage have been updated.",
      });

      // Update local state
      setMyLeads(leads => 
        leads.map(lead => 
          lead.id === selectedLead.id 
            ? { ...lead, status: newStatus, pipeline_stage: newStage }
            : lead
        )
      );
      setSelectedLead({ ...selectedLead, status: newStatus, pipeline_stage: newStage });
    } catch (error: any) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update lead.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'assigned': return 'secondary';
      case 'qualified': return 'outline';
      case 'signed': return 'default';
      default: return 'secondary';
    }
  };

  const activityTypes = [
    { value: 'call', label: 'Phone Call' },
    { value: 'email', label: 'Email' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'note', label: 'Note' }
  ];

  const statusOptions = [
    'new', 'assigned', 'contacted', 'qualified', 'proposal', 'negotiation', 'signed', 'lost'
  ];

  const stageOptions = [
    'Lead Generation', 'Lead Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Leads</h1>
        <p className="text-muted-foreground mt-2">
          Manage your assigned leads and track activities.
        </p>
      </div>

      {/* My Leads Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Assigned Leads ({myLeads.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse">Loading your leads...</div>
            </div>
          ) : myLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No leads assigned to you yet.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-table-header">
                  <TableRow>
                    <TableHead>Brand</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Pipeline Stage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myLeads.map((lead) => (
                    <TableRow 
                      key={lead.id} 
                      className="hover:bg-table-row-hover cursor-pointer"
                      onClick={() => handleLeadClick(lead)}
                    >
                      <TableCell className="font-medium">{lead.brand}</TableCell>
                      <TableCell>{lead.origin_country}</TableCell>
                      <TableCell>{lead.category}</TableCell>
                      <TableCell>{lead.pipeline_stage}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(lead.status)}>
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(lead.assigned_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLeadClick(lead);
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Detail Modal */}
      <Dialog open={showLeadDetail} onOpenChange={setShowLeadDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {selectedLead?.brand}
            </DialogTitle>
          </DialogHeader>
          
          {selectedLead && (
            <div className="space-y-6">
              {/* Lead Information */}
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lead Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Country:</strong> {selectedLead.origin_country}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Category:</strong> {selectedLead.category}
                      </span>
                    </div>
                    {selectedLead.ceo_name && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          <strong>CEO:</strong> {selectedLead.ceo_name}
                        </span>
                      </div>
                    )}
                    {selectedLead.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedLead.phone}</span>
                      </div>
                    )}
                    {selectedLead.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedLead.email}</span>
                      </div>
                    )}
                    {selectedLead.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={selectedLead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {selectedLead.website}
                        </a>
                      </div>
                    )}
                    <div className="text-sm">
                      <strong>Target Markets:</strong> {selectedLead.target_markets}
                    </div>
                  </CardContent>
                </Card>

                {/* Update Status/Stage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Update Lead</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(status => (
                            <SelectItem key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Pipeline Stage</Label>
                      <Select value={newStage} onValueChange={setNewStage}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {stageOptions.map(stage => (
                            <SelectItem key={stage} value={stage}>
                              {stage}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleUpdateLead} className="w-full">
                      Update Lead
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Activities Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Activities
                    </CardTitle>
                    <Button onClick={() => setShowAddActivity(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Activity
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {leadActivities.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No activities recorded yet.</p>
                      </div>
                    ) : (
                      leadActivities.map((activity) => (
                        <div key={activity.id} className="border-l-4 border-primary pl-4 pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">{activity.activity_type}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(activity.created_at)} • {activity.actor_name}
                            </span>
                          </div>
                          <p className="text-sm mb-2">{activity.content}</p>
                          {activity.next_steps && (
                            <p className="text-xs text-muted-foreground">
                              <strong>Next Steps:</strong> {activity.next_steps}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Activity Modal */}
      <Dialog open={showAddActivity} onOpenChange={setShowAddActivity}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Activity Type</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={activityContent}
                onChange={(e) => setActivityContent(e.target.value)}
                placeholder="Describe what happened during this activity..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Next Steps (Optional)</Label>
              <Textarea
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                placeholder="What are the next steps to take?"
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddActivity(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddActivity} disabled={addingActivity}>
                {addingActivity ? 'Adding...' : 'Add Activity'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyLeads;
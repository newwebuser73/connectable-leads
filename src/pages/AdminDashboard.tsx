import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, Users, Calendar, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Lead {
  id: number;
  brand: string;
  origin_country: string;
  category: string;
  target_markets: string;
  website: string;
  pipeline_stage: string;
  status: string;
  created_at: string;
}

interface Employee {
  id: string;
  full_name: string;
  email: string;
  cluster: string;
}

const AdminDashboard = () => {
  const [unassignedLeads, setUnassignedLeads] = useState<Lead[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [assignmentNote, setAssignmentNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUnassignedLeads();
    fetchEmployees();
  }, []);

  const fetchUnassignedLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          id, brand, origin_country, category, target_markets, 
          website, pipeline_stage, status, created_at,
          assignments!left(id)
        `)
        .is('assignments.id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUnassignedLeads(data || []);
    } catch (error) {
      console.error('Error fetching unassigned leads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch unassigned leads.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, cluster')
        .eq('role', 'bd_employee')
        .order('full_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleLeadSelection = (leadId: number, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(unassignedLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleBulkAssign = async () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "No Leads Selected",
        description: "Please select at least one lead to assign.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedEmployee) {
      toast({
        title: "No Employee Selected",
        description: "Please select an employee to assign the leads to.",
        variant: "destructive",
      });
      return;
    }

    setAssigning(true);
    try {
      const { error } = await supabase.rpc('rpc_bulk_assign', {
        p_lead_ids: selectedLeads,
        p_assignee: selectedEmployee,
        p_note: assignmentNote || null
      });

      if (error) throw error;

      toast({
        title: "Leads Assigned Successfully",
        description: `${selectedLeads.length} leads have been assigned.`,
      });

      // Reset form and refresh data
      setSelectedLeads([]);
      setSelectedEmployee('');
      setAssignmentNote('');
      fetchUnassignedLeads();
    } catch (error: any) {
      console.error('Error assigning leads:', error);
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign leads.",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage unassigned leads and bulk assignments.
        </p>
      </div>

      {/* Assignment Section */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Bulk Lead Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employee-select">Assign to Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <div className="flex items-center gap-2">
                        <span>{employee.full_name}</span>
                        <span className="text-xs text-muted-foreground">
                          Cluster {employee.cluster}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignment-note">Assignment Note (Optional)</Label>
              <Textarea
                id="assignment-note"
                value={assignmentNote}
                onChange={(e) => setAssignmentNote(e.target.value)}
                placeholder="Add any special instructions or context..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedLeads.length} lead(s) selected
            </p>
            <Button 
              onClick={handleBulkAssign}
              disabled={assigning || selectedLeads.length === 0 || !selectedEmployee}
            >
              {assigning ? 'Assigning...' : `Assign ${selectedLeads.length} Lead(s)`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Unassigned Leads Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Unassigned Leads ({unassignedLeads.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse">Loading leads...</div>
            </div>
          ) : unassignedLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No unassigned leads found.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-table-header">
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedLeads.length === unassignedLeads.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Target Markets</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Website</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unassignedLeads.map((lead) => (
                    <TableRow 
                      key={lead.id} 
                      className="hover:bg-table-row-hover cursor-pointer"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('input, a')) return;
                        handleLeadSelection(lead.id, !selectedLeads.includes(lead.id));
                      }}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={(checked) => 
                            handleLeadSelection(lead.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">{lead.brand}</TableCell>
                      <TableCell>{lead.origin_country}</TableCell>
                      <TableCell>{lead.category}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {lead.target_markets}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(lead.status)}>
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(lead.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.website && (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3" />
                            Visit
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import {
  FileText,
  Search,
  Check,
  X,
  Loader,
} from 'lucide-react';
import { toast } from 'sonner';
import registrationService from '../services/registrationService';
import { PaginationWrapper } from '../components/PaginationWrapper';
import logger from '../utils/logger';

interface Registration {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  program: {
    id: string;
    name: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  rejection_reason?: string | null;
}

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRegistrations();
  }, [statusFilter, page, pageSize]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (searchQuery) {
        filters.search = searchQuery;
      }

      const response = await registrationService.getRegistrations(filters);
      setRegistrations(response || []);
      setTotal(response?.length || 0);
    } catch (error) {
      logger.error('Failed to fetch registrations', { error });
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setPage(1);
    if (query.length > 0) {
      setSearching(true);
      try {
        const response = await registrationService.getRegistrations({ search: query });
        setRegistrations(response || []);
        setTotal(response?.length || 0);
      } catch (error) {
        logger.error('Search failed', { error });
        toast.error('Search failed');
      } finally {
        setSearching(false);
      }
    } else {
      await fetchRegistrations();
    }
  };

  const handleApprove = async () => {
    if (!selectedRegistration) return;
    setProcessing(true);
    try {
      await registrationService.approveRegistration(selectedRegistration.id);
      toast.success('Registration approved successfully');
      setActionDialogOpen(false);
      setViewDetailsOpen(false);
      setSelectedRegistration(null);
      await fetchRegistrations();
    } catch (error: any) {
      logger.error('Approval failed', { error });
      toast.error(error?.message || 'Failed to approve registration');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRegistration || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setProcessing(true);
    try {
      await registrationService.rejectRegistration(selectedRegistration.id, rejectionReason);
      toast.success('Registration rejected');
      setActionDialogOpen(false);
      setViewDetailsOpen(false);
      setSelectedRegistration(null);
      setRejectionReason('');
      await fetchRegistrations();
    } catch (error: any) {
      logger.error('Rejection failed', { error });
      toast.error(error?.message || 'Failed to reject registration');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return null;
    }
  };

  const paginatedRegistrations = registrations.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <DashboardLayout title="Registration Management">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <FileText className="size-6" />
            Pending Registrations
          </h2>
          <p className="text-muted-foreground">
            Review and approve trainee registration requests
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or username..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
              disabled={searching}
            />
          </div>
          <Select value={statusFilter} onValueChange={(value: any) => {
            setStatusFilter(value);
            setPage(1);
          }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Registrations</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Registrations Grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : registrations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-4 size-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                No registrations found
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedRegistrations.map((registration) => (
              <Card 
                key={registration.id} 
                className="group hover:shadow-lg transition-all cursor-pointer"
                onClick={() => {
                  setSelectedRegistration(registration);
                  setViewDetailsOpen(true);
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate">
                        {registration.first_name} {registration.last_name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        @{registration.username}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getStatusBadge(registration.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium break-all truncate">{registration.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{registration.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Program</p>
                      <p className="text-sm font-medium">{registration.program?.name}</p>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        {new Date(registration.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {registration.status === 'pending' && (
                    <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedRegistration(registration);
                          setActionType('approve');
                          setActionDialogOpen(true);
                        }}
                      >
                        <Check className="size-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedRegistration(registration);
                          setActionType('reject');
                          setRejectionReason('');
                          setActionDialogOpen(true);
                        }}
                      >
                        <X className="size-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {registrations.length > pageSize && (
          <PaginationWrapper
            currentPage={page}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
            <DialogDescription>
              Review complete registration information
            </DialogDescription>
          </DialogHeader>

          {selectedRegistration && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <span className="font-medium">Status:</span>
                {getStatusBadge(selectedRegistration.status)}
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">First Name</p>
                  <p className="font-medium">{selectedRegistration.first_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Name</p>
                  <p className="font-medium">{selectedRegistration.last_name}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium break-all">{selectedRegistration.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedRegistration.phone}</p>
                </div>
              </div>

              {/* Account Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="font-medium">@{selectedRegistration.username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Program</p>
                  <p className="font-medium">{selectedRegistration.program?.name}</p>
                </div>
              </div>

              {/* Submission Date */}
              <div>
                <p className="text-sm text-muted-foreground">Submitted On</p>
                <p className="font-medium">
                  {new Date(selectedRegistration.created_at).toLocaleString()}
                </p>
              </div>

              {/* Rejection Reason (if applicable) */}
              {selectedRegistration.status === 'rejected' && selectedRegistration.rejection_reason && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">Rejection Reason:</p>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {selectedRegistration.rejection_reason}
                  </p>
                </div>
              )}

              {/* Actions */}
              {selectedRegistration.status === 'pending' && (
                <DialogFooter className="flex-col gap-2 sm:flex-col">
                  <Button
                    onClick={() => {
                      setActionType('approve');
                      setActionDialogOpen(true);
                    }}
                    className="w-full"
                  >
                    <Check className="size-4 mr-2" />
                    Approve Registration
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setActionType('reject');
                      setRejectionReason('');
                      setActionDialogOpen(true);
                    }}
                    className="w-full"
                  >
                    <X className="size-4 mr-2" />
                    Reject Registration
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog (Approve/Reject) */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="w-full max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Registration' : 'Reject Registration'}
            </DialogTitle>
            <DialogDescription>
              {selectedRegistration && (
                <>
                  {actionType === 'approve'
                    ? `Approve ${selectedRegistration.first_name} ${selectedRegistration.last_name}'s registration?`
                    : `Reject ${selectedRegistration.first_name} ${selectedRegistration.last_name}'s registration?`}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {actionType === 'reject' && (
            <div className="space-y-2">
              <label htmlFor="rejection-reason" className="text-sm font-medium">
                Rejection Reason *
              </label>
              <textarea
                id="rejection-reason"
                placeholder="Explain why you're rejecting this registration..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-24"
              />
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={actionType === 'approve' ? handleApprove : handleReject}
              disabled={processing || (actionType === 'reject' && !rejectionReason.trim())}
              className="w-full"
            >
              {processing && <Loader className="size-4 mr-2 animate-spin" />}
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setActionDialogOpen(false)}
              disabled={processing}
              className="w-full"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';
import registrationService, { PendingRegistration } from '../services/registrationService';
import api from '../services/api';
import logger from '../utils/logger';

export default function TraineeApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<PendingRegistration | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      // Fetch trainee's own registrations
      const response = await api.get('/registrations/me');
      setApplications(response.data || []);
    } catch (error) {
      logger.error('Failed to fetch applications', { error });
      toast.error('Failed to load your applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="size-5 text-amber-600" />;
      case 'approved':
        return <CheckCircle2 className="size-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="size-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return '';
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

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your application is under review. We will notify you once a decision has been made.';
      case 'approved':
        return 'Congratulations! Your application has been approved. You can now log in to your account.';
      case 'rejected':
        return 'Unfortunately, your application has been rejected. You can submit a new application after reviewing the feedback.';
      default:
        return '';
    }
  };

  return (
    <DashboardLayout title="My Applications">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <FileText className="size-6" />
            My Program Applications
          </h2>
          <p className="text-muted-foreground">
            Track the status of your program applications
          </p>
        </div>

        {/* Empty State or Applications List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <GraduationCap className="mb-4 size-12 text-muted-foreground" />
              <p className="font-medium mb-1">No applications yet</p>
              <p className="text-muted-foreground mb-4">
                You haven't applied to any programs yet. Visit the Available Programs page to apply.
              </p>
              <Button onClick={() => window.location.href = '/trainee/programs'}>
                Browse Programs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <Card key={application.id} className={`border-l-4 hover:shadow-md transition-shadow ${
                application.status === 'pending' ? 'border-l-amber-500' :
                application.status === 'approved' ? 'border-l-green-500' :
                'border-l-red-500'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left side - Application info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusIcon(application.status)}
                        <div>
                          <h3 className="font-semibold text-lg">
                            {application.program?.name}
                          </h3>
                          {application.program?.description && (
                            <p className="text-sm text-muted-foreground">
                              {application.program.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="mb-4">
                        {getStatusBadge(application.status)}
                      </div>

                      {/* Status message */}
                      <div className={`p-3 rounded-lg text-sm flex gap-3 items-start ${getStatusColor(application.status)}`}>
                        <AlertCircle className="size-4 shrink-0 mt-0.5" />
                        <span>{getStatusMessage(application.status)}</span>
                      </div>

                      {/* Application date */}
                      <p className="text-xs text-muted-foreground mt-3">
                        Applied on {new Date(application.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Right side - Action button */}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedApplication(application);
                        setDetailsDialogOpen(true);
                      }}
                      className="flex-shrink-0"
                    >
                      <Eye className="size-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review your application information
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4">
              {/* Status Card */}
              <div className={`p-4 rounded-lg border-2 ${
                selectedApplication.status === 'pending' ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/30' :
                selectedApplication.status === 'approved' ? 'border-green-200 bg-green-50 dark:bg-green-950/30' :
                'border-red-200 bg-red-50 dark:bg-red-950/30'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(selectedApplication.status)}
                  <span className="font-semibold">
                    {selectedApplication.status === 'pending' ? 'Pending Review' :
                     selectedApplication.status === 'approved' ? 'Approved' :
                     'Rejected'}
                  </span>
                </div>
                <p className="text-sm">
                  {getStatusMessage(selectedApplication.status)}
                </p>
              </div>

              {/* Program Info */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Program</p>
                <p className="font-semibold">{selectedApplication.program?.name}</p>
                {selectedApplication.program?.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedApplication.program.description}
                  </p>
                )}
              </div>

              {/* Application Timeline */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Application Date</p>
                <p className="text-sm">
                  {new Date(selectedApplication.created_at).toLocaleString()}
                </p>
              </div>

              {/* Rejection Reason */}
              {selectedApplication.status === 'rejected' && selectedApplication.rejection_reason && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">Reason for Rejection:</p>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {selectedApplication.rejection_reason}
                  </p>
                </div>
              )}

              {/* Next Steps */}
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Next Steps:</p>
                <ul className="text-sm text-blue-700 dark:text-blue-400 list-disc list-inside mt-2 space-y-1">
                  {selectedApplication.status === 'pending' && (
                    <>
                      <li>Wait for staff review and approval</li>
                      <li>Check your email for updates</li>
                    </>
                  )}
                  {selectedApplication.status === 'approved' && (
                    <>
                      <li>Your account is now active</li>
                      <li>Log in with your credentials</li>
                      <li>Complete your enrollment process</li>
                    </>
                  )}
                  {selectedApplication.status === 'rejected' && (
                    <>
                      <li>Review the rejection reason</li>
                      <li>You can submit a new application</li>
                      <li>Contact staff for more information</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Action Buttons */}
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDetailsDialogOpen(false)}
                  className="w-full"
                >
                  Close
                </Button>
                {selectedApplication.status === 'rejected' && (
                  <Button
                    onClick={() => {
                      setDetailsDialogOpen(false);
                      window.location.href = '/trainee/programs';
                    }}
                    className="w-full"
                  >
                    Apply Again
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

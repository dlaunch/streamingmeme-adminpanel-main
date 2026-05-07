"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Send, ExternalLink } from "lucide-react";
import {
  getActiveNewsletter,
  createNewsletterGenerationJob,
  getNewsletterGenerationJobStatus,
  triggerNewsletterGenerationWebhook,
  getTodaysGenerationJobStatus,
} from "@/lib/actions/newsletters";
import { toast } from "sonner";
import { toAppTime } from "@/lib/utils/date";

type JobStatus =
  | "idle"
  | "GENERATE_JOB_PENDING"
  | "GENERATE_JOB_RUNNING"
  | "GENERATE_JOB_SUCCESS"
  | "GENERATE_JOB_FAILED"
  | "GENERATE_JOB_CANCELLED"
  | "GENERATE_JOB_PUBLISHED";

export function QuickActions() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus>("idle");
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [finishedAt, setFinishedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishedToday, setIsPublishedToday] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentJobIdRef = useRef<string | null>(null);
  const pollRetryCountRef = useRef<number>(0);
  const maxPollRetries = 5;

  // Stop any active polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    pollRetryCountRef.current = 0;
  }, []);

  // Reset state to idle
  const resetToIdle = useCallback(() => {
    setIsGenerating(false);
    setJobStatus("idle");
    setHtmlContent(null);
    setFinishedAt(null);
    currentJobIdRef.current = null;
    pollRetryCountRef.current = 0;
  }, []);

  // Poll for job status updates
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      console.log(`[QuickActions] Polling job status for ${jobId}...`);
      const result = await getNewsletterGenerationJobStatus(jobId);

      if (result.error) {
        console.error(`[QuickActions] Error fetching job ${jobId}:`, result.error);
        pollRetryCountRef.current++;
        if (pollRetryCountRef.current >= maxPollRetries) {
          console.error(`[QuickActions] Max retries reached for job ${jobId}`);
          stopPolling();
          setJobStatus("GENERATE_JOB_FAILED");
          setIsGenerating(false);
        }
        return;
      }

      if (!result.job) {
        console.error(`[QuickActions] Job ${jobId} not found`);
        pollRetryCountRef.current++;
        if (pollRetryCountRef.current >= maxPollRetries) {
          stopPolling();
          setJobStatus("GENERATE_JOB_FAILED");
          setIsGenerating(false);
        }
        return;
      }

      pollRetryCountRef.current = 0;
      const job = result.job;
      const status = job.status as JobStatus;
      console.log(`[QuickActions] Job ${jobId} status: ${status}`);

      setJobStatus(status);

      if (status === "GENERATE_JOB_PENDING" || status === "GENERATE_JOB_RUNNING") {
        return; // Keep polling
      }

      if (status === "GENERATE_JOB_SUCCESS") {
        console.log(`[QuickActions] Job ${jobId} succeeded, htmlContent length: ${job.htmlContent?.length}`);
        setHtmlContent(job.htmlContent);
        setFinishedAt(job.finishedAt);
        stopPolling();
        setIsGenerating(false);
        return;
      }

      if (status === "GENERATE_JOB_FAILED" || status === "GENERATE_JOB_CANCELLED") {
        console.error(`[QuickActions] Job ${jobId} ended with status: ${status}`);
        stopPolling();
        setIsGenerating(false);
        setTimeout(() => resetToIdle(), 15000);
        return;
      }
    } catch (error) {
      console.error("[QuickActions] Error polling job status:", error);
      pollRetryCountRef.current++;
      if (pollRetryCountRef.current >= maxPollRetries) {
        stopPolling();
        setJobStatus("GENERATE_JOB_FAILED");
        setIsGenerating(false);
      }
    }
  }, [stopPolling, resetToIdle]);

  // Start polling for a job
  const startPolling = useCallback((jobId: string) => {
    console.log(`[QuickActions] Starting polling for job ${jobId}`);
    currentJobIdRef.current = jobId;
    pollRetryCountRef.current = 0;

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll immediately, then every 5 seconds
    pollJobStatus(jobId);
    pollingIntervalRef.current = setInterval(() => pollJobStatus(jobId), 15000);
  }, [pollJobStatus]);

  // Initialize on mount - check for existing jobs
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      console.log("[QuickActions] Initializing - checking for existing jobs...");

      try {
        const result = await getTodaysGenerationJobStatus();

        if (!isMounted) {
          console.log("[QuickActions] Component unmounted during initialization");
          return;
        }

        console.log("[QuickActions] Server returned:", {
          ongoingJob: result.ongoingJob ? { id: result.ongoingJob.id, status: result.ongoingJob.status } : null,
          latestSuccessJob: result.latestSuccessJob ? {
            id: result.latestSuccessJob.id,
            status: result.latestSuccessJob.status,
            hasHtmlContent: !!result.latestSuccessJob.htmlContent
          } : null,
          error: result.error
        });

        if (result.error) {
          console.error("[QuickActions] Error from server:", result.error);
          setIsLoading(false);
          return;
        }

        // Priority 1: Handle ongoing job
        if (result.ongoingJob) {
          const status = result.ongoingJob.status as JobStatus;
          console.log(`[QuickActions] Found ongoing job ${result.ongoingJob.id} with status ${status}`);
          currentJobIdRef.current = result.ongoingJob.id;
          setIsGenerating(true);
          setJobStatus(status);
          setIsLoading(false);
          startPolling(result.ongoingJob.id);
          return;
        }

        // Priority 2: Show latest successful/published job preview
        if (result.latestSuccessJob && result.latestSuccessJob.htmlContent) {
          console.log(`[QuickActions] Found successful/published job ${result.latestSuccessJob.id}, setting preview`);
          currentJobIdRef.current = result.latestSuccessJob.id;
          setJobStatus(result.latestSuccessJob.status as JobStatus);
          setHtmlContent(result.latestSuccessJob.htmlContent);
          setFinishedAt(result.latestSuccessJob.finishedAt);
        } else {
          console.log("[QuickActions] No ongoing or successful jobs found");
        }

        if (result.isPublishedToday) {
          setIsPublishedToday(true);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("[QuickActions] Error during initialization:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [startPolling]);

  // Handle generate button click
  const handleGenerateNewsletter = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isGenerating) {
      console.log("[QuickActions] Generation already in progress");
      return;
    }

    setIsGenerating(true);
    setJobStatus("GENERATE_JOB_PENDING");
    setHtmlContent(null);
    setFinishedAt(null);

    try {
      console.log("[QuickActions] Fetching active newsletter...");
      const activeNewsletter = await getActiveNewsletter();

      if (!activeNewsletter) {
        toast.error("No active newsletter found. Please ensure there is an active newsletter record.");
        resetToIdle();
        return;
      }

      console.log(`[QuickActions] Creating job for newsletter ${activeNewsletter.id}...`);
      const jobResult = await createNewsletterGenerationJob(activeNewsletter.id);

      if (jobResult.error || !jobResult.jobId) {
        toast.error(jobResult.error || "Failed to create generation job");
        resetToIdle();
        return;
      }

      console.log(`[QuickActions] Created job ${jobResult.jobId}, triggering webhook...`);
      const webhookResult = await triggerNewsletterGenerationWebhook(jobResult.jobId);

      if (!webhookResult.success) {
        console.error("[QuickActions] Webhook failed:", webhookResult.error);
        toast.error(`Webhook failed: ${webhookResult.error}`);
      }

      console.log("[QuickActions] Starting to poll for job status...");
      startPolling(jobResult.jobId);
    } catch (error) {
      console.error("[QuickActions] Unexpected error:", error);
      toast.error("An unexpected error occurred. Please try again.");
      resetToIdle();
    }
  };

  // Open preview in new tab using the job ID route
  const handleViewPreview = () => {
    if (!currentJobIdRef.current) {
      console.error("[QuickActions] No job ID available for preview");
      return;
    }

    window.open(`/api/preview/${currentJobIdRef.current}`, "_blank");
  };

  const getStatusMessage = (): string | null => {
    switch (jobStatus) {
      case "GENERATE_JOB_PENDING":
        return "Newsletter generate request pending...";
      case "GENERATE_JOB_RUNNING":
        return "Generating newsletter preview...";
      case "GENERATE_JOB_SUCCESS":
        return "Newsletter preview is now available";
      case "GENERATE_JOB_PUBLISHED":
        return "Newsletter published for today";
      case "GENERATE_JOB_FAILED":
        return "Generate newsletter preview failed.";
      case "GENERATE_JOB_CANCELLED":
        return "Generate newsletter preview cancelled.";
      default:
        return null;
    }
  };

  const formatTimestamp = (date: Date | null): string | null => {
    if (!date) return null;
    return toAppTime(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const getStatusColor = (): string => {
    switch (jobStatus) {
      case "GENERATE_JOB_SUCCESS":
      case "GENERATE_JOB_PUBLISHED":
        return "text-emerald-600 dark:text-emerald-400";
      case "GENERATE_JOB_FAILED":
        return "text-rose-600 dark:text-rose-400";
      case "GENERATE_JOB_CANCELLED":
        return "text-amber-600 dark:text-amber-400";
      default:
        return "text-muted-foreground";
    }
  };

  const showSpinner = jobStatus === "GENERATE_JOB_PENDING" || jobStatus === "GENERATE_JOB_RUNNING";
  const statusMessage = getStatusMessage();
  const isButtonDisabled = isGenerating || isLoading || isPublishedToday;
  const dayOfWeek = new Date().getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Generate Newsletter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isWeekend && (
          <Button
            className="w-full"
            onClick={handleGenerateNewsletter}
            disabled={isButtonDisabled}
          >
            {isButtonDisabled ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Generate preview
          </Button>
        )}

        {statusMessage && (
          <div className={`flex items-center gap-2 text-sm ${getStatusColor()}`}>
            {showSpinner && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>
              {statusMessage}
              {jobStatus === "GENERATE_JOB_SUCCESS" && finishedAt && (
                <span className="text-muted-foreground ml-1">
                  ({formatTimestamp(finishedAt)})
                </span>
              )}
            </span>
          </div>
        )}

        {(jobStatus === "GENERATE_JOB_SUCCESS" || jobStatus === "GENERATE_JOB_PUBLISHED") && htmlContent && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleViewPreview}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Newsletter Preview
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
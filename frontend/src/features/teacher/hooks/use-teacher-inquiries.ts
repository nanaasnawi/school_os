'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchInquiryThreads,
  fetchInquiryDetail,
  sendInquiryReply,
  markInquiryRead,
  resolveInquiry,
} from '../api';
import type {
  InquiryThread,
  InquiryDetail,
  InquiryMetrics,
} from '../types';

export function useTeacherInquiries() {
  const [threads, setThreads] = useState<InquiryThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'ANSWERED' | 'RESOLVED'>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');

  // Active detail modal/workspace
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeDetail, setActiveDetail] = useState<InquiryDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Load threads
  const loadThreads = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchInquiryThreads();
      setThreads(data);
    } catch (err) {
      console.error('Failed to load inquiry threads:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Extract unique classes
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    threads.forEach((t) => {
      if (t.student_class) set.add(t.student_class);
    });
    return Array.from(set).sort();
  }, [threads]);

  // Filtered threads
  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      if (statusFilter !== 'ALL') {
        const s = t.status?.toUpperCase() || 'OPEN';
        if (statusFilter === 'OPEN') {
          if (!(s === 'OPEN' || s === 'MENUNGGU' || s === 'WAITING_REPLY')) return false;
        } else if (statusFilter === 'ANSWERED') {
          if (!(s === 'ANSWERED' || s === 'TERJAWAB' || s === 'DIJAWAB')) return false;
        } else if (statusFilter === 'RESOLVED') {
          if (!(s === 'RESOLVED' || s === 'SELESAI')) return false;
        } else if (s !== statusFilter) {
          return false;
        }
      }
      if (classFilter !== 'ALL' && t.student_class !== classFilter) {
        return false;
      }
      return true;
    });
  }, [threads, statusFilter, classFilter]);

  // Metrics calculation
  const metrics: InquiryMetrics = useMemo(() => {
    let openCount = 0;
    let answeredCount = 0;
    let resolvedCount = 0;

    threads.forEach((t) => {
      const s = t.status?.toUpperCase() || 'OPEN';
      if (s === 'OPEN' || s === 'MENUNGGU' || s === 'WAITING_REPLY') openCount++;
      else if (s === 'ANSWERED' || s === 'TERJAWAB' || s === 'DIJAWAB') answeredCount++;
      else if (s === 'RESOLVED' || s === 'SELESAI') resolvedCount++;
    });

    return {
      total_inquiries: threads.length,
      open_inquiries: openCount,
      answered_inquiries: answeredCount,
      resolved_inquiries: resolvedCount,
    };
  }, [threads]);

  // Open thread detail & mark read
  const openThread = useCallback(async (threadId: string) => {
    setActiveThreadId(threadId);
    setIsLoadingDetail(true);
    try {
      const detail = await fetchInquiryDetail(threadId);
      setActiveDetail(detail);
      // Mark as read in background
      markInquiryRead(threadId);
    } catch (err) {
      console.error(`Failed to load inquiry detail ${threadId}:`, err);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const closeThreadDetail = useCallback(() => {
    setActiveThreadId(null);
    setActiveDetail(null);
  }, []);

  // Send reply
  const sendReply = useCallback(
    async (content: string, senderName: string = 'Bapak/Ibu Guru') => {
      if (!activeThreadId || !content.trim()) return false;

      setIsSendingReply(true);
      try {
        const newMsg = await sendInquiryReply(activeThreadId, content, senderName);
        if (newMsg) {
          // Update active detail
          setActiveDetail((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              thread: {
                ...prev.thread,
                status: 'ANSWERED',
                last_message_content: content,
                last_message_at: new Date().toISOString(),
                message_count: prev.thread.message_count + 1,
              },
              messages: [...prev.messages, newMsg],
            };
          });

          // Update thread list
          setThreads((prev) =>
            prev.map((t) =>
              t.id === activeThreadId
                ? {
                    ...t,
                    status: 'ANSWERED',
                    last_message_content: content,
                    last_message_at: new Date().toISOString(),
                    message_count: t.message_count + 1,
                  }
                : t
            )
          );
          return true;
        }
        return false;
      } catch (err) {
        console.error('Failed to send reply:', err);
        return false;
      } finally {
        setIsSendingReply(false);
      }
    },
    [activeThreadId]
  );

  // Resolve thread
  const handleResolveThread = useCallback(
    async (threadId: string) => {
      const ok = await resolveInquiry(threadId);
      if (ok) {
        setThreads((prev) =>
          prev.map((t) => (t.id === threadId ? { ...t, status: 'RESOLVED' } : t))
        );
        if (activeDetail && activeDetail.thread.id === threadId) {
          setActiveDetail((prev) =>
            prev ? { ...prev, thread: { ...prev.thread, status: 'RESOLVED' } } : null
          );
        }
      }
      return ok;
    },
    [activeDetail]
  );

  return {
    threads,
    filteredThreads,
    isLoading,
    metrics,
    statusFilter,
    setStatusFilter,
    classFilter,
    setClassFilter,
    availableClasses,
    activeThreadId,
    activeDetail,
    isLoadingDetail,
    isSendingReply,
    openThread,
    closeThreadDetail,
    sendReply,
    resolveThread: handleResolveThread,
    refresh: loadThreads,
  };
}

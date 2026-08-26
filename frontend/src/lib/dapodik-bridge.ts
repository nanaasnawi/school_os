import { getTenantItem, setTenantItem, removeTenantItem } from '@/lib/tenant-storage';
/**
 * School OS — Dapodik Local Bridge & Anti-Corruption Layer (ACL) Engine
 * Real Database & API Integration Layer (Connects directly to Backend API /api/v1/dapodik)
 */

import { apiClient } from '@/lib/api';

export interface DapodikSyncRecord {
  id: string;
  nisn: string;
  nik: string;
  namaSchoolOS: string;
  namaDapodik: string;
  rombel: string;
  identityState: 'NEW' | 'ACTIVE' | 'GRADUATED' | 'ALUMNI';
  mobilityCase: 'NONE' | 'TRANSFER_IN_PENDING' | 'TRANSFER_IN_APPROVED' | 'TRANSFER_OUT_PENDING' | 'TRANSFER_OUT_APPROVED';
  classification: 'MATCH' | 'NORMALIZATION' | 'EJAAN_BEDA' | 'NEW_RECORD';
  actionRecommended: string;
  stage: 'DETECTED' | 'CLASSIFIED' | 'RESOLVING' | 'APPROVED' | 'VERIFIED';
  lastSyncedAt: string;
}

export interface DapodikOutboxJob {
  jobId: string;
  reqId: string;
  operation: 'INSERT_STUDENT' | 'UPDATE_MUTATION' | 'ROMBEL_ASSIGNMENT' | 'PULL_LATEST_ROMBEL';
  entityId: string;
  idempotencyKey: string;
  attempts: number;
  status: 'PENDING_RETRY' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export interface DapodikHealthStatus {
  connected: boolean;
  status: 'ONLINE' | 'OFFLINE';
  message: string;
  dapodikUrl: string;
  lastCheckedAt: string;
}

export interface GeneratePrefillPayload {
  npsn: string;
  kodeRegistrasi: string;
  mirrorUrl: string;
}

export interface PullDapodikConfig {
  dapodikUrl?: string;
  npsn?: string;
  bearerToken?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'; // Real Rust Backend API Port

function getHeaders() {
  const token = apiClient.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchApi(endpoint: string, options: RequestInit = {}): Promise<Response> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (res.ok) return res;
  } catch (e) {
    // Backend port 8000 unreachable, fall through to Next.js route
  }
  return fetch(endpoint, options);
}

async function safeFetchJson(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();
  
  if (!text || text.trim().length === 0) {
    throw new Error(`Server merespon body kosong (HTTP status ${res.status})`);
  }

  const trimmed = text.trim();
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || contentType.includes('text/html')) {
    throw new Error(`Server API merespons halaman HTML/Web (HTTP status ${res.status}). Pastikan backend API Server aktif.`);
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Respon API bukan JSON valid (HTTP status ${res.status})`);
  }
}

/**
 * Generate, Parse & Ingest Kemendikdasmen Prefill Data (.prf / prefill1.kemendikdasmen.go.id)
 */
export async function generateDapodikPrefill(payload: GeneratePrefillPayload): Promise<{
  success: boolean;
  message: string;
  totalImported: number;
}> {
  try {
    const res = await fetchApi('/api/v1/dapodik/prefill/generate', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        npsn: payload.npsn,
        kode_registrasi: payload.kodeRegistrasi,
        mirror_url: payload.mirrorUrl,
      }),
    });
    const json = await safeFetchJson(res);
    if (!res.ok || !json.success) {
      const errorMsg = json?.error?.message || json?.message || 'Gagal memproses file prefill Kemendikdasmen';
      throw new Error(errorMsg);
    }
    if (json.data) {
      return {
        success: true,
        message: json.data.message,
        totalImported: json.data.total_siswa_imported,
      };
    }
  } catch (err: any) {
    console.error('[DapodikBridge] Error generating prefill:', err);
    throw new Error(err.message || 'Gagal memproses file prefill Kemendikdasmen');
  }
  throw new Error('Gagal memproses file prefill Kemendikdasmen');
}

/**
 * Upload local .prf file directly from disk
 */
export async function uploadDapodikPrefillFile(fileName: string, contentText: string): Promise<{
  success: boolean;
  message: string;
  totalImported: number;
}> {
  try {
    const res = await fetchApi('/api/v1/dapodik/prefill/upload', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        file_name: fileName,
        content_text: contentText,
      }),
    });
    const json = await safeFetchJson(res);
    if (!res.ok || !json.success) {
      const errorMsg = json?.error?.message || json?.message || 'Gagal memproses file prefill (.prf)';
      throw new Error(errorMsg);
    }
    if (json.data) {
      return {
        success: true,
        message: json.data.message,
        totalImported: json.data.total_siswa_imported,
      };
    }
  } catch (err: any) {
    console.error('[DapodikBridge] Error uploading prefill file:', err);
    throw new Error(err.message || 'Gagal memproses file .prf lokal');
  }
  throw new Error('Gagal memproses file prefill (.prf)');
}



/**
 * Perform Real Health Check against Dapodik Localhost (http://localhost:5774)
 */
export async function checkDapodikHealth(): Promise<DapodikHealthStatus> {
  let backendResult: DapodikHealthStatus | null = null;
  try {
    const res = await fetchApi('/api/v1/dapodik/health-check', {
      method: 'GET',
      headers: getHeaders(),
    });
    if (res.ok) {
      const json = await safeFetchJson(res);
      if (json && json.data) {
        backendResult = {
          connected: json.data.connected,
          status: json.data.status,
          message: json.data.message,
          dapodikUrl: json.data.dapodik_url,
          lastCheckedAt: json.data.last_checked_at,
        };
        if (backendResult.connected) {
          return backendResult;
        }
      }
    }
  } catch (err: any) {
    // ignore
  }

  // Direct Browser Ping to Dapodik Localhost Port 5774
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    await fetch('http://localhost:5774', {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return {
      connected: true,
      status: 'ONLINE',
      message: '🟢 TERHUBUNG: Aplikasi Dapodik Lokal (http://localhost:5774) terdeteksi aktif di komputer ini!',
      dapodikUrl: 'http://localhost:5774',
      lastCheckedAt: new Date().toISOString(),
    };
  } catch (directErr) {
    // Port 5774 is unreachable
  }

  return backendResult || {
    connected: false,
    status: 'OFFLINE',
    message: '🔴 OFFLINE: Aplikasi Dapodik Localhost (http://localhost:5774) atau Backend API Server tidak terjangkau.',
    dapodikUrl: 'http://localhost:5774',
    lastCheckedAt: new Date().toISOString(),
  };
}

export async function getDapodikSyncRecords(): Promise<DapodikSyncRecord[]> {
  try {
    const res = await fetchApi('/api/v1/dapodik/sync-records', {
      method: 'GET',
      headers: getHeaders(),
    });
    if (res.ok) {
      const json = await safeFetchJson(res);
      if (json && json.data && Array.isArray(json.data) && json.data.length > 0) {
        const records = json.data.map((r: any) => ({
          id: r.id,
          nisn: r.nisn,
          nik: r.nik,
          namaSchoolOS: r.nama_school_os,
          namaDapodik: r.nama_dapodik,
          rombel: r.rombel,
          identityState: r.identity_state,
          mobilityCase: r.mobility_case,
          classification: r.classification,
          actionRecommended: r.action_recommended,
          stage: r.stage,
          lastSyncedAt: r.last_synced_at,
        }));
        // Storage to cache removed as per user request (strict DB only)

        return records;
      }
    }
  } catch (err: any) {
    // ignore
  }

  // Fallback to cache removed as per user request (strict DB only)

  // STRICT ZERO SAMPLE DATA! If 0 real records, return empty array []!
  return [];
}

/**
 * Fetch All Outbox Jobs from Rust Backend API (PostgreSQL)
 */
export async function getDapodikOutboxJobs(): Promise<DapodikOutboxJob[]> {
  try {
    const res = await fetchApi('/api/v1/dapodik/outbox-jobs', {
      method: 'GET',
      headers: getHeaders(),
    });
    if (res.ok) {
      const json = await safeFetchJson(res);
      if (json && json.data && Array.isArray(json.data)) {
        return json.data.map((j: any) => ({
          jobId: j.job_id,
          reqId: j.req_id,
          operation: j.operation,
          entityId: j.entity_id,
          idempotencyKey: j.idempotency_key,
          attempts: j.attempts,
          status: j.status,
          createdAt: j.created_at,
        }));
      }
    }
  } catch (err: any) {
    // ignore
  }
  return [];
}

/**
 * PULL Data (Executes Real WebService API & PostgreSQL Ingestion via Backend API)
 */
export async function pullDataFromDapodik(config?: PullDapodikConfig): Promise<{
  newRecordsCount: number;
  updatedRecords: DapodikSyncRecord[];
}> {
  try {
    const res = await fetchApi('/api/v1/dapodik/pull', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        dapodik_url: config?.dapodikUrl?.trim() || undefined,
        npsn: config?.npsn?.trim() || undefined,
        bearer_token: config?.bearerToken?.trim() || undefined,
      }),
    });
    const json = await safeFetchJson(res);
    if (!res.ok || !json.success) {
      const errorMsg = json?.error?.message || json?.message || 'Gagal menarik data dari Dapodik WebService';
      throw new Error(errorMsg);
    }
    if (res && json && json.success && json.data && Array.isArray(json.data)) {
      const pulled = json.data.map((r: any) => ({
        id: r.id,
        nisn: r.nisn,
        nik: r.nik,
        namaSchoolOS: r.nama_school_os,
        namaDapodik: r.nama_dapodik,
        rombel: r.rombel,
        identityState: r.identity_state,
        mobilityCase: r.mobility_case,
        classification: r.classification,
        actionRecommended: r.action_recommended,
        stage: r.stage,
        lastSyncedAt: r.last_synced_at,
      }));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dapodik_data_updated', { detail: { count: pulled.length } }));
      }

      return {
        newRecordsCount: pulled.length,
        updatedRecords: pulled,
      };
    }
  } catch (err: any) {
    console.error('[DapodikBridge] Error pulling data:', err);
    throw new Error(err.message || 'Gagal menghubungi Dapodik WebService Backend');
  }

  return {
    newRecordsCount: 0,
    updatedRecords: [],
  };
}

/**
 * PUSH Data (Executes Real PostgreSQL Outbox Job INSERT via Backend API)
 */
export async function pushDataToDapodik(
  entityId: string,
  operation: 'INSERT_STUDENT' | 'UPDATE_MUTATION' | 'ROMBEL_ASSIGNMENT'
): Promise<{
  success: boolean;
  newJob: DapodikOutboxJob;
}> {
  try {
    const res = await fetchApi('/api/v1/dapodik/push', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        entity_id: entityId,
        operation: operation,
      }),
    });
    const json = await safeFetchJson(res);
    if (!res.ok || !json.success) {
      const errorMsg = json?.error?.message || json?.message || 'Gagal mengirim outbox job ke Dapodik';
      throw new Error(errorMsg);
    }
    if (res && json && json.success && json.data) {
      return {
        success: true,
        newJob: {
          jobId: json.data.job_id,
          reqId: json.data.req_id,
          operation: json.data.operation,
          entityId: json.data.entity_id,
          idempotencyKey: json.data.idempotency_key,
          attempts: json.data.attempts,
          status: json.data.status,
          createdAt: json.data.created_at,
        },
      };
    }
  } catch (err: any) {
    console.error('[DapodikBridge] Error pushing data:', err);
    throw new Error(err.message || 'Gagal menghubungi Dapodik WebService Backend');
  }

  throw new Error('Gagal memproses Dapodik Push Job');
}

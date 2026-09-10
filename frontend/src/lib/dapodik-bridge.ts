import { getTenantItem, setTenantItem, removeTenantItem } from '@/lib/tenant-storage';
/**
 * School OS — Dapodik Local Bridge & Anti-Corruption Layer (ACL) Engine
 * Real Database & API Integration Layer (Connects directly to Backend API /api/v1/dapodik)
 */

import { apiClient, getApiUrl } from '@/lib/api';

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

function getHeaders() {
  const token = apiClient.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchApi(endpoint: string, options: RequestInit = {}): Promise<Response> {
  try {
    const fullUrl = getApiUrl(endpoint);
    const res = await fetch(fullUrl, options);
    if (res.ok) return res;
  } catch (e) {
    // Backend unreachable, fall through to Next.js route
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
 * Perform Real Health Check against Local Bridge (Port 5775) & Dapodik (Port 5774)
 */
export async function checkDapodikHealth(): Promise<DapodikHealthStatus> {
  // 1. First probe the Local Silent Bridge on port 5775
  try {
    const bridgeRes = await fetch('http://127.0.0.1:5775/health', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (bridgeRes.ok) {
      const bridgeJson = await bridgeRes.json();
      const dapodikOnline = bridgeJson.data?.dapodik_online ?? false;
      return {
        connected: dapodikOnline,
        status: dapodikOnline ? 'ONLINE' : 'OFFLINE',
        message: dapodikOnline
          ? '🟢 TERHUBUNG: Bridge & Dapodik Lokal (127.0.0.1:5774) siap disinkronkan!'
          : '⚡ Bridge aktif, namun aplikasi Dapodik (port 5774) belum dibuka di laptop ini.',
        dapodikUrl: 'http://127.0.0.1:5774',
        lastCheckedAt: new Date().toISOString(),
      };
    }
  } catch {
    // Local bridge not yet running
  }

  // 2. Direct Browser Ping to Dapodik Localhost Port 5774
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    await fetch('http://127.0.0.1:5774', {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return {
      connected: true,
      status: 'ONLINE',
      message: '🟢 Dapodik Localhost (Port 5774) aktif di komputer ini.',
      dapodikUrl: 'http://127.0.0.1:5774',
      lastCheckedAt: new Date().toISOString(),
    };
  } catch {
    // Port 5774 is unreachable
  }

  return {
    connected: false,
    status: 'OFFLINE',
    message: 'Aplikasi Dapodik lokal (port 5774) atau Bridge belum aktif di komputer ini.',
    dapodikUrl: 'http://127.0.0.1:5774',
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
 * PULL Data (Executes Real WebService API & PostgreSQL Ingestion via Silent Bridge)
 */
export async function pullDataFromDapodik(config?: PullDapodikConfig): Promise<{
  newRecordsCount: number;
  updatedRecords: DapodikSyncRecord[];
}> {
  const token = apiClient.getToken() || '';
  const cloudUrl = getApiUrl('').replace(/\/api\/v1\/?$/, '');

  // Step 1: Call Silent Local Bridge on 127.0.0.1:5775 (CORS-enabled, zero-console)
  try {
    const bridgeRes = await fetch('http://127.0.0.1:5775/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cloud_url: cloudUrl || 'https://schoolosbackend-production.up.railway.app',
        cloud_token: token,
        npsn: config?.npsn?.trim() || undefined,
        dapodik_token: config?.bearerToken?.trim() || undefined,
        dapodik_url: config?.dapodikUrl?.trim() || 'http://127.0.0.1:5774',
      }),
    });

    if (bridgeRes.ok) {
      const bridgeJson = await bridgeRes.json();
      if (bridgeJson.success && bridgeJson.data) {
        // Fetch fresh records from Cloud PostgreSQL now that sync has populated them
        const freshRecords = await getDapodikSyncRecords();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('dapodik_data_updated', {
              detail: { count: freshRecords.length },
            })
          );
        }
        return {
          newRecordsCount: bridgeJson.data.total_students,
          updatedRecords: freshRecords,
        };
      } else {
        throw new Error(bridgeJson.error || 'Gagal menyinkronkan data Dapodik.');
      }
    } else {
      const errText = await bridgeRes.text();
      let errObj;
      try {
        errObj = JSON.parse(errText);
      } catch {}
      throw new Error(
        errObj?.error || 'Bridge lokal melaporkan kesalahan saat menarik data Dapodik.'
      );
    }
  } catch (err: any) {
    if (
      err.message &&
      !err.message.includes('Failed to fetch') &&
      !err.message.includes('NetworkError')
    ) {
      throw err;
    }

    // Bridge is not running on 127.0.0.1:5775
    throw new Error(
      'Aplikasi Pendukung School OS (Bridge) belum aktif di komputer ini. Silakan jalankan SchoolOS-Bridge sekali saja agar tombol tarik data dapat membaca Dapodik lokal.'
    );
  }
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

export interface DapodikAgentInfo {
  tenantId: string;
  schoolName: string;
  npsn: string;
  dapodikUrl?: string;
  dapodikToken?: string;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
}

export async function getDapodikAgentInfo(): Promise<DapodikAgentInfo | null> {
  try {
    const res = await fetchApi('/api/v1/dapodik/agent/info', {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) return null;
    const json = await safeFetchJson(res);
    const data = json.data || json;
    return {
      tenantId: data.tenant_id,
      schoolName: data.school_name,
      npsn: data.npsn,
      dapodikUrl: data.dapodik_url,
      dapodikToken: data.dapodik_token,
      totalStudents: Number(data.total_students) || 0,
      totalTeachers: Number(data.total_teachers) || 0,
      totalClasses: Number(data.total_classes) || 0,
    };
  } catch (e) {
    console.error('Failed to fetch agent info:', e);
    return null;
  }
}


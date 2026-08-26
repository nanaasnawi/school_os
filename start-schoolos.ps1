# ============================================================
#  School OS — Startup Script
#  Menjalankan semua service School OS dengan aman
#  TIDAK akan mengganggu atau bentrok dengan Dapodik
# ============================================================

$ErrorActionPreference = "SilentlyContinue"

# ── Konfigurasi Port ─────────────────────────────────────────
# PENTING: School OS menggunakan port BERBEDA dari Dapodik
# Dapodik PostgreSQL  → port 5432 (default, JANGAN diubah)
# School OS PostgreSQL → port 5433 (TERPISAH, aman)
# School OS Backend    → port 8000
# School OS Frontend   → port 3000

$SCHOOLOS_DB_PORT   = 5433   # BERBEDA dari Dapodik (5432)
$SCHOOLOS_API_PORT  = 8000
$SCHOOLOS_WEB_PORT  = 3000
$DAPODIK_PORT       = 5432   # Dapodik default (hanya untuk cek, tidak disentuh)

$ROOT = $PSScriptRoot
$BACKEND_DIR  = Join-Path $ROOT "backend"
$FRONTEND_DIR = Join-Path $ROOT "frontend"
$ENV_FILE     = Join-Path $BACKEND_DIR ".env"

function Write-Header  { param($msg) Write-Host "`n$msg" -ForegroundColor Cyan }
function Write-OK      { param($msg) Write-Host "  [OK]  $msg" -ForegroundColor Green }
function Write-WARN    { param($msg) Write-Host "  [!!]  $msg" -ForegroundColor Yellow }
function Write-ERR     { param($msg) Write-Host "  [XX]  $msg" -ForegroundColor Red }
function Write-INFO    { param($msg) Write-Host "  [--]  $msg" -ForegroundColor Gray }

Clear-Host
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   SCHOOL OS - Service Launcher v1.0" -ForegroundColor White
Write-Host "   $(Get-Date -Format 'dddd, dd MMMM yyyy HH:mm')" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan

# ════════════════════════════════════════════════════════════
# LANGKAH 1: KESELAMATAN — Pastikan tidak bentrok dengan Dapodik
# ════════════════════════════════════════════════════════════
Write-Header "LANGKAH 1: Memeriksa Keamanan Port (Isolasi dari Dapodik)"

$dapodikDbRunning = (netstat -ano | Select-String ":$DAPODIK_PORT " | Select-String "LISTENING").Count -gt 0

if ($dapodikDbRunning) {
    Write-OK "Dapodik PostgreSQL terdeteksi di port $DAPODIK_PORT — School OS akan menggunakan port $SCHOOLOS_DB_PORT (AMAN, tidak akan bentrok)"
} else {
    Write-INFO "Dapodik PostgreSQL tidak terdeteksi di port $DAPODIK_PORT (mungkin tidak aktif)"
}

if (Test-Path $ENV_FILE) {
    $envContent = Get-Content $ENV_FILE -Raw
    if ($envContent -match "localhost:$SCHOOLOS_DB_PORT") {
        Write-OK "File .env backend sudah menggunakan port $SCHOOLOS_DB_PORT (terpisah dari Dapodik)"
    } elseif ($envContent -match "localhost:$DAPODIK_PORT") {
        Write-ERR "BAHAYA! File .env backend menggunakan port $DAPODIK_PORT (sama dengan Dapodik!)."
        Write-WARN "Memperbaiki otomatis..."
        $fixed = $envContent -replace "localhost:$DAPODIK_PORT/school_os", "localhost:$SCHOOLOS_DB_PORT/school_os"
        Set-Content -Path $ENV_FILE -Value $fixed -NoNewline
        Write-OK "Port di .env sudah diperbaiki ke $SCHOOLOS_DB_PORT"
    } else {
        Write-WARN ".env tidak mengandung pattern yang dikenal, periksa manual: $ENV_FILE"
    }
}

# ════════════════════════════════════════════════════════════
# LANGKAH 2: Cek PostgreSQL School OS (port 5433)
# ════════════════════════════════════════════════════════════
Write-Header "LANGKAH 2: Memeriksa Database School OS (port $SCHOOLOS_DB_PORT)"

$schoolDbRunning = (netstat -ano | Select-String ":$SCHOOLOS_DB_PORT " | Select-String "LISTENING").Count -gt 0

if ($schoolDbRunning) {
    Write-OK "PostgreSQL School OS sudah berjalan di port $SCHOOLOS_DB_PORT"
} else {
    Write-WARN "PostgreSQL School OS belum berjalan di port $SCHOOLOS_DB_PORT"
    
    $dockerAvailable = Get-Command docker -ErrorAction SilentlyContinue
    if ($dockerAvailable) {
        Write-INFO "Docker ditemukan — mencoba menjalankan School OS database via Docker..."
        Push-Location $ROOT
        docker compose up -d 2>&1 | Out-Null
        Pop-Location
        Start-Sleep -Seconds 5
        $schoolDbRunning = (netstat -ano | Select-String ":$SCHOOLOS_DB_PORT " | Select-String "LISTENING").Count -gt 0
        if ($schoolDbRunning) {
            Write-OK "PostgreSQL School OS berhasil dijalankan via Docker di port $SCHOOLOS_DB_PORT"
        } else {
            Write-ERR "Gagal menjalankan database via Docker."
        }
    } else {
        Write-WARN "Docker tidak tersedia. Pastikan PostgreSQL School OS berjalan manual di port $SCHOOLOS_DB_PORT"
    }
    
    if (-not $schoolDbRunning) {
        Write-ERR "Database School OS tidak bisa dijalankan. Backend tidak akan bisa terhubung."
    }
}

# ════════════════════════════════════════════════════════════
# LANGKAH 3: Cek & Jalankan Backend Rust API (port 8000)
# ════════════════════════════════════════════════════════════
Write-Header "LANGKAH 3: Memeriksa Backend Rust API (port $SCHOOLOS_API_PORT)"

$backendRunning = (netstat -ano | Select-String ":$SCHOOLOS_API_PORT " | Select-String "LISTENING").Count -gt 0

if ($backendRunning) {
    Write-OK "Backend Rust API sudah berjalan di port $SCHOOLOS_API_PORT"
} else {
    Write-INFO "Menjalankan Backend Rust API di port $SCHOOLOS_API_PORT..."
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$BACKEND_DIR'; Write-Host '[School OS Backend]' -ForegroundColor Cyan; cargo run -p api-server"
    ) -WindowStyle Normal
    
    $waited = 0
    Write-INFO "Menunggu backend siap (bisa 1-2 menit jika perlu compile)..."
    while (-not $backendRunning -and $waited -lt 90) {
        Start-Sleep -Seconds 3
        $waited += 3
        $backendRunning = (netstat -ano | Select-String ":$SCHOOLOS_API_PORT " | Select-String "LISTENING").Count -gt 0
        if ($backendRunning) { break }
        Write-Host "  ." -NoNewline -ForegroundColor Gray
    }
    Write-Host ""
    
    if ($backendRunning) {
        Write-OK "Backend Rust API berhasil berjalan di port $SCHOOLOS_API_PORT"
    } else {
        Write-WARN "Backend belum siap dalam 90 detik. Cek window PowerShell terpisah."
    }
}

# ════════════════════════════════════════════════════════════
# LANGKAH 4: Cek & Jalankan Frontend Next.js (port 3000)
# ════════════════════════════════════════════════════════════
Write-Header "LANGKAH 4: Memeriksa Frontend Next.js (port $SCHOOLOS_WEB_PORT)"

$frontendRunning = (netstat -ano | Select-String ":$SCHOOLOS_WEB_PORT " | Select-String "LISTENING").Count -gt 0

if ($frontendRunning) {
    Write-OK "Frontend Next.js sudah berjalan di port $SCHOOLOS_WEB_PORT"
} else {
    Write-INFO "Menjalankan Frontend Next.js..."
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$FRONTEND_DIR'; Write-Host '[School OS Frontend]' -ForegroundColor Cyan; npm run dev"
    ) -WindowStyle Normal
    
    Start-Sleep -Seconds 8
    $frontendRunning = (netstat -ano | Select-String ":$SCHOOLOS_WEB_PORT " | Select-String "LISTENING").Count -gt 0
    if ($frontendRunning) {
        Write-OK "Frontend berhasil dijalankan di port $SCHOOLOS_WEB_PORT"
    } else {
        Write-INFO "Frontend sedang booting, tunggu beberapa detik..."
    }
}

# ════════════════════════════════════════════════════════════
# RINGKASAN STATUS AKHIR
# ════════════════════════════════════════════════════════════
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "   STATUS LAYANAN SCHOOL OS" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan

$schoolDbRunning2 = (netstat -ano | Select-String ":$SCHOOLOS_DB_PORT " | Select-String "LISTENING").Count -gt 0
$backendRunning2  = (netstat -ano | Select-String ":$SCHOOLOS_API_PORT " | Select-String "LISTENING").Count -gt 0
$frontendRunning2 = (netstat -ano | Select-String ":$SCHOOLOS_WEB_PORT " | Select-String "LISTENING").Count -gt 0
$dapodikDb2       = (netstat -ano | Select-String ":$DAPODIK_PORT " | Select-String "LISTENING").Count -gt 0

function Get-StatusLine { param([bool]$running, [string]$label, [string]$detail)
    $icon  = if ($running) { "[RUNNING]" } else { "[STOPPED]" }
    $color = if ($running) { "Green" } else { "Red" }
    Write-Host ("  {0,-10}  {1,-26} {2}" -f $icon, $label, $detail) -ForegroundColor $color
}

Write-Host ""
Write-Host "  DAPODIK (TIDAK DISENTUH OLEH SCHOOL OS):" -ForegroundColor Yellow
$dapodikIcon = if ($dapodikDb2) { "[RUNNING]" } else { "[STOPPED]" }
Write-Host ("  {0,-10}  PostgreSQL Dapodik         port {1}" -f $dapodikIcon, $DAPODIK_PORT) -ForegroundColor $(if ($dapodikDb2) { "Yellow" } else { "Gray" })

Write-Host ""
Write-Host "  SCHOOL OS (BERJALAN TERPISAH):" -ForegroundColor Cyan
Get-StatusLine -running $schoolDbRunning2 -label "PostgreSQL School OS" -detail "port $SCHOOLOS_DB_PORT  (AMAN dari Dapodik)"
Get-StatusLine -running $backendRunning2  -label "Backend Rust API"     -detail "http://localhost:$SCHOOLOS_API_PORT"
Get-StatusLine -running $frontendRunning2 -label "Frontend Web App"     -detail "http://localhost:$SCHOOLOS_WEB_PORT"

Write-Host ""
if ($schoolDbRunning2 -and $backendRunning2) {
    Write-Host "  Semua service inti sudah berjalan!" -ForegroundColor Green
    Write-Host "  Buka browser di: http://localhost:$SCHOOLOS_WEB_PORT" -ForegroundColor Cyan
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:$SCHOOLOS_WEB_PORT"
} else {
    Write-Host "  Beberapa service belum siap. Cek log di window terpisah." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  CATATAN PENTING UNTUK DEPLOYMENT:" -ForegroundColor Magenta
Write-Host "  - School OS di server online menggunakan DATABASE SENDIRI" -ForegroundColor Gray
Write-Host "  - Tidak ada Dapodik di server, jadi TIDAK ADA RISIKO KONFLIK" -ForegroundColor Gray
Write-Host "  - Setiap sekolah punya tenant_id unik (multi-tenant)" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Tekan Enter untuk menutup jendela ini..." -ForegroundColor Gray
Read-Host

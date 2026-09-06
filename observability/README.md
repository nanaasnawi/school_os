# School OS — Observability & Alerting Stack

Stack monitoring dan observabilitas terintegrasi untuk School OS menggunakan **Prometheus**, **Grafana**, **Alertmanager**, dan **Jaeger Distributed Tracing**.

---

## 1. Komponen & Port

| Layanan | Port Host | Deskripsi |
| :--- | :--- | :--- |
| **PostgreSQL** | `5433` | Database utama School OS (terisolasi dari Dapodik port 5432) |
| **Prometheus** | `9090` | Time-series metrics scraper (`/metrics` endpoint) & rule evaluator |
| **Grafana** | `3001` | Dashboard UI visualisasi performa server |
| **Alertmanager** | `9093` | Alert dispatcher ke Telegram Bot & Email SMTP |
| **Jaeger UI** | `16686` | Distributed tracing query UI & visualisasi trace span |
| **Jaeger OTLP** | `4317` / `4318` | OTLP gRPC/HTTP collector receiver |

---

## 2. Cara Menjalankan

Jalankan seluruh stack observabilitas bersama database menggunakan Docker Compose:

```bash
docker compose up -d
```

Buka browser:
- **Grafana Dashboard**: [http://localhost:3001](http://localhost:3001) (User: `admin`, Pass: `admin`)
  - Dashboard otomatis terpasang di folder: *School OS* -> *School OS — API Server Performance & Observability*
- **Prometheus Status**: [http://localhost:9090/targets](http://localhost:9090/targets)
- **Jaeger Tracing**: [http://localhost:16686](http://localhost:16686)
- **Alertmanager**: [http://localhost:9093](http://localhost:9093)

---

## 3. Konfigurasi Alerting Telegram & Email

Ubah variabel di file `.env` atau environment saat menjalankan `docker compose`:

```env
# Telegram Bot Alerting
TELEGRAM_BOT_TOKEN="123456789:ABCdefGhIJKlmNoPQRstuVWXyz"
TELEGRAM_CHAT_ID="-100123456789"

# Email SMTP Alerting
SMTP_HOST="smtp.gmail.com:587"
SMTP_USER="alert-service@schoolos.id"
SMTP_PASS="app-specific-password"
ALERT_EMAIL_TO="devops@schoolos.id"
```

### Rule Alert Bawaan (`observability/prometheus/alerts.yml`):
1. **SchoolOsServerDown**: Server down atau unreachable selama > 1 menit.
2. **HighHttp5xxErrorRate**: Error rate HTTP 5xx > 5% selama 2 menit.
3. **HighHttpLatency**: Latency p95 > 2 detik selama 5 menit.

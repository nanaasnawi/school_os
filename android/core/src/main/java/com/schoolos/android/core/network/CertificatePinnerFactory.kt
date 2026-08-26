package com.schoolos.android.core.network

import okhttp3.CertificatePinner

object CertificatePinnerFactory {
    fun create(): CertificatePinner = CertificatePinner.Builder()
        .add("api.schoolos.app", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=") // placeholder for production
        .build()
}

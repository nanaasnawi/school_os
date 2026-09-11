package com.schoolos.android.feature.learning.components

import android.content.Intent
import android.net.Uri
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView

/**
 * Interactive In-App Video Player for YouTube and Direct Video URLs.
 * Configured with proper Origin & Referer headers to eliminate YouTube Error 153.
 */
@Composable
fun InAppVideoPlayer(
    videoUrl: String,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val youtubeId = remember(videoUrl) {
        extractYouTubeVideoId(videoUrl)
    }

    val htmlContent = remember(videoUrl, youtubeId) {
        if (youtubeId != null) {
            """
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; background-color: #000; }
                    html, body { width: 100%; height: 100%; overflow: hidden; display: flex; justify-content: center; align-items: center; }
                    .video-wrapper { position: relative; width: 100%; height: 100%; }
                    iframe { width: 100%; height: 100%; border: none; }
                </style>
            </head>
            <body>
                <div class="video-wrapper">
                    <iframe 
                        src="https://www.youtube.com/embed/$youtubeId?autoplay=1&playsinline=1&enablejsapi=1&rel=0&modestbranding=1&origin=https://schoolos.id"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerpolicy="strict-origin-when-cross-origin"
                        allowfullscreen>
                    </iframe>
                </div>
            </body>
            </html>
            """.trimIndent()
        } else {
            """
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; background-color: #000; }
                    html, body { width: 100%; height: 100%; overflow: hidden; display: flex; justify-content: center; align-items: center; }
                    video { width: 100%; height: 100%; object-fit: contain; }
                </style>
            </head>
            <body>
                <video controls autoplay playsinline style="width:100%;height:100%;">
                    <source src="$videoUrl">
                    Browser tidak mendukung pemutar video ini.
                </video>
            </body>
            </html>
            """.trimIndent()
        }
    }

    Box(modifier = modifier.clip(RoundedCornerShape(bottomStart = 16.dp, bottomEnd = 16.dp))) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                WebView(ctx).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        mediaPlaybackRequiresUserGesture = false
                        loadWithOverviewMode = true
                        useWideViewPort = true
                        allowContentAccess = true
                        mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                        // Remove WebView signature to prevent YouTube player restriction
                        val defaultUa = userAgentString
                        userAgentString = defaultUa.replace("; wv", "")
                    }
                    webChromeClient = WebChromeClient()
                    webViewClient = object : WebViewClient() {
                        override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                            val url = request?.url?.toString() ?: return false
                            if (!url.contains("youtube.com/embed") && !url.contains("schoolos.id")) {
                                try {
                                    val intent = Intent(Intent.ACTION_VIEW, request.url)
                                    ctx.startActivity(intent)
                                    return true
                                } catch (e: Exception) {
                                    // ignore
                                }
                            }
                            return false
                        }
                    }
                    setBackgroundColor(android.graphics.Color.BLACK)
                    loadDataWithBaseURL(
                        "https://schoolos.id",
                        htmlContent,
                        "text/html",
                        "UTF-8",
                        null
                    )
                }
            },
            update = { webView ->
                webView.loadDataWithBaseURL(
                    "https://schoolos.id",
                    htmlContent,
                    "text/html",
                    "UTF-8",
                    null
                )
            }
        )

        // Shortcut button to open in YouTube app if available
        Row(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(8.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(Color.Black.copy(alpha = 0.75f))
                .clickable {
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(videoUrl))
                        context.startActivity(intent)
                    } catch (e: Exception) {
                        Toast.makeText(context, "Tidak dapat membuka tautan video", Toast.LENGTH_SHORT).show()
                    }
                }
                .padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.AutoMirrored.Filled.OpenInNew, contentDescription = null, tint = Color.White, modifier = Modifier.size(12.dp))
            Spacer(Modifier.width(4.dp))
            Text("Buka di YouTube", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        }
    }
}

fun extractYouTubeVideoId(url: String): String? {
    return when {
        url.contains("youtu.be/") -> {
            url.substringAfter("youtu.be/").substringBefore("?").substringBefore("&").trim()
        }
        url.contains("watch?v=") -> {
            url.substringAfter("watch?v=").substringBefore("&").substringBefore("?").trim()
        }
        url.contains("/embed/") -> {
            url.substringAfter("/embed/").substringBefore("?").substringBefore("&").trim()
        }
        url.contains("/shorts/") -> {
            url.substringAfter("/shorts/").substringBefore("?").substringBefore("&").trim()
        }
        else -> null
    }
}

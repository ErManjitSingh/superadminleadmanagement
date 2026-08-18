package info.exploremybharat.crm;

import android.app.DownloadManager;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.CookieManager;
import android.webkit.URLUtil;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

import java.io.OutputStream;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
      @Override
      public void handleOnBackPressed() {
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView != null && webView.canGoBack()) {
          webView.goBack();
          return;
        }
        finish();
      }
    });
  }

  @Override
  public void onStart() {
    super.onStart();
    setupDownloadListener();
  }

  private void setupDownloadListener() {
    if (getBridge() == null || getBridge().getWebView() == null) {
      return;
    }

    getBridge().getWebView().setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
      String fileName = URLUtil.guessFileName(url, contentDisposition, mimeType);
      if (fileName == null || fileName.isEmpty() || fileName.equals("downloadfile") || fileName.equals("downloadfile.bin")) {
        String ext = mimeType != null && mimeType.contains("pdf") ? ".pdf" : "";
        fileName = "ExploreMyBharat-" + System.currentTimeMillis() + ext;
      }

      if (url != null && url.startsWith("blob:")) {
        saveBlobUrl(url, fileName, mimeType);
        return;
      }

      try {
        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
        if (mimeType != null && !mimeType.isEmpty()) {
          request.setMimeType(mimeType);
        }
        String cookies = CookieManager.getInstance().getCookie(url);
        if (cookies != null) {
          request.addRequestHeader("cookie", cookies);
        }
        request.addRequestHeader("User-Agent", userAgent);
        request.setDescription("Explore My Bharat download");
        request.setTitle(fileName);
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
        DownloadManager manager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
        manager.enqueue(request);
        Toast.makeText(this, "Download started: " + fileName, Toast.LENGTH_SHORT).show();
      } catch (Exception e) {
        try {
          startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        } catch (Exception ignored) {
          Toast.makeText(this, "Could not download file", Toast.LENGTH_SHORT).show();
        }
      }
    });
  }

  private void saveBlobUrl(String blobUrl, String fileName, String mimeType) {
    WebView webView = getBridge().getWebView();
    String js =
      "(async function(){"
        + "try {"
        + "  const res = await fetch(" + jsonString(blobUrl) + ");"
        + "  const blob = await res.blob();"
        + "  const data = await new Promise((resolve, reject) => {"
        + "    const reader = new FileReader();"
        + "    reader.onloadend = () => resolve(reader.result);"
        + "    reader.onerror = reject;"
        + "    reader.readAsDataURL(blob);"
        + "  });"
        + "  return data;"
        + "} catch (e) { return ''; }"
        + "})()";

    webView.evaluateJavascript(js, value -> {
      if (value == null || value.equals("null") || value.equals("\"\"")) {
        Toast.makeText(this, "Could not save file", Toast.LENGTH_SHORT).show();
        return;
      }
      String dataUrl = unescapeJsString(value);
      int comma = dataUrl.indexOf(',');
      if (comma < 0) {
        Toast.makeText(this, "Could not save file", Toast.LENGTH_SHORT).show();
        return;
      }
      String meta = dataUrl.substring(0, comma);
      String b64 = dataUrl.substring(comma + 1);
      String mime = mimeType;
      if (meta.contains(":") && meta.contains(";")) {
        mime = meta.substring(meta.indexOf(':') + 1, meta.indexOf(';'));
      }
      if (mime == null || mime.isEmpty()) {
        mime = "application/pdf";
      }
      saveBytes(Base64.decode(b64, Base64.DEFAULT), fileName, mime);
    });
  }

  private void saveBytes(byte[] bytes, String fileName, String mimeType) {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        ContentValues values = new ContentValues();
        values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
        values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
        values.put(MediaStore.Downloads.IS_PENDING, 1);
        Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (uri == null) {
          throw new IllegalStateException("MediaStore insert failed");
        }
        try (OutputStream out = getContentResolver().openOutputStream(uri)) {
          if (out == null) {
            throw new IllegalStateException("No output stream");
          }
          out.write(bytes);
        }
        values.clear();
        values.put(MediaStore.Downloads.IS_PENDING, 0);
        getContentResolver().update(uri, values, null, null);
      } else {
        java.io.File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        if (!dir.exists()) {
          dir.mkdirs();
        }
        java.io.File file = new java.io.File(dir, fileName);
        try (OutputStream out = new java.io.FileOutputStream(file)) {
          out.write(bytes);
        }
      }
      Toast.makeText(this, "Saved to Downloads: " + fileName, Toast.LENGTH_LONG).show();
    } catch (Exception e) {
      Toast.makeText(this, "Could not save file", Toast.LENGTH_SHORT).show();
    }
  }

  private static String jsonString(String value) {
    return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
  }

  private static String unescapeJsString(String value) {
    if (value == null) {
      return "";
    }
    String trimmed = value;
    if (trimmed.length() >= 2 && trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
      trimmed = trimmed.substring(1, trimmed.length() - 1);
    }
    return trimmed.replace("\\u003d", "=").replace("\\/", "/").replace("\\\"", "\"");
  }
}

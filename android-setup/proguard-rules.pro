# AURA - Android ProGuard / R8 kuralları
# Bu dosyanın içeriğini `npx cap add android` sonrası oluşan
#   android/app/proguard-rules.pro
# dosyasına EKLE (var olanları silme, aşağıdaki satırları sonuna ekle).

# --- Kritik: ClassNotFoundException: androidx.core.app.CoreComponentFactory fix ---
-keep class androidx.core.app.CoreComponentFactory { *; }
-keep class androidx.core.** { *; }
-dontwarn androidx.core.**

# --- AndroidX genel koruma ---
-keep class androidx.** { *; }
-keep interface androidx.** { *; }
-dontwarn androidx.**

# --- Capacitor & pluginler ---
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod public *;
}
-dontwarn com.getcapacitor.**

# --- WebView JS köprüsü ---
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# --- Kotlin ---
-keep class kotlin.** { *; }
-keep class kotlinx.** { *; }
-dontwarn kotlin.**
-dontwarn kotlinx.**

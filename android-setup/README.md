# AURA · Android Kurulum (R8/ProGuard KAPALI sürüm)

Google Play Console'daki
`java.lang.ClassNotFoundException: androidx.core.app.CoreComponentFactory`
crash'inin en garantili çözümü: **R8/ProGuard küçültmesini tamamen kapatmak.**
Böylece hiçbir AndroidX sınıfı strip edilmez, ProGuard kuralı yazmakla uğraşmazsın.

---

## 1) Android platformunu ekle (bir defa)

```bash
npm install
npm run build
npx cap add android
npx cap sync android
```

## 2) `android/gradle.properties` — AndroidX açık olsun

```properties
android.useAndroidX=true
android.enableJetifier=true
```

Capacitor bunu default ekler, sadece doğrula.

## 3) `android/app/build.gradle` — minify & shrink KAPALI

`android { buildTypes { ... } }` bloğunu şu şekilde güncelle
(tam örnek: `android-setup/app-build.gradle.snippet`):

```gradle
buildTypes {
    release {
        minifyEnabled false
        shrinkResources false
        // proguardFiles satırını KALDIR veya yorum satırı yap
        signingConfig signingConfigs.release
    }
    debug {
        minifyEnabled false
        shrinkResources false
    }
}
```

Bu ayarla:
- R8 çalışmıyor → hiçbir sınıf silinmiyor → CoreComponentFactory crash'i imkansız.
- ProGuard kurallarını (`proguard-rules.pro`) yazmak/güncellemek gerekmiyor.
- Tek trade-off: APK/AAB birkaç MB daha büyük olur. Play Store için sorun değil.

## 4) `AndroidManifest.xml` doğrulama

`android/app/src/main/AndroidManifest.xml` içinde `<application>` etiketinde
**manuel `android:appComponentFactory` veya `tools:replace` yazma.**
Capacitor + AndroidX doğrusunu otomatik merge ediyor.

## 5) Temiz build + yeni AAB

```bash
npm run build
npx cap sync android
cd android
./gradlew clean
./gradlew bundleRelease
```

Çıktı: `android/app/build/outputs/bundle/release/app-release.aab`
→ Play Console'a yeni sürüm olarak yükle.

---

## Neden bu çözüm?

Önceki denemede ProGuard `-keep` kuralları ekledik ama:
- R8 config'i sürüm sürüm değişiyor,
- Capacitor plugin'leri yeni sınıflar ekleyince tekrar `-keep` yazman gerekiyor,
- Her yeni build'de aynı crash farklı sınıfla dönebiliyor.

`minifyEnabled false` bu belirsizliği tamamen kaldırır. İleride uygulaman
büyürse ve boyut önemli olursa tekrar açıp `proguard-rules.pro`'yu
yapılandırabilirsin (`android-setup/proguard-rules.pro` referans olarak duruyor).

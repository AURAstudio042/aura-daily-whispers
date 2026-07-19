# AURA · Android Kurulum ve Crash Fix

Google Play Console'daki
`java.lang.ClassNotFoundException: androidx.core.app.CoreComponentFactory`
hatası **AndroidX bağımlılıklarının R8/ProGuard tarafından strip edilmesi**
veya `android/gradle.properties` içinde AndroidX'in kapalı olmasından kaynaklanır.

Aşağıdaki adımları **lokal makinende** sırayla uygula.

---

## 1) Android platformunu ekle (bir defa)

```bash
npm install
npm run build          # dist/ üretir (Capacitor webDir)
npx cap add android    # android/ klasörünü oluşturur
npx cap sync android
```

## 2) `android/gradle.properties` — AndroidX + Jetifier açık olsun

Dosya zaten var; şu iki satır **mutlaka** olmalı (Capacitor default ekler,
yine de doğrula):

```properties
android.useAndroidX=true
android.enableJetifier=true
```

## 3) `android/app/build.gradle` — AndroidX core bağımlılığı

`dependencies { ... }` bloğuna ekle (eksikse):

```gradle
dependencies {
    implementation "androidx.core:core:1.13.1"
    implementation "androidx.core:core-ktx:1.13.1"
    implementation "androidx.appcompat:appcompat:1.7.0"
    // Capacitor'ın kendi eklediği satırları OLDUĞU GİBİ bırak.
}
```

Aynı dosyada `buildTypes.release` bloğunun ProGuard'ı doğru dosyayı
kullandığından emin ol:

```gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'),
                      'proguard-rules.pro'
    }
}
```

## 4) ProGuard kuralları — CoreComponentFactory fix

`android-setup/proguard-rules.pro` içeriğini
`android/app/proguard-rules.pro` dosyasına ekle (var olanları silme, sona ekle).

Kritik satır:

```proguard
-keep class androidx.core.app.CoreComponentFactory { *; }
-keep class androidx.core.** { *; }
-dontwarn androidx.core.**
```

## 5) `AndroidManifest.xml` doğrulama

`android/app/src/main/AndroidManifest.xml` içinde `<application ...>`
etiketinde **manuel bir `android:appComponentFactory` override etme**.
Capacitor / AndroidX zaten doğrusunu (`androidx.core.app.CoreComponentFactory`)
merge ediyor. Elle eklenmiş bir `tools:replace="android:appComponentFactory"`
varsa kaldır.

## 6) Temiz build + yeni AAB

```bash
npm run build
npx cap sync android
cd android
./gradlew clean
./gradlew bundleRelease
```

Çıkan `android/app/build/outputs/bundle/release/app-release.aab`
dosyasını Play Console'a yeni sürüm olarak yükle.

---

## Sık yapılan hatalar

- **`useAndroidX=false`** → support-library çakışması → CoreComponentFactory bulunamaz. Açık olmalı.
- **`minifyEnabled true` ama proguard-rules.pro boş** → R8 AndroidX sınıflarını atar → aynı crash. Yukarıdaki -keep kuralları şart.
- **Custom `appComponentFactory` override** → sistem androidx sınıfını yükleyemez. Manifest'ten kaldır.
- **Eski build cache** → `./gradlew clean` şart.

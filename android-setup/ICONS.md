# AURA · Android App Icon Kurulumu

Uygulama telefona indiğinde ana ekranda **siyah zeminli, mor/altın parlamalı A logosu** görünsün diye tüm launcher icon setleri (legacy + adaptive) `android-setup/res-icons/` altına hazırlandı.

- Ön plan (foreground): logonun kendisi, 66dp güvenli alan içinde merkezlenmiş
- Arka plan (background): tam siyah `#000000` (`values/ic_launcher_background.xml`)
- Adaptive icon tanımı: `mipmap-anydpi-v26/ic_launcher.xml` ve `ic_launcher_round.xml`
- Legacy (Android 7 ve öncesi) için her mipmap yoğunluğunda `ic_launcher.png` + `ic_launcher_round.png`
- Play Store listing için: `playstore-icon.png` (512×512)

## Uygulama (tek seferlik)

`npx cap add android` sonrası oluşan `android/app/src/main/res/` klasörüne aşağıdaki dosyaları kopyala (mevcut olanların üzerine yaz):

```bash
# Proje kökünden
SRC=android-setup/res-icons
DST=android/app/src/main/res

# Mipmap PNG'leri
for d in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  mkdir -p "$DST/mipmap-$d"
  cp "$SRC/mipmap-$d/"*.png "$DST/mipmap-$d/"
done

# Adaptive icon XML'leri
mkdir -p "$DST/mipmap-anydpi-v26"
cp "$SRC/mipmap-anydpi-v26/"*.xml "$DST/mipmap-anydpi-v26/"

# Siyah arka plan rengi
mkdir -p "$DST/values"
cp "$SRC/values/ic_launcher_background.xml" "$DST/values/"
```

`AndroidManifest.xml` içindeki `<application>` etiketinde şunlar bulunmalı (Capacitor default olarak ekler):

```xml
android:icon="@mipmap/ic_launcher"
android:roundIcon="@mipmap/ic_launcher_round"
```

Sonra:

```bash
npx cap sync android
cd android && ./gradlew clean bundleRelease
```

Play Console'a yeni AAB'yi yükle → cihaza indirdiğinde launcher'da siyah zeminli asil AURA logosu görünür.

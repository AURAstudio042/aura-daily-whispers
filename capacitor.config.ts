import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.aura",
  appName: "AURA",
  // Capacitor sadece statik dosya sunar. TanStack Start SSR olduğu için
  // native paketlemek yerine yayınlanan Lovable URL'sini yüklüyoruz.
  // Kendi statik build'ini üretmek istersen `webDir`'i "dist" yapıp
  // `server` bloğunu kaldırabilirsin.
  webDir: "dist",
  server: {
    url: "https://aura-daily-whispers.lovable.app",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;

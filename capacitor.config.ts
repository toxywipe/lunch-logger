
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ed21ef9624f2408a8f6a62cbe03d3d2e',
  appName: 'lunch-logger',
  webDir: 'dist',
  server: {
    url: 'https://ed21ef96-24f2-408a-8f6a-62cbe03d3d2e.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    },
  },
};

export default config;

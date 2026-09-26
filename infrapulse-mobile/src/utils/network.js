import Constants from 'expo-constants';

export const getWebServerUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const hostUri = Constants.experienceUrl || Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split('//')[1]?.split(':')[0] || hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }
  // Fallbacks for physical devices on LAN when hostUri fails
  return 'http://192.168.0.104:3000'; 
};

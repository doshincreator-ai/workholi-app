module.exports = {
  expo: {
    name: "WorkHoli",
    slug: "kiwilog",
    scheme: "workholiday",
    version: "1.0.0",
    orientation: "portrait",
    updates: {
      enabled: true,
      url: "https://u.expo.dev/1bee9b15-ebe3-4c30-b626-a865f90b5f17",
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      bundleIdentifier: "com.workholiday.app",
      buildNumber: "1",
      supportsTablet: false,
      infoPlist: {
        NSUserTrackingUsageDescription:
          "広告のパーソナライズや改善のため、広告識別子の利用許可をお願いしています。",
      },
      privacyManifests: {
        NSPrivacyAccessedAPITypes: [
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
            NSPrivacyAccessedAPITypeReasons: ["CA92.1"],
          },
        ],
      },
    },
    android: {
      package: "com.kiwilog.app",
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      permissions: ["com.google.android.gms.permission.AD_ID"],
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-sqlite",
      "expo-sharing",
      "expo-notifications",
      [
        "react-native-google-mobile-ads",
        {
          androidAppId: "ca-app-pub-8389237149068331~5369510894",
          iosAppId: "ca-app-pub-3940256099942544~1458002511",
        },
      ],
    ],
    extra: {
      router: {},
      eas: {
        projectId: "1bee9b15-ebe3-4c30-b626-a865f90b5f17",
      },
    },
  },
};

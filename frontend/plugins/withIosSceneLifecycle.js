const fs = require('fs');
const path = require('path');
const {
  createRunOncePlugin,
  withAppDelegate,
  withDangerousMod,
  withInfoPlist,
  withXcodeProject,
  IOSConfig,
} = require('@expo/config-plugins');

const SCENE_DELEGATE_FILENAME = 'SceneDelegate.swift';

const SCENE_DELEGATE_SOURCE = `import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate
    else {
      return
    }

    let window = appDelegate.window ?? UIWindow(windowScene: windowScene)
    window.windowScene = windowScene
    self.window = window
    appDelegate.window = window
    window.makeKeyAndVisible()
    appDelegate.startReactNativeIfNeeded(
      in: window,
      launchOptions: launchOptions(from: appDelegate, connectionOptions: connectionOptions)
    )
  }

  func sceneDidBecomeActive(_ scene: UIScene) {
    UIApplication.shared.delegate?.applicationDidBecomeActive?(UIApplication.shared)
  }

  func sceneWillResignActive(_ scene: UIScene) {
    UIApplication.shared.delegate?.applicationWillResignActive?(UIApplication.shared)
  }

  func sceneWillEnterForeground(_ scene: UIScene) {
    UIApplication.shared.delegate?.applicationWillEnterForeground?(UIApplication.shared)
  }

  func sceneDidEnterBackground(_ scene: UIScene) {
    UIApplication.shared.delegate?.applicationDidEnterBackground?(UIApplication.shared)
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    for context in URLContexts {
      _ = appDelegate.application(
        UIApplication.shared,
        open: context.url,
        options: urlOptions(from: context)
      )
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    _ = appDelegate.application(
      UIApplication.shared,
      continue: userActivity
    ) { _ in }
  }

  private func launchOptions(
    from appDelegate: AppDelegate,
    connectionOptions: UIScene.ConnectionOptions
  ) -> [UIApplication.LaunchOptionsKey: Any]? {
    var options = appDelegate.launchOptions ?? [:]
    if options[.url] == nil, let url = connectionOptions.urlContexts.first?.url {
      options[.url] = url
    }
    if options[.userActivityDictionary] == nil,
       let userActivity = connectionOptions.userActivities.first {
      options[.userActivityDictionary] = [
        UIApplication.LaunchOptionsKey.userActivityType: userActivity.activityType,
        "UIApplicationLaunchOptionsUserActivityKey": userActivity
      ]
    }
    return options
  }

  private func urlOptions(from context: UIOpenURLContext) -> [UIApplication.OpenURLOptionsKey: Any] {
    var options: [UIApplication.OpenURLOptionsKey: Any] = [
      .openInPlace: context.options.openInPlace
    ]
    if let sourceApplication = context.options.sourceApplication {
      options[.sourceApplication] = sourceApplication
    }
    if let annotation = context.options.annotation {
      options[.annotation] = annotation
    }
    return options
  }
}
`;

const LEGACY_WINDOW_START = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif`;

const PREVIOUS_SCENE_START = `    // SceneDelegate creates the window and starts React Native. The iOS 27 SDK
    // refuses to launch apps that still use the application-based life cycle.
    self.launchOptions = launchOptions`;

const APP_DELEGATE_START = `    self.launchOptions = launchOptions
#if os(iOS) || os(tvOS)
    // Scene may connect before didFinishLaunching. Reuse that window if present so
    // expo-dev-client can find a keyWindow, then start React Native at most once.
    let reactWindow: UIWindow
    if let existing = window {
      reactWindow = existing
    } else if let windowScene = application.connectedScenes.compactMap({ $0 as? UIWindowScene }).first {
      reactWindow = UIWindow(windowScene: windowScene)
    } else {
      reactWindow = UIWindow(frame: UIScreen.main.bounds)
    }
    window = reactWindow
    reactWindow.makeKeyAndVisible()
    startReactNativeIfNeeded(in: reactWindow, launchOptions: launchOptions)
#endif`;

const START_RN_HELPER = `
  var didStartReactNative = false

  func startReactNativeIfNeeded(
    in window: UIWindow,
    launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) {
    guard !didStartReactNative, let factory = reactNativeFactory else { return }
    didStartReactNative = true
    self.window = window
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions
    )
    window.makeKeyAndVisible()
  }
`;

const CONFIGURATION_METHOD = `
  public func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    let configuration = UISceneConfiguration(
      name: "Default Configuration",
      sessionRole: connectingSceneSession.role
    )
    configuration.delegateClass = SceneDelegate.self
    return configuration
  }
`;

function withSceneManifest(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return config;
  });
}

function withSceneAppDelegate(config) {
  return withAppDelegate(config, (config) => {
    if (config.modResults.language !== 'swift') {
      throw new Error('withIosSceneLifecycle expects a Swift AppDelegate.');
    }

    let contents = config.modResults.contents;

    if (!contents.includes('var launchOptions: [UIApplication.LaunchOptionsKey: Any]?')) {
      contents = contents.replace(
        'var reactNativeFactory: RCTReactNativeFactory?\n',
        'var reactNativeFactory: RCTReactNativeFactory?\n  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?\n'
      );
    }

    if (contents.includes(LEGACY_WINDOW_START)) {
      contents = contents.replace(LEGACY_WINDOW_START, APP_DELEGATE_START);
    } else if (contents.includes(PREVIOUS_SCENE_START)) {
      contents = contents.replace(PREVIOUS_SCENE_START, APP_DELEGATE_START);
    } else if (!contents.includes('startReactNativeIfNeeded(in: reactWindow')) {
      throw new Error('withIosSceneLifecycle could not find the React Native window startup block in AppDelegate.swift.');
    }

    if (!contents.includes('func startReactNativeIfNeeded(')) {
      const linkingMarker = '  // Linking API';
      if (!contents.includes(linkingMarker)) {
        throw new Error('withIosSceneLifecycle could not find the Linking API marker in AppDelegate.swift.');
      }
      contents = contents.replace(linkingMarker, `${START_RN_HELPER}\n${linkingMarker}`);
    }

    if (!contents.includes('configurationForConnecting')) {
      const linkingMarker = '  // Linking API';
      if (!contents.includes(linkingMarker)) {
        throw new Error('withIosSceneLifecycle could not find the Linking API marker in AppDelegate.swift.');
      }
      contents = contents.replace(linkingMarker, `${CONFIGURATION_METHOD}\n${linkingMarker}`);
    }

    config.modResults.contents = contents;
    return config;
  });
}

function withSceneDelegateFile(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const projectName = config.modRequest.projectName;
      const filePath = path.join(
        config.modRequest.platformProjectRoot,
        projectName,
        SCENE_DELEGATE_FILENAME
      );
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, SCENE_DELEGATE_SOURCE);
      return config;
    },
  ]);
}

function withSceneDelegateXcodeProject(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const projectName = config.modRequest.projectName;
    IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
      filepath: path.join(projectName, SCENE_DELEGATE_FILENAME),
      groupName: projectName,
      project,
    });
    return config;
  });
}

function withIosSceneLifecycle(config) {
  config = withSceneManifest(config);
  config = withSceneAppDelegate(config);
  config = withSceneDelegateFile(config);
  config = withSceneDelegateXcodeProject(config);
  return config;
}

module.exports = createRunOncePlugin(
  withIosSceneLifecycle,
  'with-ios-scene-lifecycle',
  '1.1.0'
);

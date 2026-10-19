import ActivityKit
import AppIntents
import Foundation

/// Live Activity shown on the Dynamic Island / Lock Screen when a new slip is found.
struct SlipActivityAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    enum Phase: String, Codable, Hashable {
      case pending, saving, saved, failed
    }

    var phase: Phase
    var message: String?
  }

  /// PHAsset.localIdentifier of the slip photo (also expo-media-library's asset id).
  let assetId: String
  let draft: SlipDraft
  /// When the slip was found, shown on the Lock Screen card.
  let detectedAt: Date

  /// Opens the RN app's edit popup for this slip.
  var editURL: URL? { slipURL(action: nil) }

  /// Opens the app, which asks for Face ID and then saves the slip as read.
  /// Saving goes through the app (not an App Intent) so its biometric lock always applies.
  var saveURL: URL? { slipURL(action: "save") }

  private func slipURL(action: String?) -> URL? {
    var components = URLComponents()
    components.scheme = "com.expensetracker.mobile"
    components.host = "slip"
    components.queryItems = [URLQueryItem(name: "asset", value: assetId)]
      + (action.map { [URLQueryItem(name: "action", value: $0)] } ?? [])
    return components.url
  }
}

enum SlipActivities {
  static func find(assetId: String) -> Activity<SlipActivityAttributes>? {
    Activity<SlipActivityAttributes>.activities.first { $0.attributes.assetId == assetId }
  }

  static func endAll() async {
    for activity in Activity<SlipActivityAttributes>.activities {
      await activity.end(nil, dismissalPolicy: .immediate)
    }
  }
}

/// "ข้าม" button on the Live Activity.
struct DismissSlipIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "ข้ามสลิป"
  static var isDiscoverable = false

  @Parameter(title: "Asset ID")
  var assetId: String

  init() {}

  init(assetId: String) {
    self.assetId = assetId
  }

  func perform() async throws -> some IntentResult {
    await SlipActivities.find(assetId: assetId)?.end(nil, dismissalPolicy: .immediate)
    return .result()
  }
}

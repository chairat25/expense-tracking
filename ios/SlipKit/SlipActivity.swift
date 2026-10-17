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
  var editURL: URL? {
    var components = URLComponents()
    components.scheme = "com.expensetracker.mobile"
    components.host = "slip"
    components.queryItems = [URLQueryItem(name: "asset", value: assetId)]
    return components.url
  }
}

enum SlipActivities {
  private static let savedLinger: TimeInterval = 4

  static func find(assetId: String) -> Activity<SlipActivityAttributes>? {
    Activity<SlipActivityAttributes>.activities.first { $0.attributes.assetId == assetId }
  }

  static func endAll() async {
    for activity in Activity<SlipActivityAttributes>.activities {
      await activity.end(nil, dismissalPolicy: .immediate)
    }
  }

  static func save(assetId: String) async {
    guard let activity = find(assetId: assetId) else { return }
    await activity.update(ActivityContent(state: .init(phase: .saving), staleDate: nil))
    do {
      try await ExpenseAPI.addExpense(activity.attributes.draft)
      await activity.end(
        ActivityContent(state: .init(phase: .saved), staleDate: nil),
        dismissalPolicy: .after(Date().addingTimeInterval(savedLinger))
      )
    } catch {
      let message = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
      await activity.update(ActivityContent(state: .init(phase: .failed, message: message), staleDate: nil))
    }
  }
}

/// "บันทึก" button on the Live Activity. LiveActivityIntent runs in the app's process.
struct SaveSlipIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "บันทึกสลิป"
  static var isDiscoverable = false
  /// Saving spends from the user's account, so a locked phone must unlock (Face ID) first.
  static var authenticationPolicy: IntentAuthenticationPolicy = .requiresAuthentication

  @Parameter(title: "Asset ID")
  var assetId: String

  init() {}

  init(assetId: String) {
    self.assetId = assetId
  }

  func perform() async throws -> some IntentResult {
    await SlipActivities.save(assetId: assetId)
    return .result()
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

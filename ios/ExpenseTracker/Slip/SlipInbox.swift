import ActivityKit
import Foundation
import ImageIO
import Photos
import UIKit
import UserNotifications

/// Finds a fresh slip in the photo library and announces it on the Dynamic Island
/// (Live Activity), falling back to a local notification when Live Activities are off.
enum SlipInbox {
  enum Outcome {
    case announced(SlipDraft)
    case nothingNew
    case noPhotoAccess
  }

  /// Same window as the RN sniffer (useRecentReceiptSniffer.ts).
  private static let maxPhotoAge: TimeInterval = 15 * 60

  static func checkLatest() async -> Outcome {
    let status = PHPhotoLibrary.authorizationStatus(for: .readWrite)
    guard status == .authorized || status == .limited else { return .noPhotoAccess }
    guard let asset = latestPhoto(),
          let created = asset.creationDate,
          Date().timeIntervalSince(created) <= maxPhotoAge,
          !HandledSlipAssets.contains(asset.localIdentifier)
    else { return .nothingNew }

    // Mark first so the app's own sniffer and repeated automation runs skip it.
    HandledSlipAssets.insert(asset.localIdentifier)

    guard let (image, orientation) = await loadImage(asset),
          let draft = try? SlipRecognizer.draft(from: image, orientation: orientation, date: created)
    else { return .nothingNew }

    await announce(draft, assetId: asset.localIdentifier)
    return .announced(draft)
  }

  private static func latestPhoto() -> PHAsset? {
    let options = PHFetchOptions()
    options.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
    options.fetchLimit = 1
    return PHAsset.fetchAssets(with: .image, options: options).firstObject
  }

  private static func loadImage(_ asset: PHAsset) async -> (CGImage, CGImagePropertyOrientation)? {
    let options = PHImageRequestOptions()
    options.isNetworkAccessAllowed = false
    options.deliveryMode = .highQualityFormat
    options.version = .current

    return await withCheckedContinuation { continuation in
      PHImageManager.default().requestImageDataAndOrientation(for: asset, options: options) { data, _, orientation, _ in
        guard let data,
              let source = CGImageSourceCreateWithData(data as CFData, nil),
              let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
        else {
          continuation.resume(returning: nil)
          return
        }
        continuation.resume(returning: (image, orientation))
      }
    }
  }

  private static func announce(_ draft: SlipDraft, assetId: String) async {
    let attributes = SlipActivityAttributes(assetId: assetId, draft: draft, detectedAt: Date())
    if ActivityAuthorizationInfo().areActivitiesEnabled {
      do {
        _ = try Activity.request(
          attributes: attributes,
          content: ActivityContent(state: .init(phase: .pending), staleDate: nil)
        )
        return
      } catch {
        // Fall through to a regular notification.
      }
    }
    await notify(draft, url: attributes.editURL)
  }

  private static func notify(_ draft: SlipDraft, url: URL?) async {
    let content = UNMutableNotificationContent()
    content.title = "พบสลิปใหม่ \(draft.formattedAmount)"
    content.body = "\(draft.note) · แตะเพื่อบันทึก"
    content.sound = .default
    if let url {
      content.userInfo = [SlipNotificationDelegate.urlKey: url.absoluteString]
    }
    let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: nil)
    try? await UNUserNotificationCenter.current().add(request)
  }
}

/// Photo ids already offered to the user. Shared with the RN app through the
/// SlipOcr Expo module, which reads/writes the same UserDefaults key.
enum HandledSlipAssets {
  private static let key = "slip.handledAssetIds"
  private static let limit = 50

  static func contains(_ id: String) -> Bool {
    (UserDefaults.standard.stringArray(forKey: key) ?? []).contains(id)
  }

  static func insert(_ id: String) {
    let current = UserDefaults.standard.stringArray(forKey: key) ?? []
    UserDefaults.standard.set(Array((current.filter { $0 != id } + [id]).suffix(limit)), forKey: key)
  }
}

/// Opens the slip deep link when the fallback notification is tapped.
final class SlipNotificationDelegate: NSObject, UNUserNotificationCenterDelegate {
  static let shared = SlipNotificationDelegate()
  static let urlKey = "slipURL"

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    if let link = response.notification.request.content.userInfo[Self.urlKey] as? String,
       let url = URL(string: link) {
      DispatchQueue.main.async { UIApplication.shared.open(url) }
    }
    completionHandler()
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    completionHandler([.banner, .sound])
  }
}

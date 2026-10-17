import ExpoModulesCore
import UIKit
import UserNotifications
import Vision

// Same UserDefaults key/limit as HandledSlipAssets in ios/ExpenseTracker/Slip/SlipInbox.swift,
// so slips already announced by the Shortcuts automation are not offered twice.
private let handledAssetIdsKey = "slip.handledAssetIds"
private let handledAssetIdsLimit = 50

public class SlipOcrModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SlipOcr")

    Function("getHandledAssetIds") { () -> [String] in
      UserDefaults.standard.stringArray(forKey: handledAssetIdsKey) ?? []
    }

    Function("markAssetHandled") { (id: String) in
      let current = UserDefaults.standard.stringArray(forKey: handledAssetIdsKey) ?? []
      let next = Array((current.filter { $0 != id } + [id]).suffix(handledAssetIdsLimit))
      UserDefaults.standard.set(next, forKey: handledAssetIdsKey)
    }

    // Needed for the fallback banner when Live Activities are turned off.
    AsyncFunction("requestAlertPermissionAsync") { () async -> Bool in
      (try? await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound])) ?? false
    }

    // Recognizes Thai + English text in a local image file and returns the lines top-to-bottom.
    AsyncFunction("recognizeTextAsync") { (uri: String, promise: Promise) in
      guard let url = URL(string: uri), url.isFileURL else {
        promise.reject("ERR_INVALID_URI", "Expected a file:// URI, got: \(uri)")
        return
      }
      guard let image = UIImage(contentsOfFile: url.path), let cgImage = image.cgImage else {
        promise.reject("ERR_IMAGE_LOAD", "Cannot load image at \(url.path)")
        return
      }

      let request = VNRecognizeTextRequest { request, error in
        if let error = error {
          promise.reject("ERR_OCR", error.localizedDescription)
          return
        }
        let observations = (request.results as? [VNRecognizedTextObservation]) ?? []
        let lines = observations
          .sorted { $0.boundingBox.maxY > $1.boundingBox.maxY }
          .compactMap { $0.topCandidates(1).first?.string }
        promise.resolve(lines)
      }
      request.recognitionLevel = .accurate
      request.recognitionLanguages = ["th-TH", "en-US"]
      request.usesLanguageCorrection = true

      let orientation = CGImagePropertyOrientation(image.imageOrientation)
      DispatchQueue.global(qos: .userInitiated).async {
        do {
          try VNImageRequestHandler(cgImage: cgImage, orientation: orientation).perform([request])
        } catch {
          promise.reject("ERR_OCR", error.localizedDescription)
        }
      }
    }
  }
}

private extension CGImagePropertyOrientation {
  init(_ orientation: UIImage.Orientation) {
    switch orientation {
    case .up: self = .up
    case .upMirrored: self = .upMirrored
    case .down: self = .down
    case .downMirrored: self = .downMirrored
    case .left: self = .left
    case .leftMirrored: self = .leftMirrored
    case .right: self = .right
    case .rightMirrored: self = .rightMirrored
    @unknown default: self = .up
    }
  }
}

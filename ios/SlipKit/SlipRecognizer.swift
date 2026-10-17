import Foundation
import ImageIO
import JavaScriptCore
import UIKit
import Vision

/// OCR (Apple Vision, Thai + English) + slip rules from the bundled slip-analyzer.js,
/// so native code applies exactly the same checks as the RN app.
enum SlipRecognizer {
  /// Returns a draft when the image is a payment slip, nil otherwise (selfie, chat screenshot, ...).
  static func draft(from image: CGImage, orientation: CGImagePropertyOrientation, date: Date) throws -> SlipDraft? {
    let text = try recognizeLines(in: image, orientation: orientation).joined(separator: "\n")
    guard let analysis = analyze(text: text) else { return nil }
    return SlipDraft(
      amount: analysis.amount,
      note: analysis.note,
      category: analysis.category,
      date: SlipDraft.bangkokDateKey(date)
    )
  }

  static func recognizeLines(in image: CGImage, orientation: CGImagePropertyOrientation) throws -> [String] {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.recognitionLanguages = ["th-TH", "en-US"]
    request.usesLanguageCorrection = true

    try VNImageRequestHandler(cgImage: image, orientation: orientation).perform([request])
    return (request.results ?? [])
      .sorted { $0.boundingBox.maxY > $1.boundingBox.maxY }
      .compactMap { $0.topCandidates(1).first?.string }
  }

  private struct Analysis {
    let amount: Double
    let note: String
    let category: String
  }

  private static func analyze(text: String) -> Analysis? {
    guard let scriptURL = Bundle.main.url(forResource: "slip-analyzer", withExtension: "js"),
          let script = try? String(contentsOf: scriptURL, encoding: .utf8),
          let context = JSContext()
    else { return nil }

    context.evaluateScript(script)
    guard let result = context.objectForKeyedSubscript("SlipAnalyzer")?
      .objectForKeyedSubscript("analyzeSlip")?
      .call(withArguments: [text])?
      .toDictionary(),
      result["isSlip"] as? Bool == true,
      let amount = (result["amount"] as? NSNumber)?.doubleValue,
      let note = result["note"] as? String,
      let category = result["category"] as? String
    else { return nil }

    return Analysis(amount: amount, note: note, category: category)
  }
}

extension CGImagePropertyOrientation {
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

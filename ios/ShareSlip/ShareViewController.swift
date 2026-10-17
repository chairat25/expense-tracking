import SwiftUI
import UIKit
import UniformTypeIdentifiers

/// Share-sheet entry: share a slip image from any app → check / edit → save straight to the API.
final class ShareViewController: UIViewController {
  override func viewDidLoad() {
    super.viewDidLoad()
    let model = ShareSlipModel(
      onClose: { [weak self] in self?.extensionContext?.completeRequest(returningItems: nil) }
    )
    let host = UIHostingController(rootView: ShareSlipView(model: model))
    addChild(host)
    host.view.frame = view.bounds
    host.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    host.view.backgroundColor = .clear
    view.addSubview(host.view)
    host.didMove(toParent: self)

    Task { await model.load(from: extensionContext?.inputItems as? [NSExtensionItem] ?? []) }
  }
}

@MainActor
final class ShareSlipModel: ObservableObject {
  enum Phase: Equatable {
    case loading
    case editing
    case saving
    case saved
  }

  @Published var phase: Phase = .loading
  @Published var image: UIImage?
  @Published var amountText = ""
  @Published var note = ""
  @Published var errorMessage: String?
  @Published var isSlipDetected = false

  private var category = "food"
  private let onClose: () -> Void
  private static let savedLinger: UInt64 = 800_000_000

  init(onClose: @escaping () -> Void) {
    self.onClose = onClose
  }

  var amount: Double? {
    Double(amountText.replacingOccurrences(of: ",", with: "")).flatMap { $0 > 0 ? $0 : nil }
  }

  func load(from items: [NSExtensionItem]) async {
    guard let image = await Self.loadImage(from: items), let cgImage = image.cgImage else {
      errorMessage = "ไม่พบรูปภาพที่แชร์มา"
      phase = .editing
      return
    }
    self.image = image

    let orientation = CGImagePropertyOrientation(image.imageOrientation)
    let draft = await Task.detached(priority: .userInitiated) {
      try? SlipRecognizer.draft(from: cgImage, orientation: orientation, date: Date())
    }.value

    if let draft {
      isSlipDetected = true
      amountText = String(format: draft.amount.truncatingRemainder(dividingBy: 1) == 0 ? "%.0f" : "%.2f", draft.amount)
      note = draft.note
      category = draft.category
    }
    phase = .editing
  }

  func save() async {
    guard let amount else {
      errorMessage = "กรุณาใส่จำนวนเงิน"
      return
    }
    errorMessage = nil
    phase = .saving
    let draft = SlipDraft(amount: amount, note: note, category: category, date: SlipDraft.bangkokDateKey(Date()))
    do {
      try await ExpenseAPI.addExpense(draft)
      phase = .saved
      try? await Task.sleep(nanoseconds: Self.savedLinger)
      onClose()
    } catch {
      errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
      phase = .editing
    }
  }

  func cancel() {
    onClose()
  }

  private static func loadImage(from items: [NSExtensionItem]) async -> UIImage? {
    let providers = items.flatMap { $0.attachments ?? [] }
    guard let provider = providers.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.image.identifier) }) else {
      return nil
    }
    return await withCheckedContinuation { continuation in
      provider.loadItem(forTypeIdentifier: UTType.image.identifier) { item, _ in
        switch item {
        case let image as UIImage:
          continuation.resume(returning: image)
        case let data as Data:
          continuation.resume(returning: UIImage(data: data))
        case let url as URL:
          continuation.resume(returning: (try? Data(contentsOf: url)).flatMap(UIImage.init(data:)))
        default:
          continuation.resume(returning: nil)
        }
      }
    }
  }
}

import AppIntents

/// Exposed to Shortcuts so a personal automation ("when K PLUS is closed") can run it.
/// Conforms to LiveActivityIntent so it may start a Live Activity from the background.
struct CheckLatestSlipIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "ตรวจสลิปล่าสุด"
  static var description = IntentDescription("อ่านสลิปโอนเงินล่าสุดในอัลบั้ม แล้วแจ้งบน Dynamic Island ให้กดบันทึก")
  static var openAppWhenRun = false

  func perform() async throws -> some IntentResult {
    _ = await SlipInbox.checkLatest()
    return .result()
  }
}

struct ExpenseTrackerShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: CheckLatestSlipIntent(),
      phrases: ["ตรวจสลิปล่าสุดด้วย \(.applicationName)", "Check latest slip in \(.applicationName)"],
      shortTitle: "ตรวจสลิปล่าสุด",
      systemImageName: "doc.text.viewfinder"
    )
  }
}

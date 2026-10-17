import Foundation

/// Settings the RN app publishes for native code (see src/mobile/lib/nativeConfig.ts).
struct NativeConfig: Decodable {
  let apiBaseUrl: String
  let supabaseUrl: String
  let supabaseAnonKey: String
  let sessionStorageKey: String

  static let keychainService = "expense-native"
  static let keychainAccount = "native-config"

  static func load() throws -> NativeConfig {
    guard let stored = SharedKeychain.read(
      services: SharedKeychain.expoServices(keychainService),
      account: keychainAccount
    ) else {
      throw SlipKitError.notConfigured
    }
    do {
      return try JSONDecoder().decode(NativeConfig.self, from: Data(stored.value.utf8))
    } catch {
      throw SlipKitError.notConfigured
    }
  }
}

/// An expense parsed from a slip, ready to POST to /api/transactions.
struct SlipDraft: Codable, Hashable {
  var amount: Double
  var note: String
  var category: String
  /// yyyy-MM-dd in Asia/Bangkok, same as the web app's date keys.
  var date: String

  static func bangkokDateKey(_ date: Date) -> String {
    let formatter = DateFormatter()
    formatter.calendar = Calendar(identifier: .gregorian)
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone(identifier: "Asia/Bangkok")
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter.string(from: date)
  }

  var formattedAmount: String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .decimal
    formatter.minimumFractionDigits = 0
    formatter.maximumFractionDigits = 2
    return "\(formatter.string(from: NSNumber(value: amount)) ?? String(amount)) ฿"
  }

  /// "฿1,265.00" for the Live Activity's monospaced amount.
  var bahtAmount: String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .decimal
    formatter.minimumFractionDigits = 2
    formatter.maximumFractionDigits = 2
    return "฿\(formatter.string(from: NSNumber(value: amount)) ?? String(amount))"
  }
}

enum SlipKitError: LocalizedError {
  case notConfigured
  case notSignedIn
  case server(status: Int, message: String)
  case network(String)

  var errorDescription: String? {
    switch self {
    case .notConfigured: return "เปิดแอพ Expense Tracker หนึ่งครั้งก่อนใช้งาน"
    case .notSignedIn: return "กรุณาเข้าสู่ระบบในแอพก่อน"
    case let .server(_, message): return message
    case let .network(message): return "เชื่อมต่อไม่สำเร็จ: \(message)"
    }
  }
}

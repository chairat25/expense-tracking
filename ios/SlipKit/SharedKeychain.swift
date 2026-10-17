import Foundation
import Security

/// Reads/writes generic-password items in the keychain access group shared by the
/// app and its extensions. The app's default group is this same group (first entry
/// of `keychain-access-groups`), so items expo-secure-store writes from JS are visible here.
enum SharedKeychain {
  /// `$(AppIdentifierPrefix)com.pond.expensetracker`, expanded at build time into each target's Info.plist.
  static var accessGroup: String? {
    Bundle.main.object(forInfoDictionaryKey: "SlipKeychainGroup") as? String
  }

  /// expo-secure-store stores non-biometric items under `<service>:no-auth` (older builds: `<service>`).
  static func expoServices(_ service: String) -> [String] {
    ["\(service):no-auth", service]
  }

  static func read(services: [String], account: String) -> (service: String, value: String)? {
    for service in services {
      var query = baseQuery(service: service, account: account)
      query[kSecMatchLimit as String] = kSecMatchLimitOne
      query[kSecReturnData as String] = kCFBooleanTrue

      var item: CFTypeRef?
      guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
            let data = item as? Data,
            let value = String(data: data, encoding: .utf8)
      else { continue }
      return (service, value)
    }
    return nil
  }

  @discardableResult
  static func update(service: String, account: String, value: String) -> Bool {
    let attributes = [kSecValueData as String: Data(value.utf8)]
    return SecItemUpdate(baseQuery(service: service, account: account) as CFDictionary, attributes as CFDictionary) == errSecSuccess
  }

  private static func baseQuery(service: String, account: String) -> [String: Any] {
    // Mirrors expo-secure-store: account and generic both hold the UTF-8 key.
    let encodedKey = Data(account.utf8)
    var query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrGeneric as String: encodedKey,
      kSecAttrAccount as String: encodedKey,
    ]
    if let accessGroup {
      query[kSecAttrAccessGroup as String] = accessGroup
    }
    return query
  }
}

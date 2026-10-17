import Foundation

/// Gives native code a valid Supabase access token by reading the session the RN app
/// stores via expo-secure-store. When the token is about to expire it refreshes it and
/// writes the rotated session back to the same item; supabase-js re-reads storage on
/// every getSession(), so the app picks up the new refresh token instead of reusing the old one.
enum AuthSession {
  private static let expiryMargin: TimeInterval = 60

  static func validAccessToken(config: NativeConfig) async throws -> String {
    guard let stored = SharedKeychain.read(
      services: SharedKeychain.expoServices("app"),
      account: config.sessionStorageKey
    ),
      let session = try? JSONSerialization.jsonObject(with: Data(stored.value.utf8)) as? [String: Any],
      let accessToken = session["access_token"] as? String,
      let refreshToken = session["refresh_token"] as? String
    else {
      throw SlipKitError.notSignedIn
    }

    let expiresAt = (session["expires_at"] as? NSNumber)?.doubleValue ?? 0
    if expiresAt - Date().timeIntervalSince1970 > expiryMargin {
      return accessToken
    }

    let refreshed = try await refresh(refreshToken: refreshToken, config: config)
    let merged = session.merging(refreshed) { _, new in new }
    if let data = try? JSONSerialization.data(withJSONObject: merged),
       let json = String(data: data, encoding: .utf8) {
      SharedKeychain.update(service: stored.service, account: config.sessionStorageKey, value: json)
    }
    guard let newToken = merged["access_token"] as? String else { throw SlipKitError.notSignedIn }
    return newToken
  }

  private static func refresh(refreshToken: String, config: NativeConfig) async throws -> [String: Any] {
    guard let url = URL(string: "\(config.supabaseUrl)/auth/v1/token?grant_type=refresh_token") else {
      throw SlipKitError.notConfigured
    }
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue(config.supabaseAnonKey, forHTTPHeaderField: "apikey")
    request.httpBody = try JSONSerialization.data(withJSONObject: ["refresh_token": refreshToken])

    let (data, response) = try await HTTP.send(request)
    guard response.statusCode == 200,
          var body = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
          body["access_token"] is String
    else {
      // 400/401 here means the refresh token was revoked or already rotated.
      throw SlipKitError.notSignedIn
    }
    if body["expires_at"] == nil, let expiresIn = (body["expires_in"] as? NSNumber)?.doubleValue {
      body["expires_at"] = Int(Date().timeIntervalSince1970 + expiresIn)
    }
    return body
  }
}

enum HTTP {
  static func send(_ request: URLRequest) async throws -> (Data, HTTPURLResponse) {
    do {
      let (data, response) = try await URLSession.shared.data(for: request)
      guard let http = response as? HTTPURLResponse else { throw SlipKitError.network("invalid response") }
      return (data, http)
    } catch let error as SlipKitError {
      throw error
    } catch {
      throw SlipKitError.network(error.localizedDescription)
    }
  }
}

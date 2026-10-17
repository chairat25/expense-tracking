import Foundation

/// Native client for the web app's API (same endpoint the RN app uses).
enum ExpenseAPI {
  static func addExpense(_ draft: SlipDraft) async throws {
    let config = try NativeConfig.load()
    let token = try await AuthSession.validAccessToken(config: config)

    guard let url = URL(string: "\(config.apiBaseUrl)/api/transactions") else {
      throw SlipKitError.notConfigured
    }
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    request.httpBody = try JSONSerialization.data(withJSONObject: [
      "date": draft.date,
      "type": "expense",
      "amount": draft.amount,
      "category": draft.category,
      "note": draft.note.trimmingCharacters(in: .whitespacesAndNewlines),
    ])

    let (data, response) = try await HTTP.send(request)
    guard (200..<300).contains(response.statusCode) else {
      let body = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
      let message = body?["error"] as? String ?? "บันทึกไม่สำเร็จ (\(response.statusCode))"
      throw response.statusCode == 401 ? SlipKitError.notSignedIn : SlipKitError.server(status: response.statusCode, message: message)
    }
  }
}

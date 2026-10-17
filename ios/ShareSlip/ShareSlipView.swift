import SwiftUI

/// Mirrors the RN AutoReceiptModal: slip preview, amount, editable note, save / skip.
struct ShareSlipView: View {
  @ObservedObject var model: ShareSlipModel
  @FocusState private var focusedField: Field?

  private enum Field { case amount, note }

  private static let emerald = Color(red: 16 / 255, green: 185 / 255, blue: 129 / 255)
  private static let card = Color(red: 30 / 255, green: 41 / 255, blue: 59 / 255)
  private static let field = Color(red: 15 / 255, green: 23 / 255, blue: 42 / 255)
  private static let muted = Color(red: 148 / 255, green: 163 / 255, blue: 184 / 255)
  private static let noteMaxLength = 100

  var body: some View {
    VStack(spacing: 16) {
      header
      if model.phase == .loading {
        ProgressView("กำลังอ่านสลิป…")
          .tint(Self.emerald)
          .foregroundStyle(Self.muted)
          .frame(maxWidth: .infinity, minHeight: 200)
      } else {
        content
      }
    }
    .padding(20)
    .background(Self.card)
    .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
    .padding(.horizontal, 12)
    .frame(maxHeight: .infinity, alignment: .bottom)
    .background(Color.black.opacity(0.5).ignoresSafeArea())
    .preferredColorScheme(.dark)
  }

  private var header: some View {
    HStack(spacing: 8) {
      Image(systemName: "doc.text.viewfinder").foregroundStyle(Self.emerald)
      Text(model.isSlipDetected || model.phase == .loading ? "บันทึกสลิปเป็นรายจ่าย" : "ไม่พบยอดในรูป · ใส่เองได้")
        .font(.headline)
        .foregroundStyle(.white)
    }
  }

  @ViewBuilder
  private var content: some View {
    if let image = model.image {
      Image(uiImage: image)
        .resizable()
        .scaledToFit()
        .frame(maxHeight: 220)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    HStack(alignment: .firstTextBaseline, spacing: 4) {
      TextField("0", text: $model.amountText)
        .keyboardType(.decimalPad)
        .multilineTextAlignment(.center)
        .font(.system(size: 30, weight: .heavy))
        .foregroundStyle(Self.emerald)
        .focused($focusedField, equals: .amount)
      Text("฿").font(.title2.bold()).foregroundStyle(Self.emerald)
    }

    TextField("หมายเหตุ (เช่น ค่ากาแฟ)", text: $model.note)
      .multilineTextAlignment(.center)
      .foregroundStyle(.white)
      .padding(.vertical, 10)
      .padding(.horizontal, 12)
      .background(Self.field)
      .clipShape(RoundedRectangle(cornerRadius: 10))
      .focused($focusedField, equals: .note)
      .onChange(of: model.note) { value in
        if value.count > Self.noteMaxLength { model.note = String(value.prefix(Self.noteMaxLength)) }
      }

    if let error = model.errorMessage {
      Text(error).font(.footnote).foregroundStyle(.red).multilineTextAlignment(.center)
    }

    HStack(spacing: 12) {
      Button("ข้าม") { model.cancel() }
        .font(.body.weight(.semibold))
        .foregroundStyle(Self.muted)
        .frame(maxWidth: .infinity, minHeight: 46)
        .background(Color(red: 51 / 255, green: 65 / 255, blue: 85 / 255))
        .clipShape(RoundedRectangle(cornerRadius: 10))

      Button {
        focusedField = nil
        Task { await model.save() }
      } label: {
        Group {
          switch model.phase {
          case .saving: ProgressView().tint(.white)
          case .saved: Label("บันทึกแล้ว", systemImage: "checkmark.circle.fill")
          default: Label("บันทึกรายการ", systemImage: "checkmark")
          }
        }
        .font(.body.bold())
        .foregroundStyle(.white)
        .frame(maxWidth: .infinity, minHeight: 46)
        .background(model.amount == nil ? Self.emerald.opacity(0.4) : Self.emerald)
        .clipShape(RoundedRectangle(cornerRadius: 10))
      }
      .disabled(model.amount == nil || model.phase != .editing)
      .layoutPriority(1)
    }
  }
}

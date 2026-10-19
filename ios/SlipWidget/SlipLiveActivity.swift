import ActivityKit
import AppIntents
import SwiftUI
import WidgetKit

@main
struct SlipWidgetBundle: WidgetBundle {
  var body: some Widget {
    SlipLiveActivity()
  }
}

private enum Palette {
  static let emerald = Color(red: 16 / 255, green: 185 / 255, blue: 129 / 255)
  static let emeraldDeep = Color(red: 5 / 255, green: 150 / 255, blue: 105 / 255)
  static let mint = Color(red: 52 / 255, green: 211 / 255, blue: 153 / 255)
  static let slate = Color(red: 148 / 255, green: 163 / 255, blue: 184 / 255)
  static let muted = Color(red: 203 / 255, green: 213 / 255, blue: 225 / 255)
  static let rose = Color(red: 244 / 255, green: 63 / 255, blue: 94 / 255)
  static let card = Color(red: 30 / 255, green: 41 / 255, blue: 59 / 255)
}

private let slipIcon = "doc.text"

/// Thai label + SF Symbol for the category slugs in src/mobile/lib/shared.ts.
private struct CategoryStyle {
  let name: String
  let symbol: String

  init(slug: String) {
    switch slug {
    case "food": (name, symbol) = ("อาหาร", "fork.knife")
    case "drink": (name, symbol) = ("เครื่องดื่ม", "cup.and.saucer.fill")
    case "transport": (name, symbol) = ("เดินทาง", "car.fill")
    case "bill": (name, symbol) = ("บิล/ค่างวด", "doc.plaintext")
    case "shopping": (name, symbol) = ("ของใช้", "bag.fill")
    case "fun": (name, symbol) = ("บันเทิง", "film")
    default: (name, symbol) = ("อื่นๆ", "shippingbox.fill")
    }
  }
}

struct SlipLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: SlipActivityAttributes.self) { context in
      SlipLockScreenView(context: context)
        .padding(16)
        .activityBackgroundTint(Palette.card.opacity(0.85))
        .activitySystemActionForegroundColor(.white)
        .widgetURL(context.attributes.editURL)
    } dynamicIsland: { context in
      let draft = context.attributes.draft
      return DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          VStack(alignment: .leading, spacing: 6) {
            Label(draft.note, systemImage: slipIcon)
              .font(.footnote.bold())
              .foregroundStyle(.white)
              .labelStyle(EmeraldIconLabelStyle())
              .lineLimit(1)
            CategoryChip(slug: draft.category)
          }
          .padding(.leading, 6)
          .dynamicIsland(verticalPlacement: .belowIfTooWide)
        }
        DynamicIslandExpandedRegion(.trailing) {
          AmountText(draft: draft, size: 22)
            .padding(.trailing, 6)
        }
        DynamicIslandExpandedRegion(.bottom) {
          SlipActionRow(context: context, saveTitle: "บันทึกรายการ")
            .padding(.horizontal, 6)
            .padding(.top, 4)
        }
      } compactLeading: {
        Image(systemName: slipIcon)
          .font(.footnote.weight(.semibold))
          .foregroundStyle(Palette.emerald)
      } compactTrailing: {
        AmountText(draft: draft, size: 13)
      } minimal: {
        Image(systemName: slipIcon)
          .foregroundStyle(Palette.emerald)
      }
      .widgetURL(context.attributes.editURL)
    }
  }
}

private struct SlipLockScreenView: View {
  let context: ActivityViewContext<SlipActivityAttributes>

  var body: some View {
    let draft = context.attributes.draft
    VStack(alignment: .leading, spacing: 12) {
      HStack {
        Label("ตรวจพบสลิปใหม่", systemImage: slipIcon)
          .font(.footnote.bold())
          .foregroundStyle(.white)
          .labelStyle(EmeraldIconLabelStyle())
        Spacer()
        Text(context.attributes.detectedAt.formatted(.dateTime.hour(.twoDigits(amPM: .omitted)).minute()) + " น.")
          .font(.caption2.monospaced())
          .foregroundStyle(Palette.slate)
      }
      HStack(alignment: .center) {
        VStack(alignment: .leading, spacing: 4) {
          Text(draft.note)
            .font(.footnote.weight(.semibold))
            .foregroundStyle(Palette.muted)
            .lineLimit(1)
          CategoryChip(slug: draft.category)
        }
        Spacer(minLength: 8)
        AmountText(draft: draft, size: 24)
      }
      SlipActionRow(context: context, saveTitle: "บันทึกทันที")
    }
  }
}

/// Monospaced emerald amount, e.g. "฿10.00".
private struct AmountText: View {
  let draft: SlipDraft
  let size: CGFloat

  var body: some View {
    Text(draft.bahtAmount)
      .font(.system(size: size, weight: .heavy, design: .monospaced))
      .foregroundStyle(size < 16 ? Palette.mint : Palette.emerald)
      .lineLimit(1)
      .minimumScaleFactor(0.6)
  }
}

private struct CategoryChip: View {
  let slug: String

  var body: some View {
    let style = CategoryStyle(slug: slug)
    Label(style.name, systemImage: style.symbol)
      .font(.caption2.weight(.semibold))
      .foregroundStyle(Palette.mint)
      .padding(.horizontal, 8)
      .padding(.vertical, 3)
      .background(Palette.emerald.opacity(0.15), in: RoundedRectangle(cornerRadius: 7))
      .overlay(RoundedRectangle(cornerRadius: 7).stroke(Palette.emerald.opacity(0.3), lineWidth: 1))
  }
}

private struct EmeraldIconLabelStyle: LabelStyle {
  func makeBody(configuration: Configuration) -> some View {
    HStack(spacing: 6) {
      configuration.icon.foregroundStyle(Palette.emerald)
      configuration.title
    }
  }
}

/// Skip / save buttons, replaced by a status line once the user acts.
private struct SlipActionRow: View {
  let context: ActivityViewContext<SlipActivityAttributes>
  let saveTitle: String

  /// Roughly a third of the row, so save stays the primary (~2x wider) action.
  private static let skipWidth: CGFloat = 104

  var body: some View {
    switch context.state.phase {
    case .pending:
      HStack(spacing: 10) {
        Button(intent: DismissSlipIntent(assetId: context.attributes.assetId)) {
          Label("ข้าม", systemImage: "xmark")
            .foregroundStyle(Palette.muted)
            .frame(width: Self.skipWidth)
            .padding(.vertical, 9)
            .background(.white.opacity(0.1), in: RoundedRectangle(cornerRadius: 13))
            .overlay(RoundedRectangle(cornerRadius: 13).stroke(.white.opacity(0.15), lineWidth: 1))
        }

        // A Link (not an App Intent) so saving always passes the app's Face ID lock.
        Link(destination: context.attributes.saveURL ?? URL(string: "com.expensetracker.mobile://")!) {
          Label(saveTitle, systemImage: "checkmark")
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 9)
            .background(
              LinearGradient(colors: [Palette.emerald, Palette.emeraldDeep], startPoint: .top, endPoint: .bottom),
              in: RoundedRectangle(cornerRadius: 13)
            )
        }
      }
      .buttonStyle(.plain)
      .font(.footnote.bold())
      .labelStyle(CompactLabelStyle())
    case .saving:
      status("กำลังบันทึก…", systemImage: "arrow.triangle.2.circlepath", color: Palette.slate)
    case .saved:
      status("บันทึกแล้ว", systemImage: "checkmark.circle.fill", color: Palette.emerald)
    case .failed:
      status(context.state.message ?? "บันทึกไม่สำเร็จ · แตะเพื่อเปิดแอพ", systemImage: "exclamationmark.triangle.fill", color: Palette.rose)
    }
  }

  private func status(_ text: String, systemImage: String, color: Color) -> some View {
    Label(text, systemImage: systemImage)
      .font(.footnote.bold())
      .foregroundStyle(color)
      .lineLimit(2)
      .frame(maxWidth: .infinity)
      .padding(.vertical, 9)
  }
}

private struct CompactLabelStyle: LabelStyle {
  func makeBody(configuration: Configuration) -> some View {
    HStack(spacing: 4) {
      configuration.icon.imageScale(.small)
      configuration.title
    }
  }
}

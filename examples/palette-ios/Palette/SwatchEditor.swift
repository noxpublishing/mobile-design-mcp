import SwiftUI

struct SwatchEditor: View {
    @State private var draft: Swatch
    let namespace: Namespace.ID
    let onSave: (Swatch) -> Void
    let onCancel: () -> Void

    init(swatch: Swatch, namespace: Namespace.ID, onSave: @escaping (Swatch) -> Void, onCancel: @escaping () -> Void) {
        _draft = State(initialValue: swatch); self.namespace = namespace; self.onSave = onSave; self.onCancel = onCancel
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                RoundedRectangle(cornerRadius: 28).fill(draft.color)
                    .matchedGeometryEffect(id: draft.id, in: namespace)
                    .frame(height: 240)
                    .overlay(alignment: .bottomLeading) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(draft.name).font(.system(.largeTitle, design: .serif))
                            Text(draft.hex).font(.system(.body, design: .monospaced))
                        }.foregroundStyle(draft.labelColor).padding(24)
                    }
                Text("Adjust the balance").font(.title2).fontWeight(.semibold)
                channel("Red", value: $draft.red)
                channel("Green", value: $draft.green)
                channel("Blue", value: $draft.blue)
                Text("The composition updates when you save. Cancel keeps your original colour.")
                    .font(.footnote).foregroundStyle(.secondary)
            }.padding(PaletteTheme.inset)
        }
        .safeAreaInset(edge: .top) {
            HStack {
                Button("Cancel", action: onCancel).frame(minHeight: 44).accessibilityIdentifier("cancel-edit")
                Spacer()
                Button("Save colour") { onSave(draft) }.fontWeight(.semibold).frame(minHeight: 44).accessibilityIdentifier("save-colour")
            }.padding(.horizontal, PaletteTheme.inset).padding(.vertical, 8).background(PaletteTheme.paper)
        }
        .background(PaletteTheme.paper)
    }

    private func channel(_ title: String, value: Binding<Double>) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack { Text(title); Spacer(); Text("\(Int((value.wrappedValue * 255).rounded()))").monospacedDigit().foregroundStyle(.secondary) }
            Slider(value: value, in: 0...1).accessibilityLabel(title).accessibilityIdentifier("channel-" + title.lowercased())
        }
    }
}

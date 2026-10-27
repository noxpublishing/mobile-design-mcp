import SwiftUI

enum PaletteTheme {
    static let paper = Color(uiColor: .systemGroupedBackground)
    static let card = Color(uiColor: .secondarySystemGroupedBackground)
    static let accent = Color(uiColor: UIColor { $0.userInterfaceStyle == .dark
        ? UIColor(red: 0.98, green: 0.70, blue: 0.53, alpha: 1)
        : UIColor(red: 0.49, green: 0.22, blue: 0.15, alpha: 1) })
    static let inset: CGFloat = 24
    static let gap: CGFloat = 12
}

extension Swatch {
    var color: Color { Color(red: red, green: green, blue: blue) }
    var labelColor: Color { darkText ? .black : .white }
}

struct CompositionCanvas: View {
    let composition: Composition
    var body: some View {
        GeometryReader { geometry in
            HStack(spacing: 0) {
                ForEach(Array(composition.swatches.enumerated()), id: \.element.id) { index, swatch in
                    Rectangle().fill(swatch.color)
                        .overlay(alignment: .bottomLeading) {
                            Circle().fill(composition.swatches[(index + 2) % composition.swatches.count].color)
                                .frame(width: geometry.size.width / 5 * 1.5)
                                .offset(x: -geometry.size.width / 15, y: geometry.size.width / 12)
                        }.clipped()
                }
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Composition preview, colours in current palette order")
    }
}

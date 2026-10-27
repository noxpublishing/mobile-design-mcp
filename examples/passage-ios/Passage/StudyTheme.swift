import SwiftUI

enum PassageTheme {
    static let background = Color(uiColor: .systemGroupedBackground)
    static let accent = Color(uiColor: UIColor { $0.userInterfaceStyle == .dark
        ? UIColor(red: 0.55, green: 0.83, blue: 0.83, alpha: 1)
        : UIColor(red: 0.10, green: 0.36, blue: 0.38, alpha: 1) })
}

struct RouteSketch: View {
    let stops: [Stop]
    var body: some View {
        GeometryReader { geometry in
            let fractions: [CGPoint] = [CGPoint(x: 0.13, y: 0.68), CGPoint(x: 0.38, y: 0.27), CGPoint(x: 0.65, y: 0.65), CGPoint(x: 0.86, y: 0.30)]
            let points = fractions.map { CGPoint(x: $0.x * geometry.size.width, y: $0.y * geometry.size.height) }
            ZStack {
                Color(red: 0.12, green: 0.23, blue: 0.26)
                Path { path in
                    path.move(to: points[0])
                    for point in points.dropFirst() { path.addLine(to: point) }
                }.stroke(Color.white.opacity(0.5), style: StrokeStyle(lineWidth: 2, lineCap: .round, dash: [5, 7]))
                ForEach(Array(stops.enumerated()), id: \.element.id) { index, _ in
                    Text("\(index + 1)").font(.system(.caption, design: .monospaced)).fontWeight(.bold)
                        .frame(width: 32, height: 32).background(index == 0 ? Color(red: 0.94, green: 0.69, blue: 0.37) : Color.white)
                        .foregroundStyle(Color.black).clipShape(Circle()).position(points[index])
                }
            }
        }.accessibilityHidden(true)
    }
}

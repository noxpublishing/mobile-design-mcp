import Foundation

struct Swatch: Identifiable, Codable, Equatable {
    let id: String
    var name: String
    var red: Double
    var green: Double
    var blue: Double

    var hex: String { String(format: "#%02X%02X%02X", Int((red * 255).rounded()), Int((green * 255).rounded()), Int((blue * 255).rounded())) }
    var valid: Bool { !id.isEmpty && !name.isEmpty && [red, green, blue].allSatisfy { $0.isFinite && (0...1).contains($0) } }
    var darkText: Bool {
        let channels = [red, green, blue].map { $0 <= 0.04045 ? $0 / 12.92 : pow(($0 + 0.055) / 1.055, 2.4) }
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722 > 0.179
    }
}

struct Composition: Codable, Equatable {
    var schema = "palette-study-v1"
    var swatches: [Swatch]
    var valid: Bool { schema == "palette-study-v1" && swatches.count == 5 && Set(swatches.map(\.id)).count == 5 && swatches.allSatisfy(\.valid) }
    var svg: String {
        let columns = swatches.enumerated().map { index, swatch in
            let accent = swatches[(index + 2) % swatches.count]
            return "<clipPath id=\"column-\(index)\"><rect x=\"\(index * 200)\" y=\"0\" width=\"200\" height=\"600\"/></clipPath>\n"
                + "<g clip-path=\"url(#column-\(index))\"><rect x=\"\(index * 200)\" y=\"0\" width=\"200\" height=\"600\" fill=\"\(swatch.hex)\"/>"
                + "<circle cx=\"\(index * 200).0\" cy=\"0\" r=\"150\" fill=\"\(accent.hex)\" transform=\"translate(83.333333 533.333333)\"/></g>"
        }.joined(separator: "\n")
        return "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1000\" height=\"600\" viewBox=\"0 0 1000 600\"><title>Palette colour composition</title>\n\(columns)\n</svg>\n"
    }
    static let sample = Composition(swatches: [
        Swatch(id: "clay", name: "Clay", red: 0.77, green: 0.32, blue: 0.23),
        Swatch(id: "ochre", name: "Ochre", red: 0.91, green: 0.67, blue: 0.25),
        Swatch(id: "ink", name: "Ink", red: 0.20, green: 0.25, blue: 0.24),
        Swatch(id: "rose", name: "Rose", red: 0.84, green: 0.65, blue: 0.59),
        Swatch(id: "linen", name: "Linen", red: 0.94, green: 0.91, blue: 0.83),
    ])
}

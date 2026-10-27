import Foundation

struct Stop: Identifiable, Codable, Equatable {
    let id: String
    let title: String
    let kind: String
    let detail: String
    var startMinutes: Int
    let durationMinutes: Int
    var endMinutes: Int { startMinutes + durationMinutes }
    var clock: String { Self.clock(startMinutes) }
    var valid: Bool { !id.isEmpty && !title.isEmpty && startMinutes >= 0 && startMinutes < 1440 && durationMinutes > 0 && durationMinutes <= 1440 - startMinutes }
    static func clock(_ minutes: Int) -> String { String(format: "%02d:%02d", minutes / 60, minutes % 60) }
}

struct Itinerary: Codable, Equatable {
    var schema = "passage-study-v1"
    var stops: [Stop]
    var valid: Bool { schema == "passage-study-v1" && stops.count == 4 && Set(stops.map(\.id)).count == 4 && stops.allSatisfy(\.valid) }
    var conflictingIDs: Set<String> {
        var result = Set<String>()
        for index in stops.indices.dropFirst() where stops[index - 1].endMinutes > stops[index].startMinutes {
            result.insert(stops[index - 1].id); result.insert(stops[index].id)
        }
        return result
    }
    func conflictNotes(for id: String) -> [String] {
        guard let index = stops.firstIndex(where: { $0.id == id }) else { return [] }
        var notes: [String] = []
        if index > 0 && stops[index - 1].endMinutes > stops[index].startMinutes {
            notes.append("The previous stop, \(stops[index - 1].title), ends at \(Stop.clock(stops[index - 1].endMinutes)).")
        }
        if index + 1 < stops.count && stops[index].endMinutes > stops[index + 1].startMinutes {
            notes.append("This stop ends after \(stops[index + 1].title) starts at \(stops[index + 1].clock).")
        }
        return notes
    }
    static let sample = Itinerary(stops: [
        Stop(id: "morning", title: "Morning table", kind: "Coffee & a notebook", detail: "Take the window seat and make a short plan for the day. This cafe is fictional study content, not a real venue recommendation.", startMinutes: 570, durationMinutes: 30),
        Stop(id: "print", title: "The print room", kind: "An hour with images", detail: "A small imaginary exhibition of paper, shape and colour. Leave enough time to look closely rather than collect every room.", startMinutes: 675, durationMinutes: 75),
        Stop(id: "water", title: "Along the water", kind: "Walk & a quiet pause", detail: "A fictional waterside stop for a slow walk. The route sketch is original geometry and contains no live map or travel-time data.", startMinutes: 780, durationMinutes: 45),
        Stop(id: "evening", title: "Evening lights", kind: "Dinner with a view", detail: "End the authored day plan at an imaginary neighbourhood table. Adjust the arrival time to see how neighbouring stops relate.", startMinutes: 975, durationMinutes: 60),
    ])
}

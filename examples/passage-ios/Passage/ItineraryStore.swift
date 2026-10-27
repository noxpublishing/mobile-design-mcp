import Foundation
import Combine

@MainActor
final class ItineraryStore: ObservableObject {
    @Published private(set) var itinerary: Itinerary = .sample
    @Published private(set) var history: [Itinerary] = []
    @Published private(set) var unsaved = false
    @Published var errorMessage: String?
    private let fileURL: URL?
    private var persistenceBlocked = false

    nonisolated static var defaultURL: URL {
        FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("Passage/itinerary.json")
    }
    init(fileURL: URL? = ItineraryStore.defaultURL) {
        self.fileURL = fileURL
        guard let fileURL, FileManager.default.fileExists(atPath: fileURL.path) else { return }
        do {
            let saved = try JSONDecoder().decode(Itinerary.self, from: Data(contentsOf: fileURL))
            guard saved.valid else { throw CocoaError(.fileReadCorruptFile) }
            itinerary = saved
        } catch {
            do {
                try FileManager.default.copyItem(at: fileURL, to: fileURL.appendingPathExtension("unreadable-" + UUID().uuidString))
                errorMessage = "The saved plan could not be read. A recovery copy was kept; the built-in plan is shown."
            } catch {
                persistenceBlocked = true
                errorMessage = "The saved plan could not be read or backed up. Changes stay in this session; the saved file is preserved."
            }
        }
    }
    func updateTime(id: String, minutes: Int) {
        guard let index = itinerary.stops.firstIndex(where: { $0.id == id }) else { return }
        var next = itinerary; next.stops[index].startMinutes = minutes; commit(next)
    }
    func move(from offsets: IndexSet, to destination: Int) {
        guard (0...itinerary.stops.count).contains(destination), offsets.allSatisfy({ itinerary.stops.indices.contains($0) }) else { return }
        var next = itinerary; let moving = offsets.sorted().map { next.stops[$0] }
        for index in offsets.sorted(by: >) { next.stops.remove(at: index) }
        next.stops.insert(contentsOf: moving, at: destination - offsets.filter { $0 < destination }.count)
        commit(next)
    }
    func undo() {
        guard let previous = history.popLast() else { return }
        itinerary = previous; persist()
    }
    private func commit(_ next: Itinerary) {
        guard next.valid && next != itinerary else { return }
        history.append(itinerary); if history.count > 20 { history.removeFirst() }
        itinerary = next; persist()
    }
    func persist() {
        guard let fileURL else { unsaved = false; return }
        do {
            if persistenceBlocked {
                try FileManager.default.copyItem(at: fileURL, to: fileURL.appendingPathExtension("unreadable-" + UUID().uuidString))
                persistenceBlocked = false
            }
            try FileManager.default.createDirectory(at: fileURL.deletingLastPathComponent(), withIntermediateDirectories: true)
            try JSONEncoder().encode(itinerary).write(to: fileURL, options: .atomic); unsaved = false; errorMessage = nil
        } catch { unsaved = true; errorMessage = "The current plan is kept in this session, but could not be saved. Try saving again." }
    }
}
